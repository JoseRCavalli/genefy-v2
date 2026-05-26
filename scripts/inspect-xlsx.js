const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', 'Females All List USA - 24_05_2026.xlsx'));
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { defval: null });

console.log('Sheet name:', wb.SheetNames[0]);
console.log('Total rows:', data.length);
console.log('\n--- COLUMNS ---');
const cols = Object.keys(data[0] || {});
cols.forEach(c => console.log(`  "${c}"`));
console.log('\n--- FIRST 3 ROWS (sample) ---');
data.slice(0, 3).forEach((row, i) => {
  console.log(`\nRow ${i}:`);
  for (const [k, v] of Object.entries(row)) {
    console.log(`  ${k}: ${JSON.stringify(v)}`);
  }
});

// Check for ID patterns
console.log('\n--- ID ANALYSIS (first 10) ---');
data.slice(0, 10).forEach(row => {
  console.log(`  REG ID="${row['REG ID']}"  ID="${row['ID']}"  BREED="${row['BREED']}"`);
});
