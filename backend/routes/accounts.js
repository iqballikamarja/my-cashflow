const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const { authMiddleware } = require('./auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const user = (req.user.role === 'admin' && req.body.user) ? req.body.user : req.user.username;
    
    const existing = await Account.findOne({ 
      user: { $regex: new RegExp('^' + user + '$', 'i') }, 
      name: { $regex: new RegExp('^' + name + '$', 'i') } 
    });

    if (existing) {
      return res.status(400).json({ message: 'Rekening sudah ada' });
    }

    const account = new Account({ user, name });
    await account.save();
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: { $regex: new RegExp('^' + req.user.username + '$', 'i') } };
    const accounts = await Account.find(query);
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/all', authMiddleware, async (req, res) => {
  try {
    const accounts = await Account.find({});
    const grouped = {};
    accounts.forEach(a => {
      const u = a.user.charAt(0).toUpperCase() + a.user.slice(1).toLowerCase();
      if (!grouped[u]) grouped[u] = [];
      if (!grouped[u].includes(a.name)) grouped[u].push(a.name);
    });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:name/:user', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses ditolak' });
  try {
    await Account.findOneAndDelete({ 
      name: { $regex: new RegExp('^' + req.params.name + '$', 'i') }, 
      user: { $regex: new RegExp('^' + req.params.user + '$', 'i') } 
    });
    res.json({ message: 'Rekening dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
