import mongoose from 'mongoose';
mongoose.connect(process.env.MONGODB_URI);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));

async function run() {
  const transactions = await Transaction.find({});
  const stats = {
    Iqbal: { totalIn: 0, totalOut: 0, balance: 0 },
    Zela: { totalIn: 0, totalOut: 0, balance: 0 },
    grandTotal: 0
  };
  transactions.forEach(t => {
    const amount = t.amount;
    if (!stats[t.user]) stats[t.user] = { totalIn: 0, totalOut: 0, balance: 0 };
    
    const isSuamiku = t.user === 'Zela' && t.category === 'Suamiku';
    const isRekap = t.description === 'Data Rekap';

    if (t.type === 'IN') {
      stats[t.user].totalIn += amount;
      if (!isRekap) {
        stats[t.user].balance += amount;
        if (!isSuamiku) stats.grandTotal += amount;
      }
    } else if (t.type === 'OUT') {
      stats[t.user].totalOut += amount;
      if (!isRekap) {
        stats[t.user].balance -= amount;
        stats.grandTotal -= amount;
      }
    }
  });
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
}
run();
