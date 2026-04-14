import { createClient } from '@supabase/supabase-js';
import { BASE_BULLS, BASE_FEMALES } from '../src/lib/data';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log('🌱 Iniciando seed do Genefy v2...');

  // 1. Criar fazenda demo
  const { data: farm, error: farmErr } = await supabase
    .from('farms')
    .upsert({ name: 'Granja Cavalli (Demo)', owner_name: 'Pedro Henrique Cavalli' }, { onConflict: 'name' } as never)
    .select()
    .single();

  if (farmErr) { console.error('Erro ao criar fazenda:', farmErr.message); process.exit(1); }
  console.log(`✅ Fazenda criada: ${farm.name} (${farm.id})`);

  // 2. Seed touros CDCB (farm_id = null = catálogo do sistema)
  const bullsForDb = (BASE_BULLS as Record<string, unknown>[]).map(b => ({
    code: b['code'],
    short_name: b['name'] || b['short_name'] || null,
    full_name: b['full_name'] || null,
    gtpi: b['gtpi'] ?? null,
    net_merit: b['net_merit'] ?? null,
    gfi: b['gfi'] ?? null,
    reliability: b['reliability'] ?? null,
    milk: b['milk'] ?? null,
    protein: b['protein'] ?? null,
    fat: b['fat'] ?? null,
    productive_life: b['productive_life'] ?? null,
    scs: b['scs'] ?? null,
    dpr: b['dpr'] ?? null,
    hcr: b['hcr'] ?? null,
    ccr: b['ccr'] ?? null,
    fertility_index: b['fertility_index'] ?? null,
    ptat: b['ptat'] ?? null,
    udc: b['udc'] ?? null,
    flc: b['flc'] ?? null,
    feed_saved: b['feed_saved'] ?? null,
    cow_livability: b['cow_livability'] ?? null,
    sire_calving_ease: b['sire_calving_ease'] ?? null,
    beta_casein: b['beta_casein'] ?? null,
    kappa_casein: b['kappa_casein'] ?? null,
    hh1: (b['HH1'] as string) || 'Free',
    hh2: (b['HH2'] as string) || 'Free',
    hh3: (b['HH3'] as string) || 'Free',
    hh4: (b['HH4'] as string) || 'Free',
    hh5: (b['HH5'] as string) || 'Free',
    hh6: (b['HH6'] as string) || 'Free',
    is_custom: false,
    source: 'CDCB',
    farm_id: null,
  }));

  for (let i = 0; i < bullsForDb.length; i += 100) {
    const batch = bullsForDb.slice(i, i + 100);
    const { error } = await supabase.from('bulls').upsert(batch, { onConflict: 'code' });
    if (error) console.error(`Erro ao inserir touros batch ${i}:`, error.message);
    else process.stdout.write('.');
  }
  console.log(`\n✅ ${bullsForDb.length} touros inseridos`);

  // 3. Seed fêmeas demo
  const femalesForDb = (BASE_FEMALES as Record<string, unknown>[]).map(f => ({
    farm_id: farm.id,
    animal_id: f['id'],
    breed: (f['breed'] as string) || 'HO',
    lact: (f['lact'] as number) || 0,
    ginb: f['ginb'] ?? null,
    net_merit: f['net_merit'] ?? null,
    milk: f['milk'] ?? null,
    protein: f['protein'] ?? null,
    fat: f['fat'] ?? null,
    productive_life: f['productive_life'] ?? null,
    dpr: f['dpr'] ?? null,
    fertility_index: f['fertility_index'] ?? null,
    udc: f['udc'] ?? null,
    flc: f['flc'] ?? null,
    scs: f['scs'] ?? null,
    sire_naab: f['sire_naab'] ?? null,
    mgs_naab: f['mgs_naab'] ?? null,
    mmgs_naab: f['mmgs_naab'] ?? null,
    age: f['age'] ?? null,
    genomic: false,
    is_primiparous: false,
  }));

  for (let i = 0; i < femalesForDb.length; i += 100) {
    const batch = femalesForDb.slice(i, i + 100);
    const { error } = await supabase.from('females').upsert(batch, { onConflict: 'farm_id,animal_id' });
    if (error) console.error(`Erro ao inserir fêmeas batch ${i}:`, error.message);
    else process.stdout.write('.');
  }
  console.log(`\n✅ ${femalesForDb.length} fêmeas inseridas`);
  console.log('\n🎉 Seed concluído!');
}

seed().catch(console.error);
