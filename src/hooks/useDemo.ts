/**
 * Demo mode: runs entirely client-side using BASE_BULLS + BASE_FEMALES.
 * No Supabase required.
 */
import { useState, useCallback } from 'react';
import { BASE_FEMALES } from '../lib/data';
import { CATALOG_BULLS } from '../lib/catalog-bulls';
import { PRESETS } from '../lib/genetics';
import { getBrandFromCode } from '../lib/naab-brands';
import type { Bull, Female, WeightMap } from '../lib/genetics';
import type { FarmRow, FemaleRow, BullRow } from '../lib/supabase';
import type { TankEntry } from './useTank';
import { rowToFemale } from './useFemales';

const DEMO_FARM: FarmRow = {
  id: 'demo-farm',
  name: 'Granja Cavalli',
  owner_name: 'Pedro Henrique Cavalli',
  created_at: new Date().toISOString(),
};

// LS keys
const LS_TANK = 'genefy_demo_tank';
const LS_WEIGHTS = 'genefy_demo_weights';

function lsGet<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ── Bulls ────────────────────────────────────────────────────────────────────
export function useDemoBulls() {
  const [customBulls, setCustomBulls] = useState<Bull[]>([]);
  const bulls: Bull[] = [...CATALOG_BULLS, ...customBulls];

  const bullRows: BullRow[] = bulls.map((b) => ({
    id: b.code,   // usar code como id para que useDemoTank receba o code diretamente
    farm_id: null,
    code: b.code,
    short_name: b.name ?? b.short_name ?? null,
    full_name: b.full_name ?? null,
    gtpi: b.gtpi ?? null,
    net_merit: b.net_merit ?? null,
    gfi: b.gfi ?? null,
    reliability: b.reliability ?? null,
    milk: b.milk ?? null,
    protein: b.protein ?? null,
    fat: b.fat ?? null,
    productive_life: b.productive_life ?? null,
    scs: b.scs ?? null,
    dpr: b.dpr ?? null,
    hcr: b.hcr ?? null,
    ccr: b.ccr ?? null,
    fertility_index: b.fertility_index ?? null,
    ptat: b.ptat ?? null,
    udc: b.udc ?? null,
    flc: b.flc ?? null,
    feed_saved: b.feed_saved ?? null,
    cow_livability: b.cow_livability ?? null,
    sire_calving_ease: b.sire_calving_ease ?? null,
    beta_casein: b.beta_casein ?? null,
    kappa_casein: b.kappa_casein ?? null,
    hh1: (b.HH1 as string) || 'Free',
    hh2: (b.HH2 as string) || 'Free',
    hh3: (b.HH3 as string) || 'Free',
    hh4: (b.HH4 as string) || 'Free',
    hh5: (b.HH5 as string) || 'Free',
    hh6: (b.HH6 as string) || 'Free',
    price_per_dose: b.price_per_dose ?? null,
    catalog: (b as { catalog?: string | null }).catalog ?? getBrandFromCode(b.code),
    is_custom: b._custom ?? false,
    source: b._custom ? 'MANUAL' : 'CDCB',
    created_at: new Date().toISOString(),
  }));

  function addCustomBull(_farmId: string, bull: Partial<BullRow> & { code: string }) {
    const newBull: Bull = {
      code: bull.code,
      name: bull.short_name ?? bull.code,
      gtpi: bull.gtpi ?? undefined,
      net_merit: bull.net_merit ?? undefined,
      milk: bull.milk ?? undefined,
      protein: bull.protein ?? undefined,
      fat: bull.fat ?? undefined,
      productive_life: bull.productive_life ?? undefined,
      scs: bull.scs ?? undefined,
      dpr: bull.dpr ?? undefined,
      hcr: bull.hcr ?? undefined,
      ccr: bull.ccr ?? undefined,
      fertility_index: bull.fertility_index ?? undefined,
      ptat: bull.ptat ?? undefined,
      udc: bull.udc ?? undefined,
      flc: bull.flc ?? undefined,
      feed_saved: bull.feed_saved ?? undefined,
      cow_livability: bull.cow_livability ?? undefined,
      sire_calving_ease: bull.sire_calving_ease ?? undefined,
      beta_casein: bull.beta_casein ?? undefined,
      kappa_casein: bull.kappa_casein ?? undefined,
      HH1: bull.hh1 || 'Free',
      HH2: bull.hh2 || 'Free',
      HH3: bull.hh3 || 'Free',
      HH4: bull.hh4 || 'Free',
      HH5: bull.hh5 || 'Free',
      HH6: bull.hh6 || 'Free',
      reliability: bull.reliability ?? undefined,
      price_per_dose: bull.price_per_dose ?? undefined,
      _custom: true,
    };
    setCustomBulls(v => [...v, newBull]);
    return Promise.resolve(null);
  }

  function updateBullPrice(code: string, price: number) {
    setCustomBulls(v => v.map(b => b.code === code ? { ...b, price_per_dose: price } : b));
    return Promise.resolve(null);
  }

  return { bulls, bullRows, loading: false, reload: () => {}, addCustomBull, updateBullPrice };
}

