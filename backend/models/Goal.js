const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['darurat', 'survival', 'sinking'] },
  targetAmount: { type: Number, default: 0 },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: String }, // YYYY-MM
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
