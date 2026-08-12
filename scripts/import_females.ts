import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { CATALOG_BULLS } from '../src/lib/catalog-bulls';
import { estimateCowPtas, type Bull, type Female } from '../src/lib/genetics';

// Configuração do Supabase
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}
const supabase = createClient(url, key);

const FARM_ID = '300ab06f-dfb2-437b-91ef-39c5414c1a81';

// Função auxiliar para datas do Excel
function formatExcelDate(serial: any) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    // Tenta interpretar a string como data
    const d = new Date(serial);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return null;
  }
  if (typeof serial === 'number') {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate() + 1).toISOString().split('T')[0];
  }
  return null;
}

// Limpeza de NAAB
function cleanNaab(str: any) {
  if (!str) return null;
  const s = String(str).trim();
  // Remove leading zeros from stud code (e.g., 014HO16255 -> 14HO16255)
  return s.replace(/^0+/, '');
}

async function main() {
  console.log('Fetching custom bulls and females from Supabase...');
  
  // 1. Fetch custom bulls
  const { data: dbBulls, error: err1 } = await supabase
    .from('bulls')
    .select('*')
    .eq('farm_id', FARM_ID);
  if (err1) throw err1;

  // Normalizar catálogo igual fazemos no useBulls
  const normalizedCatalog = CATALOG_BULLS.map(b => ({
    ...b,
    productive_life: (b as any).productive_life ?? (b as any).pl,
    cow_livability: (b as any).cow_livability ?? (b as any).liv,
    sire_calving_ease: (b as any).sire_calving_ease ?? (b as any).sce,
    feed_saved: (b as any).feed_saved ?? (b as any).efi,
  }));

  const allBulls: Bull[] = [
    ...normalizedCatalog,
    ...dbBulls.map(b => ({ ...b, code: b.id, _custom: true })) // simplificado, mapeando do db
  ];

  // 2. Fetch existing females
  const { data: dbFemales, error: err2 } = await supabase
    .from('females')
    .select('*')
    .eq('farm_id', FARM_ID);
  if (err2) throw err2;

  let existingFemales: any[] = dbFemales || [];

  // 3. Lê o Excel
  console.log('Reading Excel file...');
  const path = 'C:\\granja-novo-genefy\\Females All List USA - 11_08_2026 (1).xlsx';
  const workbook = XLSX.readFile(path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { raw: true });

  console.log(`Found ${rows.length} rows to import.`);

  const toUpsert: any[] = [];
  
  // Como pode haver dependências (mãe antes da filha), 
  // idealmente ordenaríamos por nascimento, mas vamos apenas fazer num loop.
  // Pelo jeito da lista as mais velhas costumam vir primeiro, mas vamos fazer 2 passes se precisar
  
  for (const row of rows) {
    const rawId = (row as any)['ID'];
    if (!rawId) continue;
    const animalId = String(rawId).trim();

    // Já existe no banco?
    let dbId = existingFemales.find(f => f.animal_id === animalId)?.id;
    
    // Procura Dam
    const rawDam = (row as any)['DAM ID'];
    let damIdDb = null;
    if (rawDam) {
      const damStr = String(rawDam).trim();
      const damObj = existingFemales.find(f => f.animal_id === damStr);
      if (damObj) damIdDb = damObj.id;
    }

    const lactStr = (row as any)['LACT'];
    const lact = parseInt(lactStr) || 0;

    // Base female object format to pass to estimateCowPtas
    const baseFemale: Female = {
      id: dbId || `tmp_${animalId}`, // fake id se for nova
      animal_id: animalId,
      name: (row as any)['NAME'] || null,
      breed: (row as any)['BREED'] || 'HO',
      bdate: formatExcelDate((row as any)['BDATE']),
      lact: lact,
      is_primiparous: lact === 0,
      categories: [],
      notes: '',
      sire_naab: cleanNaab((row as any)['SIRE NAAB']),
      mgs_naab: cleanNaab((row as any)['MGS NAAB']),
      dam_id: damIdDb,
      genomic: false, // Assumindo false a menos que tenha no CSV
    };
    
    // Estimate PA
    // Nós passamos 'existingFemales' como terceiro argumento. 
    const enriched = estimateCowPtas(baseFemale, allBulls, existingFemales);

    // Preparar o payload pro Supabase (igual HerdTab)
    const payload = {
      id: dbId || crypto.randomUUID(),
      farm_id: FARM_ID,
      animal_id: animalId,
      name: baseFemale.name,
      breed: baseFemale.breed,
      lact: baseFemale.lact,
      bdate: baseFemale.bdate,
      is_primiparous: baseFemale.is_primiparous,
      sire_naab: enriched.sire_naab,
      mgs_naab: enriched.mgs_naab,
      mmgs_naab: enriched.mmgs_naab,
      dam_id: enriched.dam_id,
      genomic: enriched.genomic,
      
      // Salva os índices calculados
      ginb: enriched.ginb ?? null,
      milk: enriched.milk ?? null,
      protein: enriched.protein ?? null,
      fat: enriched.fat ?? null,
      productive_life: enriched.productive_life ?? null,
      dpr: enriched.dpr ?? null,
      fertility_index: enriched.fertility_index ?? null,
      udc: enriched.udc ?? null,
      flc: enriched.flc ?? null,
      ptat: enriched.ptat ?? null,
      net_merit: enriched.net_merit ?? null,
      tpi: enriched.tpi ?? null,
      scs: enriched.scs ?? null,
      livability: enriched.livability ?? null,
      feed_efficiency: enriched.feed_efficiency ?? null,
      sire_calving_ease: enriched.sire_calving_ease ?? null,
    };

    toUpsert.push(payload);
    
    // Adiciona na lista 'existingFemales' para que se for mãe da próxima, seja encontrada
    // Nota: O ID real no Supabase será gerado só no insert, mas o animal_id já pode ser achado
    const idx = existingFemales.findIndex(f => f.animal_id === animalId);
    if (idx >= 0) existingFemales[idx] = payload;
    else existingFemales.push(payload);
  }

  console.log(`Upserting ${toUpsert.length} females to Supabase...`);
  // Fazer chunks de 100 para não estourar o limite
  const chunkSize = 100;
  for (let i = 0; i < toUpsert.length; i += chunkSize) {
    const chunk = toUpsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('females').upsert(chunk, { onConflict: 'farm_id,animal_id' });
    if (error) {
      console.error('Error upserting chunk:', error);
    } else {
      console.log(`Upserted chunk ${i / chunkSize + 1}`);
    }
  }

  console.log('Import completed successfully!');
}

main().catch(err => {
  console.error('Fatal error:', err);
});
