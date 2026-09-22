import fs from 'fs';
import path from 'path';

// 1. Patch Dashboard.jsx
const dashPath = path.resolve('../cashflow-web-dashboard/frontend/src/pages/Dashboard.jsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');

// Replace getFilteredStats
const regex = /const getFilteredStats = \(\) => \{[\s\S]*?return \{[\s\S]*?balance: stats\.grandTotal \|\| 0[\s\S]*?\};\s*\};/;

const newFilteredStats = `const getFilteredStats = () => {
    let tIn = 0, tOut = 0;

    if (viewMode === 'Iqbal') {
      allTx.forEach(t => {
        if (t.user.toLowerCase() === 'iqbal') {
          if (t.type === 'IN') tIn += t.amount;
          if (t.type === 'OUT') tOut += t.amount;
        }
      });
      return {
        totalIn: tIn,
        totalOut: tOut,
        balance: stats.Iqbal?.balance || 0
      };
    } else if (viewMode === 'Zela') {
      allTx.forEach(t => {
        if (t.user.toLowerCase() === 'zela') {
          if (t.category === 'Suamiku') return;
          if (t.type === 'IN') tIn += t.amount;
          if (t.type === 'OUT') tOut += t.amount;
        }
      });
      return {
        totalIn: tIn,
        totalOut: tOut,
        balance: stats.Zela?.balance || 0
      };
    } else {
      allTx.forEach(t => {
        if (t.user === 'Zela' && t.category === 'Suamiku') return;
        if (t.type === 'IN') tIn += t.amount;
        if (t.type === 'OUT') tOut += t.amount;
      });
      return {
        totalIn: tIn,
        totalOut: tOut,
        balance: stats.grandTotal || 0
      };
    }
  };`;

if (regex.test(dashContent)) {
  dashContent = dashContent.replace(regex, newFilteredStats);
  fs.writeFileSync(dashPath, dashContent, 'utf8');
  console.log('Dashboard.jsx patched successfully!');
} else {
  console.error('Regex match failed for Dashboard.jsx');
}

// 2. Patch transactions.js
const txPath = path.resolve('../cashflow-web-dashboard/backend/routes/transactions.js');
let txContent = fs.readFileSync(txPath, 'utf8');

// In router.get('/stats')
const statsRegex = /router\.get\('\/stats', async \(req, res\) => \{[\s\S]*?res\.json\(stats\);[\s\S]*?\}\);/;

const newStatsRoute = `router.get('/stats', async (req, res) => {
  try {
    const filter = {};
    if (req.query.user) {
      filter.user = req.query.user;
    }
    if (req.query.month && req.query.year) {
      const monthStr = String(req.query.month).padStart(2, '0');
      filter.date = { $regex: new RegExp('^' + req.query.year + '-' + monthStr) };
    }
    
    const transactions = await Transaction.find(filter);

    const stats = {
      Iqbal: { totalIn: 0, totalOut: 0, balance: 0 },
      Zela: { totalIn: 0, totalOut: 0, balance: 0 },
      grandTotal: 0
    };

    transactions.forEach(t => {
        const amount = t.amount;
        if (!stats[t.user]) stats[t.user] = { totalIn: 0, totalOut: 0, balance: 0 };
        
        const isRekap = t.description === 'Data Rekap';

        if (t.type === 'IN') {
          if (!(t.user === 'Zela' && t.category === 'Suamiku')) {
            stats[t.user].totalIn += amount;
          }
          if (!isRekap) {
            stats[t.user].balance += amount;
            stats.grandTotal += amount;
          }
        } else if (t.type === 'OUT') {
          stats[t.user].totalOut += amount;
          if (!isRekap) {
            stats[t.user].balance -= amount;
            stats.grandTotal -= amount;
          }
        } else if (t.type === 'TRANSFER') {
          if (!isRekap) {
            stats[t.user].balance -= amount;
            if (t.toAccount && t.toAccount !== '-') {
              let receiver = t.user;
              if (t.toAccount.includes('-')) {
                receiver = t.toAccount.split('-')[0];
              }
              if (!stats[receiver]) stats[receiver] = { totalIn: 0, totalOut: 0, balance: 0 };
              stats[receiver].balance += amount;
            }
          }
        }
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});`;

if (statsRegex.test(txContent)) {
  txContent = txContent.replace(statsRegex, newStatsRoute);
  fs.writeFileSync(txPath, txContent, 'utf8');
  console.log('transactions.js patched successfully!');
} else {
  console.error('Regex match failed for transactions.js');
}

