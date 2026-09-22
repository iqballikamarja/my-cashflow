require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await Transaction.deleteMany({ description: 'Data Rekap' });
    console.log(`Deleted ${result.deletedCount} rekap transactions.`);
    
    // Also delete any transactions from before Sep 2026 just to be sure if requested
    // const result2 = await Transaction.deleteMany({ date: { $regex: '^2026-0[1-8]' } });
    // console.log(`Deleted ${result2.deletedCount} Jan-Aug transactions.`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
};
run();
