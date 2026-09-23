const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'cashflow_secret_key_123!';

// Init default users (admin, iqbal, zela) if not exist
const initUsers = async () => {
  try {
    const adminCount = await User.countDocuments({ username: 'admin' });
    if (adminCount === 0) {
      const adminPass = await bcrypt.hash('admin', 10);
      await User.create({ username: 'admin', password: adminPass, role: 'admin', status: 'approved' });
      
      const iqbalPass = await bcrypt.hash('iqbal!!!', 10);
      await User.create({ username: 'iqbal', password: iqbalPass, role: 'user', status: 'approved' });
      
      const zelaPass = await bcrypt.hash('zela!!!!', 10);
      await User.create({ username: 'zela', password: zelaPass, role: 'user', status: 'approved' });
      
      console.log('✅ Default users seeded: admin, iqbal, zela');
    }
  } catch (err) {
    console.error('Error seeding users:', err);
  }
};
initUsers();

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Case insensitive search
    const user = await User.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    
    if (user.status !== 'approved') return res.status(403).json({ message: 'Akun belum di-approve oleh Admin' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password salah' });

    // Normalize username (Iqbal, Zela)
    const normUser = user.username === 'admin' ? 'admin' : user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();

    const token = jwt.sign({ id: user._id, username: normUser, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: normUser, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REGISTER (Sign up)
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (password.length < 8) return res.status(400).json({ message: 'Password minimal 8 karakter' });
    
    const existing = await User.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });
    if (existing) return res.status(400).json({ message: 'Username sudah dipakai' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username: username.toLowerCase(), password: hashed, role: 'user', status: 'pending' });
    await user.save();
    
    res.status(201).json({ message: 'Registrasi berhasil, silakan tunggu approval dari Admin' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware for protecting routes
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// GET all users (Admin only)
router.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak' });
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// APPROVE user (Admin only)
router.post('/approve', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak' });
  try {
    const { userId, status } = req.body; // status: 'approved' or 'rejected'
    const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
    res.json({ message: 'User status updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = { router, authMiddleware };
