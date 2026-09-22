import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI);

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));

async function migrate() {
  console.log('Reverting Zela Suamiku transactions back to IN...');
  const txs = await Transaction.find({ user: 'Iqbal', category: 'Suamiku', type: 'TRANSFER' });
  
  console.log(`Found ${txs.length} transactions to revert.`);
  
  for (let t of txs) {
    t.type = 'IN';
    t.user = 'Zela';
    // keep account as is, it doesn't matter much for IN
    await t.save();
  }
  
  console.log('Revert complete!');
  process.exit(0);
}

migrate();
