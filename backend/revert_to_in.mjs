import mongoose from 'mongoose';
mongoose.connect(process.env.MONGODB_URI);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
async function migrate() {
  console.log('Migrating Suamiku transactions back to IN...');
  const txs = await Transaction.find({ category: 'Suamiku' });
  for (let t of txs) {
    await Transaction.updateOne(
      { _id: t._id },
      { $set: { type: 'IN', user: 'Zela', account: 'Cash', toAccount: '-' } }
    );
  }
  console.log('Migration complete!');
  process.exit(0);
}
migrate();