// ── Females ──────────────────────────────────────────────────────────────────
export function useDemoFemales() {
  const [femaleRows, setFemaleRows] = useState<FemaleRow[]>(() =>
    (BASE_FEMALES as Female[]).map((f, i) => ({
      id: `female-${i}`,
      farm_id: 'demo-farm',
      animal_id: f.id,
      reg_id: f.reg_id ?? null,
      name: null,
      breed: f.breed || 'HO',
      lact: f.lact ?? 0,
      ginb: f.ginb ?? null,
      // Mérito econômico
      net_merit: f.net_merit ?? null,
      tpi: f.tpi ?? null,
      cheese_merit: f.cheese_merit ?? null,
      fluid_merit: f.fluid_merit ?? null,
      // Produção
      milk: f.milk ?? null,
      protein: f.protein ?? null,
      fat: f.fat ?? null,
      fat_pct: f.fat_pct ?? null,
      protein_pct: f.protein_pct ?? null,
      productive_life: f.productive_life ?? null,
      feed_efficiency: f.feed_efficiency ?? null,
      // Fertilidade
      dpr: f.dpr ?? null,
      hcr: f.hcr ?? null,
      ccr: f.ccr ?? null,
      fertility_index: f.fertility_index ?? null,
      early_first_calving: f.early_first_calving ?? null,
      // Saúde
      scs: f.scs ?? null,
      health_index: f.health_index ?? null,
      mastitis: f.mastitis ?? null,
      livability: f.livability ?? null,
      heifer_livability: f.heifer_livability ?? null,
      // Parto
      sire_calving_ease: f.sire_calving_ease ?? null,
      daughter_calving_ease: f.daughter_calving_ease ?? null,
      sire_stillbirth: f.sire_stillbirth ?? null,
      daughter_stillbirth: f.daughter_stillbirth ?? null,
      // Compostos de conformação
      ptat: f.ptat ?? null,
      udc: f.udc ?? null,
      flc: f.flc ?? null,
      bde: f.bde ?? null,
      dfm: f.dfm ?? null,
      // Traits individuais de conformação
      sta: f.sta ?? null,
      str_val: f.str_val ?? null,
      fls: f.fls ?? null,
      fta: f.fta ?? null,
      ftp: f.ftp ?? null,
      fua: f.fua ?? null,
      rlr: f.rlr ?? null,
      rls: f.rls ?? null,
      rpa: f.rpa ?? null,
      rtp: f.rtp ?? null,
      ruh: f.ruh ?? null,
      ruw: f.ruw ?? null,
      tlg: f.tlg ?? null,
      trw: f.trw ?? null,
      ucl: f.ucl ?? null,
      udp: f.udp ?? null,
      // Pedigree
      sire_naab: f.sire_naab ?? null,
      sire_name: f.sire_name ?? null,
      sire_reg: f.sire_reg ?? null,
      mgs_naab: f.mgs_naab ?? null,
      mgs_name: f.mgs_name ?? null,
      mmgs_naab: f.mmgs_naab ?? null,
      dam_id: null,
      dam_reg: f.dam_reg ?? null,
      dam_animal_id: f.dam_animal_id ?? null,
      // Caseínas
      beta_casein: f.beta_casein ?? null,
      kappa_casein: f.kappa_casein ?? null,
      // Metadata
      bdate: f.bdate ?? null,
      genomic: false,
      age: f.age ?? null,
      is_primiparous: false,
      notes: null,
      created_at: new Date().toISOString(),
    }))
  );

  const females: Female[] = femaleRows.map(r => rowToFemale(r));

  const reload = useCallback(() => {}, []);

  function upsertFemale(_farmId: string, f: Partial<FemaleRow> & { animal_id: string }) {
    setFemaleRows(rows => {
      const idx = rows.findIndex(r => r.animal_id === f.animal_id);
      if (idx >= 0) {
        const updated = [...rows];
        updated[idx] = { ...updated[idx], ...f };
        return updated;
      }
      return [...rows, {
        id: `female-new-${Date.now()}`,
        farm_id: 'demo-farm',
        ...f,
      } as FemaleRow];
    });
    return Promise.resolve(null);
  }

  function setPrimiparous(dbId: string, value: boolean) {
    setFemaleRows(rows => rows.map(r => r.id === dbId ? { ...r, is_primiparous: value } : r));
    return Promise.resolve(null);
  }

  function deleteFemale(dbId: string) {
    setFemaleRows(rows => rows.filter(r => r.id !== dbId));
    return Promise.resolve(null);
  }

  return { females, femaleRows, loading: false, reload, upsertFemale, setPrimiparous, deleteFemale };
}

