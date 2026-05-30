/**
 * herd-strategy.types.ts — Genefy v2 / Beef on Dairy Module
 *
 * Tipos para o modulo de Estrategia de Rebanho:
 * - Classificacao de femeas por merito genetico
 * - Planejamento de reposicao
 * - Calculo economico Beef on Dairy vs. convencional
 */

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DE TOURO
// ─────────────────────────────────────────────────────────────────────────────

export type BullType = 'dairy' | 'beef_on_dairy' | 'beef';

export interface BeefTraits {
  birth_ease: number;       // 0-100, maior = melhor facilidade de parto
  weaning_weight: number;   // kg esperado ao desmame
  carcass_quality: number;  // 0-100, qualidade de carcaca
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTRATEGIA DE REBANHO
// ─────────────────────────────────────────────────────────────────────────────

export interface HerdStrategy {
  id?: string;
  farm_id: string;

  // Parametros do rebanho
  total_cows: number;
  current_daily_milk_liters: number;
  target_daily_milk_liters: number;
  replacement_rate_pct: number;

  // Mortalidade
  calf_mortality_pct: number;
  heifer_mortality_pct: number;
  cow_mortality_pct: number;

  // Reprodutivos
  conception_rate_pct: number;
  calving_interval_days: number;
  age_first_calving_months: number;

  // Economicos (BRL)
  milk_price_per_liter: number;
  heifer_sale_price: number;
  beef_calf_sale_price: number;
  dairy_calf_sale_price: number;
  heifer_raising_cost: number;

  // Limiares de classificacao
  elite_percentile: number;
  mid_percentile: number;
  max_sexed_inseminations: number;

  // Custos de semen
  semen_costs: SemenCosts;
}

export interface SemenCosts {
  sexed_premium: number;
  sexed_budget: number;
  conventional: number;
  beef: number;
}

export const DEFAULT_SEMEN_COSTS: SemenCosts = {
  sexed_premium: 85,
  sexed_budget: 45,
  conventional: 25,
  beef: 40,
};

export const DEFAULT_HERD_STRATEGY: Omit<HerdStrategy, 'farm_id'> = {
  total_cows: 100,
  current_daily_milk_liters: 3200,
  target_daily_milk_liters: 3800,
  replacement_rate_pct: 30,
  calf_mortality_pct: 5,
  heifer_mortality_pct: 3,
  cow_mortality_pct: 2,
  conception_rate_pct: 50,
  calving_interval_days: 400,
  age_first_calving_months: 26,
  milk_price_per_liter: 2.80,
  heifer_sale_price: 4500,
  beef_calf_sale_price: 1200,
  dairy_calf_sale_price: 150,
  heifer_raising_cost: 3200,
  elite_percentile: 25,
  mid_percentile: 60,
  max_sexed_inseminations: 3,
  semen_costs: { ...DEFAULT_SEMEN_COSTS },
};

// ─────────────────────────────────────────────────────────────────────────────
// CLASSIFICACAO DE FEMEAS
// ─────────────────────────────────────────────────────────────────────────────

export type AssignmentGroup =
  | 'elite_replacement'
  | 'sale_heifer'
  | 'conventional'
  | 'beef_cross';

export type SemenType =
  | 'sexed_premium'
  | 'sexed_budget'
  | 'conventional'
  | 'beef';

export interface FemaleAssignment {
  female_id: string;          // animal_id da femea
  db_id: string;              // UUID do banco (ou id demo)
  assignment_group: AssignmentGroup;
  merit_rank: number;         // 1 = melhor
  merit_percentile: number;   // 0–100
  composite_merit_score: number;
  recommended_semen_type: SemenType;
  insemination_order: number; // tentativa atual (1, 2, 3...)
  economic_value_brl: number; // valor estimado vs. convencional
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANEJAMENTO DE REPOSICAO
// ─────────────────────────────────────────────────────────────────────────────

export interface ReplacementPlan {
  replacements_needed_per_year: number;
  heifers_to_generate: number;
  additional_cows_for_target: number;
  total_heifers_needed: number;
  heifers_available_from_herd: number;
  surplus_for_sale: number;
  deficit: number;              // negativo = sem deficit
  months_to_reach_target: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// RETORNO ECONOMICO
// ─────────────────────────────────────────────────────────────────────────────

export interface EconomicScenario {
  label: string;
  beef_calves_revenue: number;
  heifers_sold_revenue: number;
  dairy_calves_revenue: number;
  semen_cost: number;
  raising_cost: number;
  net_revenue: number;
}

export interface BeefOnDairyEconomics {
  scenario_conventional: EconomicScenario;
  scenario_beef_on_dairy: EconomicScenario;
  annual_gain: number;
  gain_per_cow: number;
  gain_per_liter: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// LABELS E CORES (para UI)
// ─────────────────────────────────────────────────────────────────────────────

export const GROUP_LABELS: Record<AssignmentGroup, string> = {
  elite_replacement: 'Reposicao Elite',
  sale_heifer: 'Venda de Novilha',
  conventional: 'Convencional',
  beef_cross: 'Cruzamento Corte',
};

export const GROUP_COLORS: Record<AssignmentGroup, { bg: string; text: string; border: string }> = {
  elite_replacement: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  sale_heifer: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  conventional: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  beef_cross: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export const SEMEN_TYPE_LABELS: Record<SemenType, string> = {
  sexed_premium: 'Sexado Premium',
  sexed_budget: 'Sexado',
  conventional: 'Convencional',
  beef: 'Corte',
};

export const BULL_TYPE_LABELS: Record<BullType, string> = {
  dairy: 'Leiteiro',
  beef_on_dairy: 'Beef on Dairy',
  beef: 'Corte',
};
