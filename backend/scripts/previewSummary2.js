const xlsx = require('xlsx');

const workbook = xlsx.readFile('../data.xlsx');
const sheet = workbook.Sheets['SUMMARY'];
if (!sheet) {
  console.log("Sheet SUMMARY not found.");
  process.exit(1);
}

const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); 
console.log("Rows 1 to 40 of SUMMARY sheet:");
for (let i = 0; i < Math.min(40, data.length); i++) {
  console.log(i, data[i]);
}
