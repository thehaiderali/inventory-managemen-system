import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: 'Username, email and password are required' });

    // NEW: trim and lowercase for consistent storage
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // NEW: basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail))
      return res.status(400).json({ message: 'Invalid email format' });

    // NEW: role whitelist — only accept known roles
    const allowedRoles = ['hero', 'admin', 'observer'];
    const assignedRole = role && allowedRoles.includes(role) ? role : 'hero';

    const existing = await User.findByEmail(cleanEmail);
    if (existing)
      return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: cleanUsername, email: cleanEmail, passwordHash, role: assignedRole });

    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Username and password are required' });

    const user = await User.findByUsername(username.trim());
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.PasswordHash);
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.IsActive)
      return res.status(403).json({ message: 'Account is deactivated' });

    const token = jwt.sign(
      { userId: user.UserID, username: user.Username, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // NEW: log successful login timestamp (fire-and-forget, doesn't block response)
    User.updateLastLogin(user.UserID).catch(() => {});

    res.json({ token, user: { id: user.UserID, username: user.Username, email: user.Email, role: user.Role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// NEW: POST /api/auth/logout
// Client should delete the token — this endpoint exists for audit logging
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // log the logout event without blocking
      User.updateLastLogin(decoded.userId).catch(() => {});
    }
    res.json({ message: 'Logged out successfully' });
  } catch {
    // even if token is already expired, logout should succeed
    res.json({ message: 'Logged out successfully' });
  }
};

// NEW: GET /api/auth/me
// Returns the currently authenticated user's profile from the token
export const me = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    if (!user.IsActive)
      return res.status(403).json({ message: 'Account is deactivated' });

    res.json({ id: user.UserID, username: user.Username, email: user.Email, role: user.Role });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
