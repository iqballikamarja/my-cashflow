require('dotenv').config({ path: '.env' });
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const run = async () => {
  try {
    const workbook = xlsx.readFile('../data.xlsx');
    const sheet = workbook.Sheets['SUMMARY'];
    if (!sheet) throw new Error('Sheet SUMMARY not found');
    
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); 
    const dateRow = data[2]; // ['OUT - ALL', 46023, ...]
    
    const transactions = [];

    // loop categories (row 3 onwards, stop before Grand Total)
    for (let r = 3; r < data.length; r++) {
      const row = data[r];
      if (!row || !row[0]) continue;
      if (row[0] === 'Grand Total' || row[0] === 'OUT') break; // stop at footer
      
      const category = row[0];
      
      // loop months (col 1 to 8: Jan - Aug)
      for (let c = 1; c <= 8; c++) {
        const amount = parseFloat(row[c]);
        if (amount && amount > 0) {
          const excelDate = dateRow[c];
          let dateStr = '2026-01-01'; // fallback
          if (excelDate) {
             const d = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
             dateStr = d.toISOString().split('T')[0];
          }

          transactions.push({
            transactionId: 'TX-SUM-' + Date.now() + '-' + Math.floor(Math.random() * 1000000) + '-' + r + c,
            user: 'Summary',
            date: dateStr,
            type: 'OUT',
            account: 'REKAP',
            toAccount: '-',
            category: category,
            amount: amount,
            description: 'Rekapitulasi ' + category,
            source: 'Migrasi Excel'
          });
        }
      }
    }

    console.log(`Prepared ${transactions.length} summary transactions.`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // delete old summary data if exists
    await Transaction.deleteMany({ user: 'Summary' });

    await Transaction.insertMany(transactions);
    console.log('Migration of SUMMARY successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
