const fs = require('fs');
const path = 'C:/granja-novo-genefy/genefy-v2/src/lib/catalog-bulls.ts';
let content = fs.readFileSync(path, 'utf8');

const before = (content.match(/'76HO\d/g) || []).length;
content = content.replace(/'76HO(\d)/g, "'551HO$1");
const after = (content.match(/'551HO\d/g) || []).length;
console.log(`STgenetics: replaced ${before} codes (76HO -> 551HO), now ${after} 551HO codes`);

fs.writeFileSync(path, content);
console.log('Done.');
