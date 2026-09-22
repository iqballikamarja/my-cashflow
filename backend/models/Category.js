const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  user: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['IN', 'OUT', 'TRANSFER'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
