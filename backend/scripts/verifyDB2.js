require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const txs = await Transaction.find({ type: 'OUT' });
  const byMonth = {};
  txs.forEach(t => {
     const m = t.date.substring(0, 7);
     if (!byMonth[m]) byMonth[m] = 0;
     byMonth[m] += t.amount;
  });
  console.log("Gabungan Totals:", byMonth);
  process.exit(0);
};
run();
