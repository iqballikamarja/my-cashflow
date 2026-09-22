import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI);

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));

async function migrate() {
  console.log('Reverting Zela Suamiku transactions back to IN...');
  const txs = await Transaction.find({ category: 'Suamiku' });
  
  console.log(`Found ${txs.length} transactions to revert.`);
  
  for (let t of txs) {
    await Transaction.updateOne(
      { _id: t._id },
      { $set: { type: 'IN', user: 'Zela', account: 'Cash', toAccount: '-' } }
    );
  }
  
  console.log('Revert complete!');
  process.exit(0);
}

migrate();
