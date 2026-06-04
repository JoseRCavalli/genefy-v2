import { createClient } from '@supabase/supabase-js';
import { BASE_BULLS, BASE_FEMALES } from '../src/lib/data';

// Carregar arquivo .env na raiz do projeto
try {
  process.loadEnvFile();
} catch (e) {
  // Ignora se o arquivo não existir ou se a versão do Node não suportar
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('\n❌ Erro: SUPABASE_URL ou VITE_SUPABASE_URL não encontrada nas variáveis de ambiente.');
  console.error('Certifique-se de que o arquivo .env existe na raiz do projeto e contém a URL do seu projeto Supabase.\n');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('\n❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada no arquivo .env.');
  console.error('Para rodar o seed e popular o banco de dados ignorando as regras de segurança (RLS),');
  console.error('é necessário incluir a chave "service_role" do seu projeto no arquivo .env.');
  console.error('Obtenha essa chave em: Supabase Dashboard -> Settings -> API -> service_role key.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🌱 Iniciando seed do Genefy v2...')  // 1. Obter todas as fazendas ou criar se nenhuma existir
  let { data: farms, error: farmsErr } = await supabase
    .from('farms')
    .select('*');

  if (farmsErr) { console.error('Erro ao buscar fazendas:', farmsErr.message); process.exit(1); }

  if (!farms || farms.length === 0) {
    const { data: newFarm, error: createErr } = await supabase
      .from('farms')
      .upsert({ name: 'Granja Cavalli', owner_name: 'Pedro Henrique Cavalli' }, { onConflict: 'name' } as never)
      .select()
      .single();
    if (createErr) { console.error('Erro ao criar fazenda padrão:', createErr.message); process.exit(1); }
    farms = [newFarm];
  }
  console.log(`✅ Total de fazendas para processar: ${farms.length}`);

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

  // 3. Seed fêmeas com dados CDCB completos para CADA fazenda
  for (const farm of farms) {
    console.log(`\n🌱 Seeding fêmeas para a fazenda: ${farm.name} (${farm.id})...`);
    const femalesForDb = (BASE_FEMALES as Record<string, unknown>[]).map(f => ({
      farm_id: farm.id,
      animal_id: f['id'],
      reg_id: f['reg_id'] ?? null,
      breed: (f['breed'] as string) || 'HO',
      lact: (f['lact'] as number) || 0,
      ginb: f['ginb'] ?? null,
      // Mérito econômico
      net_merit: f['net_merit'] ?? null,
      tpi: f['tpi'] ?? null,
      cheese_merit: f['cheese_merit'] ?? null,
      fluid_merit: f['fluid_merit'] ?? null,
      // Produção
      milk: f['milk'] ?? null,
      protein: f['protein'] ?? null,
      fat: f['fat'] ?? null,
      fat_pct: f['fat_pct'] ?? null,
      protein_pct: f['protein_pct'] ?? null,
      productive_life: f['productive_life'] ?? null,
      feed_efficiency: f['feed_efficiency'] ?? null,
      // Fertilidade
      dpr: f['dpr'] ?? null,
      hcr: f['hcr'] ?? null,
      ccr: f['ccr'] ?? null,
      fertility_index: f['fertility_index'] ?? null,
      early_first_calving: f['early_first_calving'] ?? null,
      // Saúde
      scs: f['scs'] ?? null,
      health_index: f['health_index'] ?? null,
      mastitis: f['mastitis'] ?? null,
      livability: f['livability'] ?? null,
      heifer_livability: f['heifer_livability'] ?? null,
      // Parto
      sire_calving_ease: f['sire_calving_ease'] ?? null,
      daughter_calving_ease: f['daughter_calving_ease'] ?? null,
      sire_stillbirth: f['sire_stillbirth'] ?? null,
      daughter_stillbirth: f['daughter_stillbirth'] ?? null,
      // Compostos de conformação
      ptat: f['ptat'] ?? null,
      udc: f['udc'] ?? null,
      flc: f['flc'] ?? null,
      bde: f['bde'] ?? null,
      dfm: f['dfm'] ?? null,
      // Traits individuais de conformação
      sta: f['sta'] ?? null,
      str_val: f['str_val'] ?? null,
      fls: f['fls'] ?? null,
      fta: f['fta'] ?? null,
      ftp: f['ftp'] ?? null,
      fua: f['fua'] ?? null,
      rlr: f['rlr'] ?? null,
      rls: f['rls'] ?? null,
      rpa: f['rpa'] ?? null,
      rtp: f['rtp'] ?? null,
      ruh: f['ruh'] ?? null,
      ruw: f['ruw'] ?? null,
      tlg: f['tlg'] ?? null,
      trw: f['trw'] ?? null,
      ucl: f['ucl'] ?? null,
      udp: f['udp'] ?? null,
      // Pedigree
      sire_naab: f['sire_naab'] ?? null,
      sire_name: f['sire_name'] ?? null,
      sire_reg: f['sire_reg'] ?? null,
      mgs_naab: f['mgs_naab'] ?? null,
      mgs_name: f['mgs_name'] ?? null,
      dam_reg: f['dam_reg'] ?? null,
      dam_animal_id: f['dam_animal_id'] ?? null,
      // Caseínas
      beta_casein: f['beta_casein'] ?? null,
      kappa_casein: f['kappa_casein'] ?? null,
      // Metadata
      bdate: f['bdate'] ?? null,
      age: f['age'] ?? null,
      genomic: false,
      is_primiparous: false,
      categories: [],
    }));

    for (let i = 0; i < femalesForDb.length; i += 100) {
      const batch = femalesForDb.slice(i, i + 100);
      const { error } = await supabase.from('females').upsert(batch, { onConflict: 'farm_id,animal_id' });
      if (error) console.error(`Erro ao inserir fêmeas batch ${i}:`, error.message);
      else process.stdout.write('.');
    }
    console.log(`\n✅ ${femalesForDb.length} fêmeas inseridas para ${farm.name}`);
  }
  console.log('\n🎉 Seed concluído!');
}

seed().catch(console.error);
