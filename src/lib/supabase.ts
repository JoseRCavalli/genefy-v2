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
  is_custom: boolean;
  source: string;
  created_at: string;
}

export interface FemaleRow {
  id: string;
  farm_id: string;
  animal_id: string;
  name: string | null;
  breed: string;
  lact: number;
  ginb: number | null;
  net_merit: number | null;
  milk: number | null;
  protein: number | null;
  fat: number | null;
  productive_life: number | null;
  dpr: number | null;
  fertility_index: number | null;
  udc: number | null;
  flc: number | null;
  scs: number | null;
  sire_naab: string | null;
  mgs_naab: string | null;
  mmgs_naab: string | null;
  dam_id: string | null;
  bdate: string | null;
  genomic: boolean;
  age: number | null;
  is_primiparous: boolean;
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
