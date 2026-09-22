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
    
    let allData = {};
    let ibalData = {};
    
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
      if (firstCell === 'OUT - Ibal') {
        currentTable = 'Ibal';
        dateRow = row;
        continue;
      }
      
      if (firstCell === 'Grand Total') {
        currentTable = null;
        continue;
      }
      
      if (currentTable && dateRow) {
         const category = firstCell;
         if (category === 'OUT') continue;

         // Jan to Aug is col 1 to 8 (ignoring col 9 which is Sept)
         for (let c = 1; c <= 8; c++) {
            const amount = parseFloat(row[c]) || 0;
            const excelDate = dateRow[c];
            let dateStr = '2026-01-01';
            if (excelDate && typeof excelDate === 'number') {
               const d = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
               dateStr = d.toISOString().split('T')[0];
            } else if (excelDate) {
               // Fallback string parser? We'll just assume index based: Jan=01, Feb=02...
               const month = String(c).padStart(2, '0');
               dateStr = `2026-${month}-01`;
            }

            if (!allData[category]) allData[category] = {};
            if (!ibalData[category]) ibalData[category] = {};

            if (currentTable === 'ALL') {
               allData[category][dateStr] = amount;
            } else if (currentTable === 'Ibal') {
               ibalData[category][dateStr] = amount;
            }
         }
      }
    }

    // Compute Zela data
    const zelaData = {};
    for (const cat of Object.keys(allData)) {
       zelaData[cat] = {};
       for (const dStr of Object.keys(allData[cat])) {
          const allAmt = allData[cat][dStr] || 0;
          const ibalAmt = (ibalData[cat] && ibalData[cat][dStr]) ? ibalData[cat][dStr] : 0;
          zelaData[cat][dStr] = allAmt - ibalAmt;
       }
    }

    const transactions = [];

    // Helper to add
    const addTransactions = (user, catData) => {
       for (const cat of Object.keys(catData)) {
          for (const dStr of Object.keys(catData[cat])) {
             const amount = catData[cat][dStr];
             if (amount > 0) {
                 transactions.push({
                   transactionId: `TX-SUM-OUT-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                   user: user,
                   date: dStr,
                   type: 'OUT',
                   account: 'CASH',
                   toAccount: '-',
                   category: cat,
                   amount: amount,
                   description: 'Rekap ' + cat,
                   source: 'Migrasi Excel'
                 });
                 transactions.push({
                   transactionId: `TX-SUM-IN-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                   user: user,
                   date: dStr,
                   type: 'IN',
                   account: 'CASH',
                   toAccount: '-',
                   category: 'Lainnya',
                   amount: amount,
                   description: 'Penyeimbang Rekap ' + cat,
                   source: 'Migrasi Excel'
                 });
             }
          }
       }
    };

    addTransactions('Iqbal', ibalData);
    addTransactions('Zela', zelaData);

    console.log(`Prepared ${transactions.length} transactions for Iqbal & Zela.`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    await Transaction.deleteMany({}); // clear previous mistakes

    await Transaction.insertMany(transactions);
    console.log('Migration of SUMMARY (Ibal & Zela) V3 successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
