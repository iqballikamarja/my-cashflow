require('dotenv').config({ path: '.env' });
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const processSheet = (data, userName) => {
  const transactions = [];
  let pendingMove = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row.Date || !row.Amount) continue;

    const dateObj = new Date(Math.round((row.Date - 25569) * 86400 * 1000));
    const dateStr = dateObj.toISOString().split('T')[0];

    const typeStr = (row.Type || '').toUpperCase().trim();
    const accStr = (row['ATM/Cash'] || 'CASH').toUpperCase().trim();
    
    if (row.Category === 'Move') {
      if (pendingMove && pendingMove.Date === row.Date && pendingMove.Amount === row.Amount && pendingMove.Type !== row.Type) {
         const fromAcc = pendingMove.Type === 'Out' ? pendingMove['ATM/Cash'] : row['ATM/Cash'];
         const toAcc = pendingMove.Type === 'In' ? pendingMove['ATM/Cash'] : row['ATM/Cash'];
         
         let desc = pendingMove.Description;
         if (pendingMove.Description !== row.Description) desc += ' / ' + row.Description;
         if (!desc) desc = 'Transfer (Auto-merged)';

         transactions.push({
           transactionId: 'TX-MIG-' + Date.now() + '-' + Math.floor(Math.random() * 1000000), user: userName,
           date: dateStr,
           type: 'TRANSFER',
           account: (fromAcc || 'CASH').toUpperCase().trim(),
           toAccount: (toAcc || 'CASH').toUpperCase().trim(),
           category: 'Pindah Saldo',
           amount: row.Amount,
           description: desc,
           source: 'Migrasi Excel'
         });
         pendingMove = null;
      } else {
         if (pendingMove) {
            const pDateObj = new Date(Math.round((pendingMove.Date - 25569) * 86400 * 1000));
            transactions.push({
               transactionId: 'TX-MIG-' + Date.now() + '-' + Math.floor(Math.random() * 1000000), user: userName,
               date: pDateObj.toISOString().split('T')[0],
               type: (pendingMove.Type === 'In' || pendingMove.Type === 'IN' ? 'IN' : 'OUT'),
               account: (pendingMove['ATM/Cash'] || 'CASH').toUpperCase().trim(),
               toAccount: '-',
               category: 'Lainnya',
               amount: pendingMove.Amount,
               description: pendingMove.Description || 'Transfer keluar',
               source: 'Migrasi Excel'
            });
         }
         pendingMove = row;
      }
    } else {
      if (pendingMove) {
         const pDateObj = new Date(Math.round((pendingMove.Date - 25569) * 86400 * 1000));
         transactions.push({
            transactionId: 'TX-MIG-' + Date.now() + '-' + Math.floor(Math.random() * 1000000), user: userName,
            date: pDateObj.toISOString().split('T')[0],
            type: (pendingMove.Type === 'In' || pendingMove.Type === 'IN' ? 'IN' : 'OUT'),
            account: (pendingMove['ATM/Cash'] || 'CASH').toUpperCase().trim(),
            toAccount: '-',
            category: 'Lainnya',
            amount: pendingMove.Amount,
            description: pendingMove.Description || 'Transfer keluar',
            source: 'Migrasi Excel'
         });
         pendingMove = null;
      }
      
      transactions.push({
         transactionId: 'TX-MIG-' + Date.now() + '-' + Math.floor(Math.random() * 1000000), user: userName,
         date: dateStr,
         type: (typeStr === 'IN' ? 'IN' : 'OUT'),
         account: accStr,
         toAccount: '-',
         category: row.Category || 'Lainnya',
         amount: row.Amount,
         description: row.Description || '-',
         source: 'Migrasi Excel'
      });
    }
  }

  if (pendingMove) {
     const pDateObj = new Date(Math.round((pendingMove.Date - 25569) * 86400 * 1000));
     transactions.push({
        transactionId: 'TX-MIG-' + Date.now() + '-' + Math.floor(Math.random() * 1000000), user: userName,
        date: pDateObj.toISOString().split('T')[0],
        type: (pendingMove.Type === 'In' || pendingMove.Type === 'IN' ? 'IN' : 'OUT'),
        account: (pendingMove['ATM/Cash'] || 'CASH').toUpperCase().trim(),
        toAccount: '-',
        category: 'Lainnya',
        amount: pendingMove.Amount,
        description: pendingMove.Description || 'Transfer keluar',
        source: 'Migrasi Excel'
     });
  }
  
  return transactions;
};

const run = async () => {
  try {
    const workbook = xlsx.readFile('../data.xlsx');
    let allTx = [];
    
    if (workbook.Sheets['Ibal']) {
      const data = xlsx.utils.sheet_to_json(workbook.Sheets['Ibal'], { range: 3 });
      allTx = allTx.concat(processSheet(data, 'Iqbal'));
    }
    if (workbook.Sheets['Zela']) {
      const data = xlsx.utils.sheet_to_json(workbook.Sheets['Zela'], { range: 3 });
      allTx = allTx.concat(processSheet(data, 'Zela'));
    }

    console.log(`Parsed total ${allTx.length} transactions from Excel.`);

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cashflow');
    console.log('Connected to DB');

    // delete old migrasi data to avoid dupes during test
    await Transaction.deleteMany({ source: 'Migrasi Excel' });

    await Transaction.insertMany(allTx);
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
