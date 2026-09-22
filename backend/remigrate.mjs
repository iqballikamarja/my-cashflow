import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI);

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));

async function migrate() {
  console.log('Migrating Zela Suamiku transactions to TRANSFER...');
  const txs = await Transaction.find({ category: 'Suamiku' });
  
  console.log(`Found ${txs.length} transactions to migrate.`);
  
  for (let t of txs) {
    await Transaction.updateOne(
      { _id: t._id },
      { $set: { type: 'TRANSFER', user: 'Iqbal', account: 'Cash', toAccount: 'Zela-Cash' } }
    );
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrate();
