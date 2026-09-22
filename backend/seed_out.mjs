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

const iqbalOut = [
  { cat: 'Alfa', month: '03', amount: 9000 },
  { cat: 'Alfa', month: '05', amount: 60400 },
  { cat: 'Alfa', month: '07', amount: 13200 },
  { cat: 'Bathroom', month: '02', amount: 6000 },
  { cat: 'Bathroom', month: '05', amount: 13000 },
  { cat: 'Fix', month: '01', amount: 99450 },
  { cat: 'Fix', month: '02', amount: 2296568 },
  { cat: 'Fix', month: '03', amount: 2385713 },
  { cat: 'Fix', month: '04', amount: 2547050 },
  { cat: 'Fix', month: '05', amount: 2447118 },
  { cat: 'Fix', month: '06', amount: 2769227 },
  { cat: 'Fix', month: '07', amount: 2930630 },
  { cat: 'Fix', month: '08', amount: 2488189 },
  { cat: 'Iqbal', month: '02', amount: 92000 },
  { cat: 'Iqbal', month: '03', amount: 185000 },
  { cat: 'Iqbal', month: '04', amount: 10070 },
  { cat: 'Iqbal', month: '05', amount: 131000 },
  { cat: 'Iqbal', month: '06', amount: 60000 },
  { cat: 'Iqbal', month: '07', amount: 157000 },
  { cat: 'Iqbal', month: '08', amount: 186000 },
  { cat: 'Jajan', month: '02', amount: 60000 },
  { cat: 'Jajan', month: '03', amount: 450799 },
  { cat: 'Jajan', month: '04', amount: 105000 },
  { cat: 'Jajan', month: '05', amount: 289000 },
  { cat: 'Jajan', month: '06', amount: 52000 },
  { cat: 'Jajan', month: '07', amount: 74500 },
  { cat: 'Jajan', month: '08', amount: 310000 },
  { cat: 'Kitchen', month: '02', amount: 4000 },
  { cat: 'Kitchen', month: '03', amount: 79000 },
  { cat: 'Kitchen', month: '05', amount: 281000 },
  { cat: 'Kitchen', month: '06', amount: 21000 },
  { cat: 'Kitchen', month: '07', amount: 67500 },
  { cat: 'Kitchen', month: '08', amount: 224000 },
  { cat: 'Mio', month: '02', amount: 124000 },
  { cat: 'Mio', month: '03', amount: 664200 },
  { cat: 'Mio', month: '05', amount: 561000 },
  { cat: 'Mio', month: '06', amount: 85000 },
  { cat: 'Mio', month: '07', amount: 95000 },
  { cat: 'Mio', month: '08', amount: 180000 },
  { cat: 'Sedekah', month: '02', amount: 9000 },
  { cat: 'Zela', month: '07', amount: 88700 },
];

