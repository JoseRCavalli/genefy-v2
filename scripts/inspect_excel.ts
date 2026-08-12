import * as XLSX from 'xlsx';

const path = 'C:\\granja-novo-genefy\\Females All List USA - 11_08_2026 (1).xlsx';
const workbook = XLSX.readFile(path);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Headers:', data[0]);
console.log('Row 1:', data[1]);
console.log('Total rows:', data.length - 1);
