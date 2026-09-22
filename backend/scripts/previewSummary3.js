const xlsx = require('xlsx');

const workbook = xlsx.readFile('../data.xlsx');
const sheet = workbook.Sheets['SUMMARY'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); 
for (let i = 25; i < Math.min(60, data.length); i++) {
  if (data[i] && data[i].length > 0) {
    console.log(i, data[i]);
  }
}
