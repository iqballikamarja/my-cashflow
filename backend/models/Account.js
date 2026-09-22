const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  user: { type: String, required: true },
  name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Account', AccountSchema);
