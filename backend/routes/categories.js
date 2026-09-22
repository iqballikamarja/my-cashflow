const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authMiddleware } = require('./auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, type } = req.body;
    const user = (req.user.role === 'admin' && req.body.user) ? req.body.user : req.user.username;
    
    const existing = await Category.findOne({ 
      user: { $regex: new RegExp('^' + user + '$', 'i') }, 
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      type
    });

    if (existing) {
      return res.status(400).json({ message: 'Kategori sudah ada untuk jenis ini' });
    }

    const category = new Category({ user, name, type });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambah kategori', error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.user = req.user.username;
    }
    const categories = await Category.find(query).sort({ type: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil kategori', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Kategori tidak ditemukan' });

    if (req.user.role !== 'admin' && category.user !== req.user.username) {
      return res.status(403).json({ message: 'Tidak ada akses' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kategori dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus kategori', error: error.message });
  }
});

module.exports = router;
