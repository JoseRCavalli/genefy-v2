const fs = require('fs');
const path = 'C:/granja-novo-genefy/genefy-v2/src/lib/catalog-bulls.ts';
let content = fs.readFileSync(path, 'utf8');

// Fix STgenetics: 7HO -> 76HO
const before7 = (content.match(/'7HO\d/g) || []).length;
content = content.replace(/'7HO(\d)/g, "'76HO$1");
const after7 = (content.match(/'76HO\d/g) || []).length;
console.log(`STgenetics: replaced ${before7} codes (7HO -> 76HO), now ${after7} 76HO codes`);

// Fix Alta Genetics: 100HO -> 11HO
const before100 = (content.match(/'100HO\d/g) || []).length;
content = content.replace(/'100HO(\d)/g, "'11HO$1");
const after11 = (content.match(/'11HO\d/g) || []).length;
console.log(`Alta Genetics: replaced ${before100} codes (100HO -> 11HO), now ${after11} 11HO codes`);

// Fix Select Sires: 1HO -> 250HO (but only 1HO, not 11HO or 100HO already converted)
// Use negative lookbehind: '1HO but not preceded by digit (so not '11HO)
const before1 = (content.match(/'1HO\d/g) || []).length;
content = content.replace(/'1HO(\d)/g, "'250HO$1");
const after250 = (content.match(/'250HO\d/g) || []).length;
console.log(`Select Sires: replaced ${before1} codes (1HO -> 250HO), now ${after250} 250HO codes`);

fs.writeFileSync(path, content);
console.log('Done! All prefixes updated.');
