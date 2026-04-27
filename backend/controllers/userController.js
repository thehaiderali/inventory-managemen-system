import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    console.log('Users found:', users);
    res.json(users);
  } catch (err) { 
    console.error('getUsers error:', err);
    res.status(500).json({ message: err.message }); 
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.update(req.params.id, req.body);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteUser = async (req, res) => {
  try {
    await User.delete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    const valid = await bcrypt.compare(currentPassword, user.PasswordHash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.update(req.user.userId, { ...user, passwordHash });
    res.json({ message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};