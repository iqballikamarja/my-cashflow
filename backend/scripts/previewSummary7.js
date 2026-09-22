const xlsx = require('xlsx');
const workbook = xlsx.readFile('../data.xlsx');
const sheet = workbook.Sheets['SUMMARY'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); 
console.log("data.length:", data.length);
for (let i = 0; i < 20; i++) {
  if (data[i]) {
     const cols = data[i].map((c, idx) => c !== undefined && c !== null ? `[${idx}]:${c}` : '').filter(c => c !== '');
     if (cols.length > 0) {
       console.log(i, cols.join(' | '));
     }
  }
}
