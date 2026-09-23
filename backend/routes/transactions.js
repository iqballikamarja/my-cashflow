const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { authMiddleware } = require('./auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true } };
    if (req.query.user) {
      filter.user = { $regex: new RegExp('^' + req.query.user + '$', 'i') };
    }

    if (req.query.month && req.query.year) {
      const monthStr = String(req.query.month).padStart(2, '0');
      filter.date = { $regex: new RegExp('^' + req.query.year + '-' + monthStr) };
    } else if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to) filter.date.$lte = req.query.to;
    }
    
    const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true } };
    if (req.query.user) {
      filter.user = { $regex: new RegExp('^' + req.query.user + '$', 'i') };
    }
    if (req.query.month && req.query.year) {
      const monthStr = String(req.query.month).padStart(2, '0');
      filter.date = { $regex: new RegExp('^' + req.query.year + '-' + monthStr) };
    } else if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to) filter.date.$lte = req.query.to;
    }
    const transactions = await Transaction.find(filter);

    const stats = {
      Iqbal: { totalIn: 0, totalOut: 0, balance: 0 },
      Zela: { totalIn: 0, totalOut: 0, balance: 0 },
      grandTotal: 0
    };

    transactions.forEach(t => {
        const amount = t.amount;
        if (!stats[t.user]) stats[t.user] = { totalIn: 0, totalOut: 0, balance: 0 };
        
        const isRekap = t.description === 'Data Rekap';

        if (t.type === 'IN') {
          stats[t.user].totalIn += amount;
          if (!isRekap) {
            stats[t.user].balance += amount;
            stats.grandTotal += amount;
          }
        } else if (t.type === 'OUT') {
          stats[t.user].totalOut += amount;
          if (!isRekap) {
            stats[t.user].balance -= amount;
            stats.grandTotal -= amount;
          }
        } else if (t.type === 'TRANSFER') {
          if (!isRekap) {
            stats[t.user].balance -= amount;
            if (t.toAccount && t.toAccount !== '-') {
              let receiver = t.user;
              if (t.toAccount.includes('-')) {
                receiver = t.toAccount.split('-')[0];
              }
              if (!stats[receiver]) stats[receiver] = { totalIn: 0, totalOut: 0, balance: 0 };
              stats[receiver].balance += amount;
            }
          }
        }
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/balances', async (req, res) => {
  try {
    const transactions = await Transaction.find({ isDeleted: { $ne: true } });
    const balances = {};

    transactions.forEach(t => {
      if (!balances[t.user]) balances[t.user] = {};
      if (!balances[t.user][t.account]) balances[t.user][t.account] = 0;

      const isRekap = t.description === 'Data Rekap';
      if (isRekap) return;

      if (t.type === 'IN') {
        balances[t.user][t.account] += t.amount;
      } else if (t.type === 'OUT') {
        balances[t.user][t.account] -= t.amount;
      } else if (t.type === 'TRANSFER') {
        balances[t.user][t.account] -= t.amount;
        if (t.toAccount && t.toAccount !== '-') {
          let receiver = t.user;
          let destAcc = t.toAccount;
          if (t.toAccount.includes('-')) {
            const parts = t.toAccount.split('-');
            receiver = parts[0];
            destAcc = parts.slice(1).join('-');
          }
          if (!balances[receiver]) balances[receiver] = {};
          if (!balances[receiver][destAcc]) balances[receiver][destAcc] = 0;
          balances[receiver][destAcc] += t.amount;
        }
      }
    });

    res.json(balances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/export', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses Ditolak' });
  try {
    const transactions = await Transaction.find().sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newTx = new Transaction({ ...req.body, user: req.user.username });
    await newTx.save();
    res.status(201).json(newTx);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && tx.user !== req.user.username) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && tx.user !== req.user.username) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await Transaction.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
