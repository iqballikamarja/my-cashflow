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
    
    let currentTable = null; // 'Iqbal' or 'Zela'
    let dateRow = null;

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (!row || !row[0]) continue;
      
      const firstCell = String(row[0]).trim();
      
      if (firstCell === 'OUT - Ibal') {
        currentTable = 'Iqbal';
        dateRow = row;
        continue;
      }
      if (firstCell === 'OUT - Zela') {
        currentTable = 'Zela';
        dateRow = row;
        continue;
      }
      
      if (firstCell === 'Grand Total') {
        if (currentTable) {
           currentTable = null; // end of current block
        }
        continue;
      }
      
      if (currentTable && dateRow) {
         // this is a category row
         const category = firstCell;
         
         // col 1 to 9 (Jan to Sept)
         for (let c = 1; c <= 9; c++) {
            const amount = parseFloat(row[c]);
            if (amount && amount > 0) {
               const excelDate = dateRow[c];
               let dateStr = '2026-01-01';
               if (excelDate) {
                  if (typeof excelDate === 'number') {
                     const d = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                     dateStr = d.toISOString().split('T')[0];
                  } else {
                     dateStr = '2026-09-01'; 
                  }
               }
               
               // Insert OUT transaction
               transactions.push({
                 transactionId: 'TX-SUM-OUT-' + Date.now() + '-' + Math.floor(Math.random() * 1000000) + '-' + r + c,
                 user: currentTable,
                 date: dateStr,
                 type: 'OUT',
                 account: 'CASH',
                 toAccount: '-',
                 category: category,
                 amount: amount,
                 description: 'Rekap ' + category,
                 source: 'Migrasi Excel'
               });
               
               // Insert IN transaction to balance it out
               transactions.push({
                 transactionId: 'TX-SUM-IN-' + Date.now() + '-' + Math.floor(Math.random() * 1000000) + '-' + r + c,
                 user: currentTable,
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

    console.log(`Prepared ${transactions.length} transactions for Iqbal & Zela.`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    await Transaction.deleteMany({}); // clear any previous db

    await Transaction.insertMany(transactions);
    console.log('Migration of SUMMARY (Ibal & Zela) successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
