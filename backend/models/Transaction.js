const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: String, // Format YYYY-MM-DD
    required: true
  },
  user: {
    type: String,
    required: true,
    enum: ['Iqbal', 'Zela', 'Summary']
  },
  type: {
    type: String,
    required: true,
    enum: ['IN', 'OUT', 'TRANSFER']
  },
  account: {
    type: String,
    required: true
  },
  toAccount: {
    type: String,
    default: '-'
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: '-'
  },
  source: {
    type: String,
    default: 'Web Dashboard'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
