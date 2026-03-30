import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'Username, email and password are required' });

    const existing = await User.findByEmail(email);
    if (existing)
      return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash, role });
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

    const user = await User.findByUsername(username);
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

    res.json({ token, user: { id: user.UserID, username: user.Username, email: user.Email, role: user.Role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};