// ── Tank ─────────────────────────────────────────────────────────────────────
export function useDemoTank(allBulls: Bull[]) {
  const [tankCodes, setTankCodes] = useState<Map<string, { doses: number | null; price: number | null; tankId: string }>>(
    () => new Map(lsGet<[string, { doses: number | null; price: number | null; tankId: string }][]>(LS_TANK, []))
  );

  function persist(m: typeof tankCodes) {
    setTankCodes(m);
    lsSet(LS_TANK, [...m.entries()]);
  }

  const tank: TankEntry[] = [...tankCodes.entries()].flatMap(([code, v]) => {
    const bull = allBulls.find(b => b.code === code);
    if (!bull) return [];
    return [{
      tankId: v.tankId,
      bull: { ...bull, price_per_dose: v.price ?? bull.price_per_dose },
      bullDbId: code,
      doses: v.doses,
      pricePerDose: v.price,
    }];
  });

  const tankBulls: Bull[] = tank.map(e => e.bull);
  const tankMap = new Map<string, TankEntry>(tank.map(e => [e.bull.code, e]));

  // bullDbId === bull.code in demo mode (see useDemoBulls)
  function addToTank(_farmId: string, bullDbId: string, doses?: number, price?: number) {
    const next = new Map(tankCodes);
    next.set(bullDbId, { doses: doses ?? null, price: price ?? null, tankId: `tank-${bullDbId}` });
    persist(next);
    return Promise.resolve(null);
  }

  function removeFromTank(tankId: string) {
    const next = new Map(tankCodes);
    for (const [code, v] of next) { if (v.tankId === tankId) { next.delete(code); break; } }
    persist(next);
    return Promise.resolve(null);
  }

  function updateTankEntry(tankId: string, doses: number | null, price: number | null) {
    const next = new Map(tankCodes);
    for (const [code, v] of next) {
      if (v.tankId === tankId) { next.set(code, { ...v, doses, price }); break; }
    }
    persist(next);
    return Promise.resolve(null);
  }

  return { tank, tankBulls, tankMap, loading: false, reload: () => {}, addToTank, removeFromTank, updateTankEntry };
}

// ── Weights ──────────────────────────────────────────────────────────────────
export function useDemoWeights() {
  const [weights, setWeightsState] = useState<WeightMap>(
    lsGet<WeightMap>(LS_WEIGHTS, PRESETS['balanced'] ?? PRESETS[Object.keys(PRESETS)[0]])
  );
  const [activePreset, setActivePreset] = useState('balanced');

  function setWeights(w: WeightMap) {
    setWeightsState(w);
    lsSet(LS_WEIGHTS, w);
  }

  function applyPreset(name: string) {
    const key = name.toLowerCase();
    if (PRESETS[key] || PRESETS[name]) {
      const w = PRESETS[key] || PRESETS[name];
      setWeights(w);
      setActivePreset(name);
    }
  }

  function savePreset(name: string) {
    applyPreset(name);
    return Promise.resolve(null);
  }

  return { weights, setWeights, presets: [], activePreset, setActivePreset, applyPreset, savePreset };
}

export { DEMO_FARM };
