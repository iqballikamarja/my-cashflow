const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const Transaction = require('../models/Transaction');

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzcFxRJusI7xVOMxw9X9JhuJzGQeQZzIwv66rgwxRN5vZ9u9WrB_YjfRw3JqOn0B6M8UQ/exec';

async function fetchGAS(action) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
    redirect: 'follow'
  });
  const text = await res.text();
  if (text.startsWith('<')) {
    throw new Error('GAS returned HTML instead of JSON. Try re-deploying Code.gs.');
  }
  return JSON.parse(text);
}

async function migrate() {
  console.log('Memulai migrasi data dari Google Sheets ke MongoDB...\n');
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI belum di-set'); process.exit(1); }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Terhubung ke MongoDB Atlas');
  console.log('Mengambil data dari Google Sheets...');

  const result = await fetchGAS('get_all_transactions');
  if (result.status !== 'success') {
    console.error('Gagal:', result.message);
    await mongoose.disconnect();
    process.exit(1);
  }

  const transactions = result.transactions;
  console.log('Ditemukan ' + transactions.length + ' transaksi\n');
  if (transactions.length === 0) { console.log('Tidak ada data.'); await mongoose.disconnect(); return; }

  let inserted = 0, skipped = 0, errors = 0;
  for (const t of transactions) {
    try {
      const existing = await Transaction.findOne({ transactionId: t.transactionId });
      if (existing) { skipped++; continue; }
      let dateStr = t.date;
      if (dateStr && dateStr.includes('GMT')) {
        const d = new Date(dateStr);
        dateStr = d.toISOString().split('T')[0];
      } else if (dateStr && dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }
      await Transaction.create({
        transactionId: t.transactionId, date: dateStr, user: t.user, type: t.type,
        account: t.account, toAccount: t.toAccount || '-', category: t.category || '-',
        amount: t.amount, description: t.description || '-', source: t.source || 'Google Sheets'
      });
      inserted++;
    } catch (err) { errors++; console.error('  Error: ' + t.transactionId + ' - ' + err.message); }
  }

  console.log('=======================================');
  console.log('Berhasil insert : ' + inserted);
  console.log('Sudah ada (skip): ' + skipped);
  console.log('Error           : ' + errors);
  console.log('=======================================\n');
  await mongoose.disconnect();
  console.log('Migrasi selesai!');
}

migrate().catch(err => { console.error('Fatal:', err); process.exit(1); });
