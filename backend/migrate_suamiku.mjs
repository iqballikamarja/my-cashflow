import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI);

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  user: { type: String, required: true },
  type: { type: String, required: true },
  account: { type: String, required: true },
  toAccount: { type: String, default: '-' },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '-' },
  source: { type: String, default: 'Web Dashboard' },
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

async function migrate() {
  console.log('Migrating Zela Suamiku transactions...');
  const txs = await Transaction.find({ user: 'Zela', category: 'Suamiku', type: 'IN' });
  
  console.log(`Found ${txs.length} transactions to migrate.`);
  
  for (let t of txs) {
    t.type = 'TRANSFER';
    t.user = 'Iqbal';
    t.account = 'Cash';
    t.toAccount = 'Zela-Cash';
    await t.save();
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrate();
