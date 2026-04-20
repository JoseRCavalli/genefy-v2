const fs = require('fs');

// Load NAAB map (name.toLowerCase() -> NAAB code)
const naabMap = JSON.parse(fs.readFileSync('C:/granja-novo-genefy/genefy-v2/semex-naab-map.json', 'utf8'));

// Load semex CSV
const csvPath = 'C:/Users/joser/Downloads/semex-catalogo.csv';
const csv = fs.readFileSync(csvPath, 'utf8');
const rows = csv.split('\n').filter(l => l.trim());

// Column mapping (same as other CSVs)
// 0=Name, 3=TPI, 4=NM$, 8=PTAM/milk, 10=PTAF/fat, 12=PTAP/protein,
// 14=PL, 15=DPR, 16=LIV, 17=SCS, 20=PTAT, 21=UDC, 22=FLC,
// 23=SCE, 41=Rel, 166=BetaCasein, 167=KappaCasein, 168=EFI, 169=GFI

function parseNum(s) {
  if (!s || s.trim() === '' || s.trim() === '--') return null;
  const n = parseFloat(s.trim().replace(',', '.'));
  return isNaN(n) ? null : n;
}

function parseStr(s) {
  if (!s || s.trim() === '') return null;
  return s.trim();
}

const usedCodes = new Set();
let seqCount = 1;
const bulls = [];
let skipped = 0;
let matched = 0;
let fallback = 0;

// Skip header rows — find first data row
let startRow = 0;
for (let i = 0; i < Math.min(10, rows.length); i++) {
  const cols = rows[i].split(',');
  if (cols[0] && /^[A-Z]/.test(cols[0].trim()) && !isNaN(parseFloat(cols[3]))) {
    startRow = i;
    break;
  }
}

for (let i = startRow; i < rows.length; i++) {
  const cols = rows[i].split(',');
  if (cols.length < 20) { skipped++; continue; }

  const shortName = (cols[0] || '').trim();
  if (!shortName) { skipped++; continue; }

  // Look up NAAB code
  let code = naabMap[shortName.toLowerCase()];

  if (code && !usedCodes.has(code)) {
    usedCodes.add(code);
    matched++;
  } else {
    if (code) {
      // Duplicate code — use fallback
      code = null;
    }
    // Sequential fallback
    while (usedCodes.has(`200HO9${String(seqCount).padStart(4, '0')}`)) seqCount++;
    code = `200HO9${String(seqCount).padStart(4, '0')}`;
    usedCodes.add(code);
    seqCount++;
    fallback++;
  }

  const tpi = parseNum(cols[3]);
  const nm = parseNum(cols[4]);
  const milk = parseNum(cols[8]);
  const fat = parseNum(cols[10]);
  const protein = parseNum(cols[12]);
  const pl = parseNum(cols[14]);
  const dpr = parseNum(cols[15]);
  const liv = parseNum(cols[16]);
  const scs = parseNum(cols[17]);
  const ptat = parseNum(cols[20]);
  const udc = parseNum(cols[21]);
  const flc = parseNum(cols[22]);
  const sce = parseNum(cols[23]);
  const rel = parseNum(cols[41]);
  const beta = parseStr(cols[166]);
  const kappa = parseStr(cols[167]);
  const efi = parseNum(cols[168]);
  const gfi = parseNum(cols[169]);

  const parts = [`    code: '${code}'`];
  parts.push(`    short_name: ${JSON.stringify(shortName)}`);
  parts.push(`    catalog: 'Semex'`);
  if (tpi != null) parts.push(`    gtpi: ${tpi}`);
  if (nm != null) parts.push(`    net_merit: ${nm}`);
  if (milk != null) parts.push(`    milk: ${milk}`);
  if (fat != null) parts.push(`    fat: ${fat}`);
  if (protein != null) parts.push(`    protein: ${protein}`);
  if (pl != null) parts.push(`    pl: ${pl}`);
  if (dpr != null) parts.push(`    dpr: ${dpr}`);
  if (liv != null) parts.push(`    liv: ${liv}`);
  if (scs != null) parts.push(`    scs: ${scs}`);
  if (ptat != null) parts.push(`    ptat: ${ptat}`);
  if (udc != null) parts.push(`    udc: ${udc}`);
  if (flc != null) parts.push(`    flc: ${flc}`);
  if (sce != null) parts.push(`    sce: ${sce}`);
  if (rel != null) parts.push(`    reliability: ${rel}`);
  if (beta) parts.push(`    beta_casein: ${JSON.stringify(beta)}`);
  if (kappa) parts.push(`    kappa_casein: ${JSON.stringify(kappa)}`);
  if (efi != null) parts.push(`    efi: ${efi}`);
  if (gfi != null) parts.push(`    gfi: ${gfi}`);

  bulls.push(`  {\n${parts.join(',\n')},\n  }`);
}

console.log(`Bulls: ${bulls.length}, Matched: ${matched}, Fallback: ${fallback}, Skipped: ${skipped}`);

// Write output TypeScript
const output = `import type { Bull } from './matching';

export const SEMEX_BULLS: Bull[] = [
${bulls.join(',\n')}
];
`;

fs.writeFileSync('C:/granja-novo-genefy/genefy-v2/src/lib/_semex_final.ts', output);
console.log('Written to _semex_final.ts');
