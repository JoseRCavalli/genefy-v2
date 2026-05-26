import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── DB Types ────────────────────────────────────────────────────────────────

export interface FarmRow {
  id: string;
  name: string;
  owner_name: string | null;
  created_at: string;
}

export interface BullRow {
  id: string;
  farm_id: string | null;
  code: string;
  short_name: string | null;
  full_name: string | null;
  gtpi: number | null;
  net_merit: number | null;
  gfi: number | null;
  reliability: number | null;
  milk: number | null;
  protein: number | null;
  fat: number | null;
  productive_life: number | null;
  scs: number | null;
  dpr: number | null;
  hcr: number | null;
  ccr: number | null;
  fertility_index: number | null;
  ptat: number | null;
  udc: number | null;
  flc: number | null;
  feed_saved: number | null;
  cow_livability: number | null;
  sire_calving_ease: number | null;
  beta_casein: string | null;
  kappa_casein: string | null;
  hh1: string;
  hh2: string;
  hh3: string;
  hh4: string;
  hh5: string;
  hh6: string;
  price_per_dose: number | null;
  catalog: string | null;
  is_custom: boolean;
  source: string;
  created_at: string;
}

export interface FemaleRow {
  id: string;
  farm_id: string;
  animal_id: string;
  reg_id: string | null;
  name: string | null;
  breed: string;
  lact: number;
  ginb: number | null;
  net_merit: number | null;
  tpi: number | null;
  milk: number | null;
  protein: number | null;
  fat: number | null;
  fat_pct: number | null;
  protein_pct: number | null;
  productive_life: number | null;
  dpr: number | null;
  hcr: number | null;
  ccr: number | null;
  fertility_index: number | null;
  udc: number | null;
  flc: number | null;
  scs: number | null;
  // Mérito econômico expandido
  cheese_merit: number | null;
  fluid_merit: number | null;
  feed_efficiency: number | null;
  // Saúde expandida
  health_index: number | null;
  mastitis: number | null;
  livability: number | null;
  heifer_livability: number | null;
  early_first_calving: number | null;
  // Parto
  sire_calving_ease: number | null;
  daughter_calving_ease: number | null;
  sire_stillbirth: number | null;
  daughter_stillbirth: number | null;
  // Compostos de conformação
  ptat: number | null;
  bde: number | null;
  dfm: number | null;
  // Traits individuais de conformação
  sta: number | null;
  str_val: number | null;
  fls: number | null;
  fta: number | null;
  ftp: number | null;
  fua: number | null;
  rlr: number | null;
  rls: number | null;
  rpa: number | null;
  rtp: number | null;
  ruh: number | null;
  ruw: number | null;
  tlg: number | null;
  trw: number | null;
  ucl: number | null;
  udp: number | null;
  // Pedigree
  sire_naab: string | null;
  sire_name: string | null;
  sire_reg: string | null;
  mgs_naab: string | null;
  mgs_name: string | null;
  mmgs_naab: string | null;
  dam_id: string | null;
  dam_reg: string | null;
  dam_animal_id: string | null;
  bdate: string | null;
  genomic: boolean;
  age: number | null;
  is_primiparous: boolean;
  // Caseínas
  beta_casein: string | null;
  kappa_casein: string | null;
  notes: string | null;
  created_at: string;
}

export interface TankBullRow {
  id: string;
  farm_id: string;
  bull_id: string;
  doses: number | null;
  price_per_dose: number | null;
  created_at: string;
  bulls?: BullRow;
}

export interface MatingRow {
  id: string;
  farm_id: string;
  female_id: string;
  bull_id: string;
  option_rank: number;
  score: number | null;
  inbreeding_pct: number | null;
  is_sexed_semen: boolean;
  status: 'planned' | 'executed' | 'confirmed_pregnant' | 'failed';
  mating_date: string | null;
  notes: string | null;
  created_at: string;
  females?: FemaleRow;
  bulls?: BullRow;
}

export interface WeightPresetRow {
  id: string;
  farm_id: string;
  name: string;
  weights: Record<string, number>;
  created_at: string;
}
