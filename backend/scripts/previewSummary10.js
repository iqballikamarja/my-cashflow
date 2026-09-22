const xlsx = require('xlsx');
const workbook = xlsx.readFile('../data.xlsx');
const sheet = workbook.Sheets['SUMMARY'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); 
for (let i = 0; i < 30; i++) {
  if (data[i]) {
     const hasZela = data[i].some(c => String(c).includes('Zela'));
     if (hasZela) {
       console.log("Row", i, "contains Zela");
       console.log(data[i].map((c, idx) => c !== undefined && c !== null ? `[${idx}]:${c}` : '').filter(c => c !== '').join(' | '));
     }
  }
}
