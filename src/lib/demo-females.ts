/**
 * demo-females.ts — 100 fêmeas fictícias para a conta de demonstração.
 * Dados completamente inventados com valores realistas baseados em
 * faixas típicas CDCB para a raça Holandesa.
 * NÃO representam nenhum animal real ou rebanho existente.
 */
import type { Female } from './genetics';

// ── Helpers de geração determinística (seed-based) ──────────────────────────
// Usa um PRNG simples (Mulberry32) para gerar dados reproduzíveis sem Math.random
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260605);

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((rng() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Dados de referência para pedigree fictício ──────────────────────────────
const SIRE_POOL = [
  { naab: '7HO16221', name: 'DELTA-LAMBDA' },
  { naab: '29HO20647', name: 'PEAK ALTAZENITH' },
  { naab: '1HO16058', name: 'S-S-I RENGADE RANSOM' },
  { naab: '551HO04584', name: 'WINSTAR ENFORCE' },
  { naab: '7HO15775', name: 'OCD TYCOON' },
  { naab: '29HO20513', name: 'PEAK ALTATOPSHOT' },
  { naab: '14HO15610', name: 'SANDY-VALLEY COPERNICUS' },
  { naab: '200HO12381', name: 'PROGENESIS MONTFORT' },
  { naab: '29HO20427', name: 'PEAK ALTARUMBLE' },
  { naab: '1HO15888', name: 'DENOVO 16140 AWESOME' },
  { naab: '551HO04215', name: 'WINSTAR GALAXY' },
  { naab: '7HO16050', name: 'ABS MAGICTOUCH' },
  { naab: '14HO15782', name: 'SANDY-VALLEY EINSTEIN' },
  { naab: '200HO12600', name: 'PROGENESIS MAESTRO' },
  { naab: '29HO20700', name: 'PEAK ALTASKYFALL' },
];

const MGS_POOL = [
  { naab: '29HO19735', name: 'PEAK ALTAROBSON' },
  { naab: '7HO15351', name: 'S-S-I BG DRACO' },
  { naab: '551HO03977', name: 'WINSTAR ELTON' },
  { naab: '1HO15400', name: 'DENOVO 14619 RESOLUTION' },
  { naab: '200HO12100', name: 'PROGENESIS EVERGLADE' },
  { naab: '14HO15200', name: 'SANDY-VALLEY HEROIC' },
  { naab: '29HO19500', name: 'PEAK ALTAFORTUNE' },
  { naab: '7HO15600', name: 'COOKIECUTTER HEROISM' },
  { naab: '551HO04100', name: 'WINSTAR COMMANDER' },
  { naab: '1HO15550', name: 'DENOVO 15100 PINNACLE' },
];

const BETA_CASEIN_OPTIONS = ['A1A1', 'A1A2', 'A2A2'];
const KAPPA_CASEIN_OPTIONS = ['AA', 'AB', 'BB'];

// ── Geração das 100 fêmeas ──────────────────────────────────────────────────
function generateDemoFemales(): Female[] {
  const females: Female[] = [];

  for (let i = 1; i <= 100; i++) {
    const animalId = `DEMO-${String(i).padStart(4, '0')}`;
    const regId = `HO${String(randInt(100000000, 999999999))}`;
    const sire = pick(SIRE_POOL);
    const mgs = pick(MGS_POOL);
    const lact = pick([0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5]);
    const age = lact === 0 ? randInt(12, 24) : randInt(24 + lact * 12, 36 + lact * 14);

    // Gerar data de nascimento fictícia baseada na idade
    const birthYear = 2026 - Math.floor(age / 12);
    const birthMonth = String(randInt(1, 12)).padStart(2, '0');
    const birthDay = String(randInt(1, 28)).padStart(2, '0');
    const bdate = `${birthYear}-${birthMonth}-${birthDay}`;

    const female: Female = {
      id: animalId,
      reg_id: regId,
      breed: 'HO',
      lact,
      age,
      bdate,
      ginb: randFloat(6.0, 12.5),

      // Mérito econômico
      net_merit: randInt(100, 900),
      tpi: randInt(2600, 3400),
      cheese_merit: randInt(80, 800),
      fluid_merit: randInt(50, 700),

      // Produção
      milk: randInt(-200, 2400),
      protein: randInt(-5, 65),
      fat: randInt(-15, 110),
      fat_pct: randFloat(-0.30, 0.40),
      protein_pct: randFloat(-0.15, 0.20),
      productive_life: randFloat(-1.5, 6.5, 1),
      feed_efficiency: randFloat(-200, 350, 0),

      // Fertilidade
      dpr: randFloat(-2.5, 3.0, 1),
      hcr: randFloat(-3.0, 4.0, 1),
      ccr: randFloat(-3.0, 4.0, 1),
      fertility_index: randFloat(-1.5, 2.8, 1),
      early_first_calving: randFloat(-1.0, 2.0, 1),

      // Saúde
      scs: randFloat(2.55, 3.15),
      health_index: randFloat(-1.5, 3.0, 1),
      mastitis: randFloat(-2.0, 2.5, 1),
      livability: randFloat(-3.0, 5.0, 1),
      heifer_livability: randFloat(-2.0, 4.0, 1),

      // Parto
      sire_calving_ease: randFloat(1.0, 3.0, 1),
      daughter_calving_ease: randFloat(1.0, 3.0, 1),
      sire_stillbirth: randFloat(1.0, 3.0, 1),
      daughter_stillbirth: randFloat(1.0, 3.0, 1),

      // Compostos de conformação
      ptat: randFloat(-1.0, 3.0),
      udc: randFloat(-0.8, 2.5),
      flc: randFloat(-0.5, 2.2),
      bde: randFloat(-1.0, 2.5),
      dfm: randFloat(-0.5, 2.0),

      // Traits individuais de conformação
      sta: randFloat(-2.0, 3.0, 1),
      str_val: randFloat(-2.0, 3.0, 1),
      fls: randFloat(-2.0, 3.0, 1),
      fta: randFloat(-2.0, 2.5, 1),
      ftp: randFloat(-2.0, 2.5, 1),
      fua: randFloat(-1.5, 3.0, 1),
      rlr: randFloat(-2.0, 2.5, 1),
      rls: randFloat(-2.0, 2.5, 1),
      rpa: randFloat(-2.0, 2.5, 1),
      rtp: randFloat(-2.0, 2.5, 1),
      ruh: randFloat(-1.5, 3.0, 1),
      ruw: randFloat(-2.0, 2.5, 1),
      tlg: randFloat(-2.0, 2.5, 1),
      trw: randFloat(-2.0, 2.5, 1),
      ucl: randFloat(-2.0, 2.5, 1),
      udp: randFloat(-2.0, 2.5, 1),

      // Pedigree
      sire_naab: sire.naab,
      sire_name: sire.name,
      sire_reg: `HO${String(randInt(10000000, 99999999))}`,
      mgs_naab: mgs.naab,
      mgs_name: mgs.name,
      mmgs_naab: pick(MGS_POOL).naab,
      dam_reg: `HO${String(randInt(10000000, 99999999))}`,
      dam_animal_id: `DAM-${String(randInt(1000, 9999))}`,

      // Caseínas
      beta_casein: pick(BETA_CASEIN_OPTIONS),
      kappa_casein: pick(KAPPA_CASEIN_OPTIONS),

      // Metadata
      genomic: rng() > 0.5,
      is_primiparous: lact <= 1,
      categories: [],
      notes: '',
    };

    females.push(female);
  }

  return females;
}

export const DEMO_FEMALES: Female[] = generateDemoFemales();
