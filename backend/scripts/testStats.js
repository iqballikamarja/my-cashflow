require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const transactions = await Transaction.find({});
  const stats = {
    Iqbal: { totalIn: 0, totalOut: 0, balance: 0 },
    Zela: { totalIn: 0, totalOut: 0, balance: 0 },
    grandTotal: 0
  };
  transactions.forEach(t => {
     if (!stats[t.user]) stats[t.user] = { totalIn: 0, totalOut: 0, balance: 0 };
     if (t.type === 'IN') {
       stats[t.user].totalIn += t.amount;
       stats[t.user].balance += t.amount;
       stats.grandTotal += t.amount;
     } else if (t.type === 'OUT') {
       stats[t.user].totalOut += t.amount;
       stats[t.user].balance -= t.amount;
       stats.grandTotal -= t.amount;
     }
  });
  console.log(stats);
  process.exit(0);
};
run();
