const fs = require('fs');

const GENERVATION_CODES = {
  'tenerife':             '250HO18118',
  'poplar':               '250HO17387',
  'boldness':             '250HO17346',
  'genoa':                '250HO17992',
  'saloon':               '250HO17417',
  'leif':                 '250HO18112',
  'eeyore':               '250HO17404',
  'country':              '250HO17507',
  'hemlock':              '250HO18258',
  'independant':          '250HO17271',
  'knack':                '250HO17022',
  'cabare':               '250HO17347',
  'transfer':             '250HO16691',
  'hostens-p':            '250HO18259',
  'utrecht':              '250HO17719',
  'pinnicles':            '250HO17962',
  'tubman':               '250HO17513',
  'cannonball':           '250HO17196',
  'longpoint':            '250HO17013',
  'peachtown-p':          '250HO18261',
  'scotty':               '250HO17776',
  'howland-p':            '250HO17009',
  'bonappetit':           '250HO17653',
  'beegone-pp':           '250HO18208',
  'confay':               '250HO17433',
  'athens-red':           '250HO18217',
  'habulous-p':           '250HO17298',
  'oats':                 '250HO17793',
  'offer-p':              '250HO18354',
  'akshay-p':             '250HO17075',
  'figaro':               '250HO16074',
  'loosem-pp':            '250HO18206',
  'pace':                 '250HO16497',
  'sunsun':               '250HO17295',
  'hader':                '250HO17215',
  'palisaide-pp':         '250HO17979',
  'eskil':                '250HO17108',
  'hardin':               '250HO16741',
  'allgone-pp':           '250HO16801',
  'dann':                 '250HO17817',
  'blakely':              '250HO16290',
  'harmony':              '250HO15955',
  'tentastic':            '250HO16979',
  'riptide rc':           '250HO17808',
  'rickross rc':          '250HO17810',
  'patootie':             '250HO18064',
  'cruz-pp':              '250HO17152',
  'powerpolled-pp-red':   '250HO17146',
  'renegade':             '250HO14134',
  'crypto pp':            '250HO18358',
  'hardwick':             '250HO17304',
  'havefun-red':          '250HO16537',
  'hansh':                '250HO18065',
  'hantastic-p':          '250HO17297',
  'kickstart':            '250HO17435',
  'rampitup-p-red':       '250HO18059',
  'squibb-red':           '250HO17050',
  'leysurely pp':         '250HO18204',
  'paldwyn':              '250HO17567',
  'hijack':               '250HO17165',
  'parian-p':             '250HO17560',
  'partake':              '250HO16121',
  'pazzle':               '250HO16115',
  'elevate':              '250HO17549',
  'hulu':                 '250HO16498',
  'hancock':              '250HO14579',
  'lombardi':             '250HO16490',
  'pracise rc-p':         '250HO17699',
};

const ACCELERATED_CODES = {
  'cobot':              '14HO17486',
  'roonie':             '14HO17539',
  'sack':               '14HO17589',
  'pa-king':            '14HO18269',
  'ammo':               '14HO17426',
  'tevlade':            '14HO18083',
  'ozark':              '14HO17393',
  'kaweah':             '14HO18084',
  'madcap':             '14HO17945',
  'day trip':           '14HO17216',
  'serrano':            '14HO17453',
  'billerbeck':         '14HO18000',
  'hesekiah':           '14HO17805',
  'levanna':            '14HO17991',
  'deems':              '14HO17940',
  'azul-p':             '14HO17533',
  'hulahoop':           '14HO18218',
  'rooker':             '14HO17564',
  'refute':             '14HO18110',
  'eras':               '14HO18087',
  'aulius':             '14HO17344',
  'shaft':              '14HO18109',
  'chopper':            '14HO18025',
  'ollyver':            '14HO17305',
  'jumparound':         '14HO17937',
  'twisted-p':          '14HO17204',
  'pierce rc':          '14HO18196',
  'fisher':             '14HO17352',
  'lapeno':             '14HO17066',
  'hoedown':            '14HO17260',
  'kingdom':            '14HO17263',
  'kokio':              '14HO17556',
  'tynan':              '14HO17592',
  'undertone':          '14HO16236',
  'paxton':             '14HO17392',
  'shepard':            '14HO18054',
  'hathway':            '14HO17772',
  'hoodia':             '14HO17311',
  'solas':              '14HO17026',
  'dospoll-pp':         '14HO18231',
  'ramone':             '14HO17922',
  'gossage':            '14HO17205',
  'frampton':           '14HO16082',
  'van gogh':           '14HO15926',
  'drydon':             '14HO16836',
  'tonado-p':           '14HO18061',
  'otis':               '14HO17657',
  'flame':              '14HO17403',
  'marv':               '14HO17800',
  'opie':               '14HO17659',
  'organic':            '14HO16393',
  'trooper':            '14HO15179',
  'heasty':             '14HO17268',
  'ancho peppr-red':    '14HO18063',
  'gordy':              '14HO15301',
  'east':               '14HO15831',
  'heist':              '14HO17164',
  'easton':             '14HO16391',
  'ragnar-red':         '14HO17550',
  'page-pp':            '14HO17016',
  'pabulous-red':       '14HO17429',
  'sertoli':            '14HO14629',
  'rollsroyce-red':     '14HO17809',
  'reasure-red':        '14HO17548',
  'etowah-red':         '14HO17172',
  'pop rock-red':       '14HO18236',
  'applecore-red':      '14HO18405',
  'repo-red':           '14HO17662',
};

