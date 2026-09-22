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

const iqbalData = [
  { cat: 'Gaji', month: '02', amount: 4353235 },
  { cat: 'Gaji', month: '03', amount: 6790507 },
  { cat: 'Gaji', month: '04', amount: 4323235 },
  { cat: 'Gaji', month: '05', amount: 4398235 },
  { cat: 'Gaji', month: '06', amount: 4383235 },
  { cat: 'Gaji', month: '07', amount: 4383235 },
  { cat: 'Gaji', month: '08', amount: 4383235 },
  { cat: 'Tiktok', month: '08', amount: 217506 },
  { cat: 'Lainnya', month: '01', amount: 248113 },
  { cat: 'Lainnya', month: '02', amount: 231491 },
  { cat: 'Lainnya', month: '03', amount: 432440 },
  { cat: 'Lainnya', month: '04', amount: 229118 },
  { cat: 'Lainnya', month: '05', amount: 789604 },
  { cat: 'Lainnya', month: '06', amount: 777384 },
  { cat: 'Lainnya', month: '07', amount: 503359 },
  { cat: 'Lainnya', month: '08', amount: 802812 },
];

const zelaData = [
  { cat: 'Suamiku', month: '01', amount: 200000 },
  { cat: 'Suamiku', month: '02', amount: 2018441 },
  { cat: 'Suamiku', month: '03', amount: 3550700 },
  { cat: 'Suamiku', month: '04', amount: 1920088 },
  { cat: 'Suamiku', month: '05', amount: 1570500 },
  { cat: 'Suamiku', month: '06', amount: 2100437 },
  { cat: 'Suamiku', month: '07', amount: 1630239 },
  { cat: 'Suamiku', month: '08', amount: 2161624 },
  { cat: 'Tiktok', month: '02', amount: 11566 },
  { cat: 'Tiktok', month: '03', amount: 131576 },
  { cat: 'Tiktok', month: '04', amount: 181000 },
  { cat: 'Tiktok', month: '05', amount: 158158 },
  { cat: 'Tiktok', month: '06', amount: 340731 },
  { cat: 'Tiktok', month: '07', amount: 1287555 },
  { cat: 'Tiktok', month: '08', amount: 407438 },
  { cat: 'Lainnya', month: '01', amount: 27737 },
  { cat: 'Lainnya', month: '02', amount: 94000 },
  { cat: 'Lainnya', month: '03', amount: 188100 },
  { cat: 'Lainnya', month: '05', amount: 320000 },
  { cat: 'Lainnya', month: '06', amount: 123885 },
  { cat: 'Lainnya', month: '08', amount: 50000 },
];

async function seed() {
  console.log('Deleting old IN transactions for 2026...');
  await Transaction.deleteMany({ type: 'IN', date: { $regex: '^2026' } });

  console.log('Inserting new data...');
  let idCounter = 1;

  for (let item of iqbalData) {
    await Transaction.create({
      transactionId: `TRX-SEED-IQ-IN-${Date.now()}-${idCounter++}`,
      date: `2026-${item.month}-15`,
      user: 'Iqbal',
      type: 'IN',
      account: 'Cash',
      category: item.cat,
      amount: item.amount,
      description: 'Data Rekap',
      source: 'System'
    });
  }

  for (let item of zelaData) {
    await Transaction.create({
      transactionId: `TRX-SEED-ZE-IN-${Date.now()}-${idCounter++}`,
      date: `2026-${item.month}-15`,
      user: 'Zela',
      type: 'IN',
      account: 'Cash',
      category: item.cat,
      amount: item.amount,
      description: 'Data Rekap',
      source: 'System'
    });
  }

  console.log('Done!');
  process.exit(0);
}

seed();
