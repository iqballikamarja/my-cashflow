const xlsx = require('xlsx');
const workbook = xlsx.readFile('../data.xlsx');
const sheet = workbook.Sheets['SUMMARY'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); 
let allData = {};
let ibalData = {};
let currentTable = null;
let dateRow = null;

for (let r = 0; r < data.length; r++) {
  const row = data[r];
  if (!row || !row[0]) continue;
  const firstCell = String(row[0]).trim();
  
  if (firstCell === 'OUT - ALL') { currentTable = 'ALL'; dateRow = row; continue; }
  if (firstCell === 'OUT - Ibal') { currentTable = 'Ibal'; dateRow = row; continue; }
  if (firstCell === 'Grand Total') { currentTable = null; continue; }
  
  if (currentTable && dateRow && firstCell !== 'OUT') {
     const cat = firstCell;
     for (let c = 1; c <= 8; c++) {
        const amt = parseFloat(row[c]) || 0;
        if (currentTable === 'ALL') { if (!allData[cat]) allData[cat] = {}; allData[cat][c] = amt; }
        if (currentTable === 'Ibal') { if (!ibalData[cat]) ibalData[cat] = {}; ibalData[cat][c] = amt; }
     }
  }
}

for (const cat of Object.keys(allData)) {
   for (let c = 1; c <= 8; c++) {
      const allAmt = allData[cat][c] || 0;
      const ibalAmt = (ibalData[cat] && ibalData[cat][c]) ? ibalData[cat][c] : 0;
      const zelaAmt = allAmt - ibalAmt;
      if (zelaAmt < 0) {
         console.log(`NEGATIVE ZELA: Cat=${cat}, Col=${c}, All=${allAmt}, Ibal=${ibalAmt}, Zela=${zelaAmt}`);
      }
      if (allAmt !== ibalAmt + Math.max(0, zelaAmt)) {
         console.log(`MISMATCH: Cat=${cat}, Col=${c}, All=${allAmt}, Sum=${ibalAmt + Math.max(0, zelaAmt)}`);
      }
   }
}