// Column mapping for Select Sires-format CSVs:
// 0=Name, 3=TPI, 4=NM$, 8=PTAM/milk, 10=PTAF/fat, 12=PTAP/protein,
// 14=PL, 15=DPR, 16=LIV, 17=SCS, 20=PTAT, 21=UDC, 22=FLC, 23=SCE,
// 41=Rel, 164=AaaCode, 166=BetaCasein, 167=KappaCasein, 168=EFI, 169=GFI

function parseNum(s) {
  if (!s || s.trim() === '' || s.trim() === '--') return null;
  const n = parseFloat(s.trim().replace(',', '.'));
  return isNaN(n) ? null : n;
}
function parseStr(s) {
  if (!s || s.trim() === '') return null;
  return s.trim();
}

function buildBullEntry(cols, code, catalog) {
  const shortName = (cols[0] || '').trim();
  const parts = [
    `code: '${code}'`,
    `short_name: ${JSON.stringify(shortName)}`,
    `catalog: '${catalog}'`,
  ];

  const tpi     = parseNum(cols[3]);
  const nm      = parseNum(cols[4]);
  const milk    = parseNum(cols[8]);
  const fat     = parseNum(cols[10]);
  const protein = parseNum(cols[12]);
  const pl      = parseNum(cols[14]);
  const dpr     = parseNum(cols[15]);
  const liv     = parseNum(cols[16]);
  const scs     = parseNum(cols[17]);
  const ptat    = parseNum(cols[20]);
  const udc     = parseNum(cols[21]);
  const flc     = parseNum(cols[22]);
  const sce     = parseNum(cols[23]);
  const rel     = parseNum(cols[41]);
  const beta    = parseStr(cols[166]);
  const kappa   = parseStr(cols[167]);
  const efi     = parseNum(cols[168]);
  const gfi     = parseNum(cols[169]);

  if (tpi  != null) parts.push(`gtpi: ${tpi}`);
  if (nm   != null) parts.push(`net_merit: ${nm}`);
  if (milk != null) parts.push(`milk: ${milk}`);
  if (fat  != null) parts.push(`fat: ${fat}`);
  if (protein != null) parts.push(`protein: ${protein}`);
  if (pl   != null) parts.push(`pl: ${pl}`);
  if (dpr  != null) parts.push(`dpr: ${dpr}`);
  if (liv  != null) parts.push(`liv: ${liv}`);
  if (scs  != null) parts.push(`scs: ${scs}`);
  if (ptat != null) parts.push(`ptat: ${ptat}`);
  if (udc  != null) parts.push(`udc: ${udc}`);
  if (flc  != null) parts.push(`flc: ${flc}`);
  if (sce  != null) parts.push(`sce: ${sce}`);
  if (rel  != null) parts.push(`reliability: ${rel}`);
  if (beta)  parts.push(`beta_casein: ${JSON.stringify(beta)}`);
  if (kappa) parts.push(`kappa_casein: ${JSON.stringify(kappa)}`);
  if (efi  != null) parts.push(`efi: ${efi}`);
  if (gfi  != null) parts.push(`gfi: ${gfi}`);

  return `  { ${parts.join(', ')} }`;
}

function parseCSV(csvPath, codeMap, catalogName) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const rows = csv.split('\n').filter(l => l.trim());

  // Find first data row
  let startRow = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const cols = rows[i].split(',');
    if (cols[0] && /^[A-Z]/.test(cols[0].trim()) && !isNaN(parseFloat(cols[3]))) {
      startRow = i; break;
    }
  }

  const entries = [];
  const missed = [];

  for (let i = startRow; i < rows.length; i++) {
    const cols = rows[i].split(',');
    if (cols.length < 20) continue;
    const name = (cols[0] || '').trim();
    if (!name) continue;

    const code = codeMap[name.toLowerCase()];
    if (!code) { missed.push(name); continue; }

    entries.push(buildBullEntry(cols, code, catalogName));
  }

  return { entries, missed };
}

const gnResult = parseCSV(
  'C:/Users/joser/Downloads/genervation(selectsires).csv',
  GENERVATION_CODES,
  'Select Sires'
);
const acResult = parseCSV(
  'C:/Users/joser/Downloads/accelerated(selectsires).csv',
  ACCELERATED_CODES,
  'Select Sires'
);

console.log(`GenerVation: ${gnResult.entries.length} entries`);
if (gnResult.missed.length) console.log('GN missed:', gnResult.missed.join(', '));

console.log(`Accelerated: ${acResult.entries.length} entries`);
if (acResult.missed.length) console.log('ACCEL missed:', acResult.missed.join(', '));

// Splice into catalog-bulls.ts
const path = 'C:/granja-novo-genefy/genefy-v2/src/lib/catalog-bulls.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /(export const GENERVATION_BULLS[^=]*=\s*\[)[^;]*(];)/s,
  `$1\n${gnResult.entries.join(',\n')},\n$2`
);

content = content.replace(
  /(export const ACCELERATED_SS_BULLS[^=]*=\s*\[)[^;]*(];)/s,
  `$1\n${acResult.entries.join(',\n')},\n$2`
);

fs.writeFileSync(path, content);
console.log('\nSaved catalog-bulls.ts');

// Verify
const c = fs.readFileSync(path, 'utf8');
console.log('✓ 250HO18118 (Tenerife GN):', c.includes("'250HO18118'"));
console.log('✓ 14HO17486  (Cobot ACCEL):', c.includes("'14HO17486'"));
