import mongoose from 'mongoose';
mongoose.connect(process.env.MONGODB_URI);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
async function run() {
  const txs = await Transaction.find({ user: 'Zela', type: 'OUT', category: 'Suamiku' });
  console.log("Zela OUT Suamiku:", txs.length);
  process.exit(0);
}
run();
