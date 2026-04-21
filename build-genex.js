const fs = require('fs');

const GENEX_CODES = {
  'glowup':           '1HO17864',
  'wildwhisper':      '1HO17729',
  'powerhouse':       '1HO16089',
  'spooktastic':      '1HO17938',
  'pingpong':         '1HO17972',
  'dreamon':          '1HO17832',
  'mingle':           '1HO17239',
  'timewarp':         '1HO17411',
  'intimidator':      '1HO17874',
  'gilles':           '1HO18116',
  'ablaze':           '1HO18046',
  'makeshift':        '1HO17827',
  'photonic':         '1HO17876',
  'mobile':           '1HO17817',
  'magmus':           '1HO17678',
  'fore':             '1HO17764',
  'clockwise':        '1HO17212',
  'savystride':       '1HO17563',
  'holla':            '1HO17959',
  'hotmix':           '1HO17005',
  'dimension':        '1HO17195',
  'condor':           '1HO17743',
  'spacejam':         '1HO17915',
  'pulsar':           '1HO17667',
  'takethat':         '1HO17831',
  'magicmoola':       '1HO16845',
  'greatgatsby':      '1HO17277',
  'lorax':            '1HO17248',
  'primero':          '1HO16864',
  'volume':           '1HO17204',
  'believable':       '1HO17775',
  'prevail':          '1HO17460',
  'progress':         '1HO17538',
  'splishsplash':     '1HO17669',
  'trickrtreat':      '1HO17912',
  'lexion':           '1HO17621',
  'unspoken':         '1HO17559',
  'cityscape':        '1HO17210',
  'heirloom':         '1HO17203',
  'playhard':         '1HO17820',
  'stormsurge':       '1HO17673',
  'yelich':           '1HO17858',
  'niteagent':        '1HO17779',
  'phenomenal':       '1HO17976',
  'latigo':           '1HO17577',
  'crushproof':       '1HO17016',
  'sugarrush':        '1HO17691',
  'outspoken':        '1HO17659',
  'spellbound':       '1HO17369',
  'hilarious':        '1HO17786',
  'freakyfriday':     '1HO17932',
  'worldsfair':       '1HO17339',
  'manmade':          '1HO18001',
  'vaderade':         '1HO18111',
  'masterpiece':      '1HO16483',
  'masterpiece 2':    '1HO16993',
  'quizquest':        '1HO18181',
  'smokeshow':        '1HO17168',
  'expedia':          '1HO17453',
  'revere':           '1HO17671',
  'prominence':       '1HO17120',
  'monstermash':      '1HO17873',
  'bigdipper':        '1HO17789',
  'deloro':           '1HO17728',
  'anticipate':       '1HO17442',
  'amethyst':         '1HO16794',
  'boldin':           '1HO16677',
  'youproof':         '1HO17200',
  'mapmaker':         '1HO17509',
  'seinfeld':         '1HO16918',
  'dropnroll':        '1HO17615',
  'coolio':           '1HO17155',
  'lockstep 2':       '1HO17017',
  'lockstep':         '1HO16537',
  'mysticmirage':     '1HO17670',
  'mauno':            '1HO16397',
  'moltar-p':         '1HO17690',
  'scrimmage':        '1HO17699',
  'gravitron':        '1HO17466',
  'nostalgia':        '1HO18004',
  'fathom':           '1HO17640',
  'honeycutt':        '1HO17537',
  'amour':            '1HO17136',
  'buzzbeat':         '1HO16908',
  'intercept':        '1HO17715',
  'enterprise':       '1HO17627',
  'bodacious':        '1HO17578',
  'fancylike':        '1HO17441',
  'delorean':         '1HO17710',
  'goalzone':         '1HO17694',
  'darkmatter':       '1HO16849',
  'prosperity':       '1HO17525',
  'magoo':            '1HO17080',
  'onestop':          '1HO16380',
  'roguewave':        '1HO17700',
  'goodhabit':        '1HO17518',
  'ollivander':       '1HO17527',
  'grandmarshal':     '1HO16718',
  'churro':           '1HO17895',
  'slatetown':        '1HO16923',
  'whatsup':          '1HO16673',
  'pointbreak':       '1HO17534',
  'breezybandit':     '1HO17246',
  'moxy':             '1HO17058',
  'lavoe':            '1HO17297',
  'ghostbuster':      '1HO18109',
  'hardball':         '1HO17636',
  'hotshothero':      '1HO17245',
  'dreamcatch':       '1HO17057',
  'casimiro':         '1HO16650',
  'clashroyale':      '1HO16539',
  'getreal':          '1HO16873',
  'zingzang':         '1HO16808',
  'tiltawhirl':       '1HO16772',
  'dibledable':       '1HO17238',
  'olympus':          '1HO16292',
  'doublemagic':      '1HO16769',
  'undercover':       '1HO17687',
  'grandfinale':      '1HO16580',
  'bucketlist':       '1HO17532',
  'gameready':        '1HO16719',
  'takeover':         '1HO15561',
  'heavyweight':      '1HO17047',
  'breakaway':        '1HO16796',
  'whizkid':          '1HO17298',
  'pixystix-pp':      '1HO17859',
  'sylvester':        '1HO16851',
  'lasershow':        '1HO17032',
  'goodluck':         '1HO16989',
  'beezer':           '1HO17148',
  'luckycharm':       '1HO16863',
  'timeout':          '1HO17083',
  'axford':           '1HO16717',
  'axford 3':         '1HO17398',
  'motivator':        '1HO17606',
  'bayfield':         '1HO17349',
  'recruiter':        '1HO16392',
  'altitude 3':       '1HO17152',
  'altitude':         '1HO16603',
  'makeawish':        '1HO16763',
  'evermore':         '1HO17633',
  'palindrome':       '1HO16493',
  'herlings':         '1HO16194',
  'lawmaker':         '1HO17684',
  'summerlove':       '1HO16813',
  'blackflame':       '1HO17344',
  'artemis':          '1HO16505',
  'bladestorm':       '1HO16560',
  'spookabull':       '1HO16491',
  'gambit':           '1HO16750',
  'nextround':        '1HO17103',
  'trusty':           '1HO17838',
  'backspin':         '1HO16812',
  'triplecrown':      '1HO17215',
  'starvoyage':       '1HO16282',
  'beachparty':       '1HO16758',
  'divisionleader':   '1HO16764',
  'stormrider':       '1HO16795',
  'alakazam':         '1HO16658',
  'vandross':         '1HO16516',
  'bullpocalypse':    '1HO16649',
  'squints':          '1HO16883',
  'switchback':       '1HO17156',
  'picksix':          '1HO17686',
  'mrsuave':          '1HO16997',
  'huxley':           '1HO16757',
  'haymaker':         '1HO16102',
  'thunderbolt':      '1HO16619',
  'dancendash':       '1HO16120',
  'flashyflash':      '1HO16085',
  'catorce':          '1HO16971',
  'zaylo':            '1HO15772',
  'foolmeonce':       '1HO16982',
  'topline-pp':       '1HO17357',
  'scotus':           '1HO15562',
  'sharpshooter':     '1HO16403',
  'rayshen':          '1HO15274',
  'creed-p':          '1HO16611',
  'makerel':          '1HO17130',
  'seager':           '1HO16540',
  'takeachance':      '1HO16707',
  'high energy':      '1HO15672',
  'starboy-pp':       '1HO18180',
  'troubadour':       '1HO16361',
  'swisher-p':        '1HO16823',
  'powerbomb':        '1HO15902',
  'comet':            '1HO16959',
  'noblesport':       '1HO16892',
  'andone':           '1HO16759',
  'conquer-pp':       '1HO16922',
  'luxardo':          '1HO16881',
  'candyman':         '1HO16701',
  'zappy':            '1HO15810',
  'dudely':           '1HO17131',
  'tiburon':          '1HO16999',
  'ridell':           '1HO15345',
  'dynamiterave':     '1HO16834',
  'bigbuckz':         '1HO16360',
  'huddleup':         '1HO16736',
  'realdealio':       '1HO16339',
  'perseverance':     '1HO16213',
  'dreammaker':       '1HO16270',
  'zimmer':           '1HO16646',
  'nissany':          '1HO15881',
  'streetmagician':   '1HO16057',
  'lovestruck':       '1HO16518',
  'break even':       '1HO15461',
  'pettyfer':         '1HO15945',
  'cupidsarrow':      '1HO16552',
  'quicksilver':      '1HO16890',
  'moneyball':        '1HO15681',
  'instant replay':   '1HO15843',
  'phenomenon':       '1HO15463',
  'blazinbull':       '1HO16590',
  'gamebreak':        '1HO15723',
  'pendulum':         '1HO15515',
  'toretto':          '1HO15405',
  'mariano-red':      '1HO16698',
  'rusumo-red':       '1HO16225',
  'checkers-p-red':   '1HO18047',
  'hilbert-red':      '1HO16228',
  'lex-pp-red':       '1HO17352',
};

