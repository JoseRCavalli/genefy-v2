const fs = require('fs');

const catalogPath = 'C:/granja-novo-genefy/genefy-v2/src/lib/catalog-bulls.ts';
const semexPath = 'C:/granja-novo-genefy/genefy-v2/src/lib/_semex_final.ts';

const catalog = fs.readFileSync(catalogPath, 'utf8');
const semexFinal = fs.readFileSync(semexPath, 'utf8');

// Extract only the array body from _semex_final.ts (between first [ and matching ])
const semexLines = semexFinal.split('\n');
// Find start of array content (after "export const SEMEX_BULLS: Bull[] = [")
const startIdx = semexLines.findIndex(l => l.includes('SEMEX_BULLS: Bull[]'));
// Content starts from next line after "[", ends before the final "];"
// We want to extract just the entries
const bodyStart = startIdx + 1; // the "[" line
let bodyEnd = semexLines.length - 2; // before closing "];"
// Find the last "];" in the file
for (let i = semexLines.length - 1; i >= 0; i--) {
  if (semexLines[i].trim() === '];') { bodyEnd = i - 1; break; }
}

const newArrayBody = semexLines.slice(bodyStart, bodyEnd + 1).join('\n');

// Now replace in catalog-bulls.ts
// The SEMEX_BULLS array starts at "export const SEMEX_BULLS: Bull[] = ["
// and ends at the first standalone "];"
const catalogLines = catalog.split('\n');
let semexStart = -1;
let semexEnd = -1;

for (let i = 0; i < catalogLines.length; i++) {
  if (catalogLines[i].includes('export const SEMEX_BULLS') && catalogLines[i].includes('Bull[]')) {
    semexStart = i;
  }
  if (semexStart !== -1 && semexEnd === -1 && catalogLines[i].trim() === '];' && i > semexStart) {
    semexEnd = i;
    break;
  }
}

console.log(`SEMEX_BULLS: lines ${semexStart + 1} to ${semexEnd + 1}`);

// Replace the array content (everything between "[" and "]")
// Line semexStart has "export const SEMEX_BULLS: Bull[] = ["
// Line semexEnd has "];"
// We need to keep semexStart's "export const SEMEX_BULLS: Bull[] = ["
// and semexEnd's "];" but replace the body

const before = catalogLines.slice(0, semexStart + 1).join('\n'); // includes the "[" line
const after = catalogLines.slice(semexEnd).join('\n');            // includes the "];" line

const newCatalog = before + '\n' + newArrayBody + '\n' + after;

fs.writeFileSync(catalogPath, newCatalog);
console.log('Done! catalog-bulls.ts updated with real Semex NAAB codes.');
console.log('New file line count:', newCatalog.split('\n').length);

// Verify Timetraveler
if (newCatalog.includes("code: '200HO13678'")) {
  console.log('✓ Timetraveler has correct code 200HO13678');
} else {
  console.log('✗ WARNING: Timetraveler code not found!');
}
