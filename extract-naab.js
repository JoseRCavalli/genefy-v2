const fs = require('fs');
const content = fs.readFileSync('C:/Users/joser/.claude/projects/C--granja-novo-genefy/3d65195a-8b29-4582-9725-e1411de433c8.jsonl', 'utf8');

// Look for patterns like "200HO12345\tName" in the JSON
const lines = content.split('\n');
const naabMap = {};

for (const line of lines) {
  if (!line.includes('200HO') && !line.includes('777HO')) continue;

  // The user message would be JSON-encoded, so tabs are \t literally
  // Try to find the user message content
  try {
    const obj = JSON.parse(line);
    const str = JSON.stringify(obj);

    // Find NAAB code + tab + name pattern in the stringified JSON
    // In JSON string, tab is \t (literal backslash-t)
    const re = /((?:200HO|777HO)\d+)\\t([A-Za-z][^"\\]{2,40})/g;
    let m;
    while ((m = re.exec(str)) !== null) {
      const code = m[1];
      const name = m[2].trim();
      if (name && code) {
        naabMap[name.toLowerCase()] = code;
      }
    }
  } catch(e) {}
}

console.log('Map size:', Object.keys(naabMap).length);
Object.entries(naabMap).slice(0, 20).forEach(([k, v]) => console.log(v, k));

// Save map
fs.writeFileSync('C:/granja-novo-genefy/genefy-v2/semex-naab-map.json', JSON.stringify(naabMap, null, 2));
console.log('\nSaved to semex-naab-map.json');
