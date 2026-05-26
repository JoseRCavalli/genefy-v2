/**
 * import-females-xlsx.js — Genefy v2
 * 
 * Reads the CDCB Excel file and generates:
 * 1. A normalized JSON file (females_cdcb_data.json)
 * 2. Updates data.ts BASE_FEMALES with enriched data
 * 
 * Usage: node scripts/import-females-xlsx.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// ─── Excel date conversion ─────────────────────────────────────────────────
function excelDateToISO(serial) {
  if (!serial || typeof serial !== 'number') return null;
  // Excel epoch: Jan 1, 1900 (with the famous leap year bug)
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Safe number parser ─────────────────────────────────────────────────────
function num(v, decimals) {
  if (v === null || v === undefined || v === '' || v === 'NaN') return null;
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  if (decimals !== undefined) return parseFloat(n.toFixed(decimals));
  return n;
}

function str(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

// ─── Main ───────────────────────────────────────────────────────────────────
const xlsxPath = path.join(__dirname, '..', 'Females All List USA - 24_05_2026.xlsx');
console.log(`📂 Reading: ${xlsxPath}`);

const wb = XLSX.readFile(xlsxPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(ws, { defval: null });

console.log(`📊 Total rows in Excel: ${rawData.length}`);

// ─── Map each row ──────────────────────────────────────────────────────────
const females = rawData.map(row => {
  const bdate = excelDateToISO(row['BDATE']);
  const ageMonths = num(row['Age In Months'], 0);

  return {
    // Identification
    id: String(row['ID'] || row['REG ID'] || '').trim(),
    reg_id: String(row['REG ID'] || row['ID'] || '').trim(),
    breed: str(row['BREED']) || 'HO',
    age: ageMonths,
    lact: num(row['LACT'], 0) ?? 0,
    dim: num(row['DIM'], 0),
    bdate: bdate,

    // Genomic inbreeding
    ginb: num(row['gINB'], 2),
    gefi: num(row['gEFI'], 2),

    // Economic merit
    net_merit: num(row['NET MERIT'], 0),
    tpi: num(row['TPI'], 0),
    cheese_merit: num(row['CHEESE MERIT'], 0),
    fluid_merit: num(row['FLUID MERIT'], 0),

    // Production
    milk: num(row['MILK'], 0),
    fat: num(row['FAT'], 0),
    fat_pct: num(row['FAT PERCENT'], 2),
    protein: num(row['PROTEIN'], 0),
    protein_pct: num(row['PROTEIN PERCENT'], 2),
    productive_life: num(row['PRODUCTIVE LIFE'], 2),
    feed_efficiency: num(row['FEED EFFICIENCY'], 0),

    // Fertility
    dpr: num(row['DAUGHTER PREGNANCY RATE'], 2),
    hcr: num(row['HEIFER CONCEPTION RATE'], 2),
    ccr: num(row['COW CONCEPTION RATE'], 2),
    fertility_index: num(row['FERTILITY INDEX'], 2),
    early_first_calving: num(row['EARLY FIRST CALVING'], 2),

    // Health
    scs: num(row['SOMATIC CELL SCORE'], 2),
    health_index: num(row['HEALTH INDEX'], 2),
    mastitis: num(row['MASTITITS'], 2),
    livability: num(row['LIVABILITY'], 2),
    heifer_livability: num(row['HEIFER LIVABILITY'], 2),

    // Calving
    sire_calving_ease: num(row['SIRE CALVING EASE'], 2),
    daughter_calving_ease: num(row['DAUGHTER CALVING EASE'], 2),
    sire_stillbirth: num(row['SIRE STILLBIRTH'], 2),
    daughter_stillbirth: num(row['DAUGHTER STILLBIRTH'], 2),

    // Composites
    ptat: num(row['PTAT'], 2),
    udc: num(row['UDC'], 2),
    flc: num(row['FLC'], 2),
    bde: num(row['BDE'], 2),
    dfm: num(row['DFM'], 2),

    // Conformation traits
    sta: num(row['STA'], 2),
    str_val: num(row['STR'], 2),  // 'str' is reserved, use str_val
    fls: num(row['FLS'], 2),
    fta: num(row['FTA'], 2),
    ftp: num(row['FTP'], 2),
    fua: num(row['FUA'], 2),
    rlr: num(row['RLR'], 2),
    rls: num(row['RLS'], 2),
    rpa: num(row['RPA'], 2),
    rtp: num(row['RTP'], 2),
    ruh: num(row['RUH'], 2),
    ruw: num(row['RUW'], 2),
    tlg: num(row['TLG'], 2),
    trw: num(row['TRW'], 2),
    ucl: num(row['UCL'], 2),
    udp: num(row['UDP'], 2),

    // Pedigree
    sire_naab: str(row['SIRE NAAB']) || '',
    sire_name: str(row['SIRE NAME']) || '',
    sire_reg: str(row['SIRE REG']),
    mgs_naab: str(row['MGS NAAB']) || '',
    mgs_name: str(row['MGS Name']),
    dam_reg: str(row['DAM REG']),
    dam_animal_id: str(row['DAM ID']),

    // Casein genotyping
    beta_casein: str(row['BCN A2_GV']),
    kappa_casein: str(row['KCN Haplotype_GV']),
  };
}).filter(f => f.id && f.id !== '');

console.log(`✅ Processed ${females.length} females`);

// ─── Write JSON file ────────────────────────────────────────────────────────
const jsonPath = path.join(__dirname, '..', 'females_cdcb_data.json');
fs.writeFileSync(jsonPath, JSON.stringify(females, null, 2), 'utf8');
console.log(`💾 Saved: ${jsonPath}`);

// ─── Generate data.ts update ────────────────────────────────────────────────
// Read existing data.ts to preserve BASE_BULLS
const dataPath = path.join(__dirname, '..', 'src', 'lib', 'data.ts');
const dataContent = fs.readFileSync(dataPath, 'utf8');

// Find where BASE_FEMALES starts
const femalesStart = dataContent.indexOf('export const BASE_FEMALES');
if (femalesStart === -1) {
  console.error('❌ Could not find BASE_FEMALES in data.ts');
  process.exit(1);
}

// Everything before BASE_FEMALES stays the same
const beforeFemales = dataContent.substring(0, femalesStart);

// Generate the new BASE_FEMALES
const femalesJson = JSON.stringify(females);
const newContent = beforeFemales + `export const BASE_FEMALES: Female[] = ${femalesJson};\n`;

fs.writeFileSync(dataPath, newContent, 'utf8');
console.log(`📝 Updated: ${dataPath}`);
console.log(`\n🎉 Import complete! ${females.length} females processed.`);

// ─── Stats ──────────────────────────────────────────────────────────────────
const withSire = females.filter(f => f.sire_naab).length;
const withMgs = females.filter(f => f.mgs_naab).length;
const withConformation = females.filter(f => f.ptat !== null).length;
console.log(`\n📊 Stats:`);
console.log(`  With Sire NAAB: ${withSire}/${females.length}`);
console.log(`  With MGS NAAB: ${withMgs}/${females.length}`);
console.log(`  With conformation data: ${withConformation}/${females.length}`);