function parseNum(s) {
  if (!s || s.trim() === '' || s.trim() === '--') return null;
  const n = parseFloat(s.trim().replace(',', '.'));
  return isNaN(n) ? null : n;
}
function parseStr(s) {
  if (!s || s.trim() === '') return null;
  return s.trim();
}

function buildBullEntry(cols, code) {
  const shortName = (cols[0] || '').trim();
  const parts = [
    `code: '${code}'`,
    `short_name: ${JSON.stringify(shortName)}`,
    `catalog: 'Genex'`,
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

const csv = fs.readFileSync('C:/Users/joser/Downloads/genex-csv.csv', 'utf8');
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

  const code = GENEX_CODES[name.toLowerCase()];
  if (!code) { missed.push(name); continue; }

  entries.push(buildBullEntry(cols, code));
}

console.log(`Genex: ${entries.length} entries`);
if (missed.length) console.log('Missed:', missed.join(', '));

// Splice into catalog-bulls.ts
const path = 'C:/granja-novo-genefy/genefy-v2/src/lib/catalog-bulls.ts';
let content = fs.readFileSync(path, 'utf8');

// Add GENEX_BULLS array before CATALOG_BULLS
const genexArray = `\nexport const GENEX_BULLS: Bull[] = [\n${entries.join(',\n')},\n];\n`;

content = content.replace(
  /\nexport const CATALOG_BULLS/,
  genexArray + '\nexport const CATALOG_BULLS'
);

// Add GENEX_BULLS to the spread
content = content.replace(
  '...ABS_BULLS,\n];',
  '...ABS_BULLS, ...GENEX_BULLS,\n];'
);

fs.writeFileSync(path, content);
console.log('\nSaved catalog-bulls.ts');

// Verify
const c = fs.readFileSync(path, 'utf8');
console.log('✓ 1HO17864 (Glowup):', c.includes("'1HO17864'"));
console.log('✓ 1HO17938 (Spooktastic):', c.includes("'1HO17938'"));
console.log('✓ GENEX_BULLS in CATALOG_BULLS:', c.includes('GENEX_BULLS'));
