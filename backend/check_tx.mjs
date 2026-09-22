import mongoose from 'mongoose';
mongoose.connect(process.env.MONGODB_URI);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
async function run() {
  const t = await Transaction.find({ category: 'Suamiku' });
  console.log(JSON.stringify(t, null, 2));
  process.exit(0);
}
run();
