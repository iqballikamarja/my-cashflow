const xlsx = require('xlsx');

const workbook = xlsx.readFile('../data.xlsx');
const sheet = workbook.Sheets['SUMMARY'];
if (!sheet) {
  console.log("Sheet SUMMARY not found. Available sheets:", workbook.SheetNames);
  process.exit(1);
}

const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); 
console.log("First 15 rows of SUMMARY sheet:");
for (let i = 0; i < Math.min(15, data.length); i++) {
  console.log(data[i]);
}
