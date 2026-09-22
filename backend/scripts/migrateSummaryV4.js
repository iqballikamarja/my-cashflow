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
    const transactions = [];
    
    let currentTable = null;
    let dateRow = null;

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (!row || !row[0]) continue;
      
      const firstCell = String(row[0]).trim();
      
      if (firstCell === 'OUT - ALL') {
        currentTable = 'ALL';
        dateRow = row;
        continue;
      }
      
      if (firstCell === 'Grand Total') {
        if (currentTable === 'ALL') break; // stop after parsing Gabungan
        continue;
      }
      
      if (currentTable === 'ALL' && dateRow) {
         const category = firstCell;
         if (category === 'OUT') continue;

         // Jan to Aug is col 1 to 8 (ignoring Sept)
         for (let c = 1; c <= 8; c++) {
            const amount = parseFloat(row[c]);
            if (amount && amount > 0) {
               const excelDate = dateRow[c];
               let dateStr = '2026-01-01';
               if (excelDate && typeof excelDate === 'number') {
                  const d = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                  dateStr = d.toISOString().split('T')[0];
               } else if (excelDate) {
                  const month = String(c).padStart(2, '0');
                  dateStr = `2026-${month}-01`;
               }
               
               transactions.push({
                 transactionId: `TX-SUM-OUT-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                 user: 'Summary',
                 date: dateStr,
                 type: 'OUT',
                 account: 'CASH',
                 toAccount: '-',
                 category: category,
                 amount: amount,
                 description: 'Rekap ' + category,
                 source: 'Migrasi Excel'
               });
               
               transactions.push({
                 transactionId: `TX-SUM-IN-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                 user: 'Summary',
                 date: dateStr,
                 type: 'IN',
                 account: 'CASH',
                 toAccount: '-',
                 category: 'Lainnya',
                 amount: amount,
                 description: 'Penyeimbang Rekap ' + category,
                 source: 'Migrasi Excel'
               });
            }
         }
      }
    }

    console.log(`Prepared ${transactions.length} transactions for Summary (Gabungan ONLY).`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    await Transaction.deleteMany({}); // clear everything

    await Transaction.insertMany(transactions);
    console.log('Migration of SUMMARY (Gabungan) V4 successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
