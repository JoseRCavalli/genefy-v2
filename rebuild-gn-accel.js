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

const path = 'C:/granja-novo-genefy/genefy-v2/src/lib/catalog-bulls.ts';
const content = fs.readFileSync(path, 'utf8');

// Extract all current GenerVation and Accelerated bull objects as raw strings
// We'll collect their stats keyed by short_name

function extractBullsBySection(content, catalogMarker) {
  const map = {};
  // Regex to match each { ... } object block with the given catalog
  // For single-line objects: { ... catalog: 'X' }
  // For multi-line objects: { code: ... short_name: ... catalog: 'X' ... }

  const singleLineRe = /\{[^{}]*catalog: ['"]([^'"]+)['"][^{}]*\}/g;
  let m;
  while ((m = singleLineRe.exec(content)) !== null) {
    if (m[1] !== catalogMarker) continue;
    const obj = m[0];
    const snm = obj.match(/short_name: ['"]([^'"]+)['"]/);
    if (!snm) continue;
    const key = snm[1].trim().toLowerCase();
    map[key] = { raw: obj, singleLine: true };
  }
  return map;
}

// For single-line GenerVation and Accelerated objects
const gnMap = extractBullsBySection(content, 'GenerVation (Select Sires)');
const acMap = extractBullsBySection(content, 'Accelerated (Select Sires)');

console.log(`Found ${Object.keys(gnMap).length} GenerVation bulls`);
console.log(`Found ${Object.keys(acMap).length} Accelerated bulls`);

// Helper: update code and catalog in a raw object string
function updateObj(raw, newCode, newCatalog) {
  return raw
    .replace(/code: '[^']+'/,        `code: '${newCode}'`)
    .replace(/catalog: '[^']+'/,     `catalog: '${newCatalog}'`);
}

// Build corrected objects
let gnUpdated = 0, gnMissed = [];
let acUpdated = 0, acMissed = [];

const gnCorrected = Object.entries(GENERVATION_CODES).map(([name, code]) => {
  const found = gnMap[name];
  if (found) {
    gnUpdated++;
    return '  ' + updateObj(found.raw, code, 'Select Sires');
  }
  gnMissed.push(name);
  return null;
}).filter(Boolean);

const acCorrected = Object.entries(ACCELERATED_CODES).map(([name, code]) => {
  const found = acMap[name];
  if (found) {
    acUpdated++;
    return '  ' + updateObj(found.raw, code, 'Select Sires');
  }
  acMissed.push(name);
  return null;
}).filter(Boolean);

console.log(`GN: ${gnUpdated} updated, missed: ${gnMissed.join(', ') || 'none'}`);
console.log(`ACCEL: ${acUpdated} updated, missed: ${acMissed.join(', ') || 'none'}`);

// Replace entire GENERVATION_BULLS section in catalog-bulls.ts
let newContent = content;

// Replace GENERVATION_BULLS array body
newContent = newContent.replace(
  /(export const GENERVATION_BULLS[^=]*=\s*\[)[^;]*(];)/s,
  `$1\n${gnCorrected.join(',\n')},\n$2`
);

// Replace ACCELERATED_SS_BULLS array body
newContent = newContent.replace(
  /(export const ACCELERATED_SS_BULLS[^=]*=\s*\[)[^;]*(];)/s,
  `$1\n${acCorrected.join(',\n')},\n$2`
);

fs.writeFileSync(path, newContent);
console.log('\nDone! Saved catalog-bulls.ts');

// Sanity checks
if (newContent.includes("'250HO18118'")) console.log('✓ Tenerife -> 250HO18118');
if (newContent.includes("'14HO17486'"))  console.log('✓ Cobot -> 14HO17486');
if (!newContent.includes("catalog: 'GenerVation (Select Sires)'")) console.log('✓ No more GenerVation catalog tag');
if (!newContent.includes("catalog: 'Accelerated (Select Sires)'")) console.log('✓ No more Accelerated catalog tag');
