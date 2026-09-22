const xlsx = require('xlsx');
const workbook = xlsx.readFile('../data.xlsx');
const sheet = workbook.Sheets['SUMMARY'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); 
data.forEach((row, rIdx) => {
  row.forEach((cell, cIdx) => {
    if (String(cell).toLowerCase().includes('zela')) {
      console.log(`Found Zela at row ${rIdx}, col ${cIdx}: ${cell}`);
    }
  });
});