const zelaOut = [
  { cat: 'Alfa', month: '01', amount: 36400 },
  { cat: 'Alfa', month: '02', amount: 293800 },
  { cat: 'Alfa', month: '03', amount: 881962 },
  { cat: 'Alfa', month: '04', amount: 282719 },
  { cat: 'Alfa', month: '05', amount: 266472 },
  { cat: 'Alfa', month: '06', amount: 317864 },
  { cat: 'Alfa', month: '07', amount: 281000 },
  { cat: 'Alfa', month: '08', amount: 452769 },
  { cat: 'Bathroom', month: '02', amount: 28500 },
  { cat: 'Bathroom', month: '03', amount: 120488 },
  { cat: 'Bathroom', month: '04', amount: 19900 },
  { cat: 'Bathroom', month: '06', amount: 37500 },
  { cat: 'Bathroom', month: '07', amount: 50720 },
  { cat: 'Bathroom', month: '08', amount: 14491 },
  { cat: 'Fix', month: '01', amount: 15000 },
  { cat: 'Fix', month: '02', amount: 144000 },
  { cat: 'Fix', month: '03', amount: 479700 },
  { cat: 'Fix', month: '04', amount: 7250 },
  { cat: 'Fix', month: '05', amount: 256300 },
  { cat: 'Fix', month: '06', amount: 315500 },
  { cat: 'Fix', month: '07', amount: 118050 },
  { cat: 'Fix', month: '08', amount: 45500 },
  { cat: 'Iqbal', month: '02', amount: 29000 },
  { cat: 'Iqbal', month: '03', amount: 30000 },
  { cat: 'Iqbal', month: '04', amount: 64000 },
  { cat: 'Iqbal', month: '05', amount: 120000 },
  { cat: 'Iqbal', month: '06', amount: 172194 },
  { cat: 'Iqbal', month: '07', amount: 74000 },
  { cat: 'Iqbal', month: '08', amount: 109000 },
  { cat: 'Jajan', month: '01', amount: 38000 },
  { cat: 'Jajan', month: '02', amount: 304000 },
  { cat: 'Jajan', month: '03', amount: 565500 },
  { cat: 'Jajan', month: '04', amount: 402500 },
  { cat: 'Jajan', month: '05', amount: 358696 },
  { cat: 'Jajan', month: '06', amount: 590350 },
  { cat: 'Jajan', month: '07', amount: 374800 },
  { cat: 'Jajan', month: '08', amount: 252890 },
  { cat: 'Kitchen', month: '01', amount: 87000 },
  { cat: 'Kitchen', month: '02', amount: 988724 },
  { cat: 'Kitchen', month: '03', amount: 1073600 },
  { cat: 'Kitchen', month: '04', amount: 964968 },
  { cat: 'Kitchen', month: '05', amount: 621100 },
  { cat: 'Kitchen', month: '06', amount: 964700 },
  { cat: 'Kitchen', month: '07', amount: 1293273 },
  { cat: 'Kitchen', month: '08', amount: 1360204 },
  { cat: 'Loandry', month: '02', amount: 41600 },
  { cat: 'Loandry', month: '03', amount: 41000 },
  { cat: 'Loandry', month: '04', amount: 58396 },
  { cat: 'Loandry', month: '05', amount: 42900 },
  { cat: 'Loandry', month: '06', amount: 21500 },
  { cat: 'Loandry', month: '07', amount: 11000 },
  { cat: 'Loandry', month: '08', amount: 43448 },
  { cat: 'Mio', month: '02', amount: 125000 },
  { cat: 'Mio', month: '03', amount: 231500 },
  { cat: 'Mio', month: '04', amount: 181000 },
  { cat: 'Mio', month: '05', amount: 171000 },
  { cat: 'Mio', month: '06', amount: 180000 },
  { cat: 'Mio', month: '07', amount: 243500 },
  { cat: 'Mio', month: '08', amount: 149000 },
  { cat: 'Sedekah', month: '02', amount: 120000 },
  { cat: 'Sedekah', month: '03', amount: 130000 },
  { cat: 'Sedekah', month: '05', amount: 5000 },
  { cat: 'Sedekah', month: '07', amount: 2500 },
  { cat: 'Sedekah', month: '08', amount: 5000 },
  { cat: 'Zela', month: '02', amount: 24100 },
  { cat: 'Zela', month: '03', amount: 215161 },
  { cat: 'Zela', month: '04', amount: 90500 },
  { cat: 'Zela', month: '05', amount: 47011 },
  { cat: 'Zela', month: '06', amount: 33400 },
  { cat: 'Zela', month: '07', amount: 298776 },
  { cat: 'Zela', month: '08', amount: 40500 },
];

async function seed() {
  console.log('Deleting old OUT transactions for 2026...');
  await Transaction.deleteMany({ type: 'OUT', date: { $regex: '^2026' } });

  console.log('Inserting new OUT data...');
  let idCounter = 1;

  for (let item of iqbalOut) {
    await Transaction.create({
      transactionId: `TRX-SEED-IQ-OUT-${Date.now()}-${idCounter++}`,
      date: `2026-${item.month}-15`,
      user: 'Iqbal',
      type: 'OUT',
      account: 'Cash',
      category: item.cat,
      amount: item.amount,
      description: 'Data Rekap',
      source: 'System'
    });
  }

  for (let item of zelaOut) {
    await Transaction.create({
      transactionId: `TRX-SEED-ZE-OUT-${Date.now()}-${idCounter++}`,
      date: `2026-${item.month}-15`,
      user: 'Zela',
      type: 'OUT',
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
