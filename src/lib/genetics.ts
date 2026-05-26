/**
 * genetics.ts — Genefy v2
 * 
 * Todas as funções matemáticas/genéticas extraídas diretamente do
 * Genefy_Final__6_.html (versão validada). NÃO MODIFICAR a lógica aqui
 * sem validar contra o HTML original.
 * 
 * Fonte: BASE_BULLS (376 touros CDCB 12/2025) + FEMALES (469 vacas Granja Cavalli)
 */

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface Bull {
  code: string;
  name?: string;
  short_name?: string;
  full_name?: string;
  gtpi?: number | null;
  net_merit?: number | null;
  milk?: number | null;
  protein?: number | null;
  fat?: number | null;
  protein_pct?: number | null;
  fat_pct?: number | null;
  productive_life?: number | null;
  scs?: number | null;
  dpr?: number | null;
  hcr?: number | null;
  ccr?: number | null;
  fertility_index?: number | null;
  udc?: number | null;
  flc?: number | null;
  ptat?: number | null;
  feed_saved?: number | null;
  gfi?: number | null;
  cow_livability?: number | null;
  sire_calving_ease?: number | null;
  daughter_calving_ease?: number | null;
  calving_ease?: number | null;
  sire_stillbirth?: number | null;
  beta_casein?: string | null;
  kappa_casein?: string | null;
  HH1?: string;
  HH2?: string;
  HH3?: string;
  HH4?: string;
  HH5?: string;
  HH6?: string;
  reliability?: number | null;
  _custom?: boolean;
  // Nova propriedade para v2
  price_per_dose?: number | null;
  catalog?: string | null;
  // Index signature para acesso dinâmico em genetics.ts
  [key: string]: unknown;
}

export interface Female {
  id: string;
  reg_id?: string;
  breed?: string;
  age?: number | null;
  lact?: number | null;
  dim?: number | null;
  ginb?: number | null;
  gefi?: number | null;
  net_merit?: number | null;
  tpi?: number | null;
  milk?: number | null;
  protein?: number | null;
  fat?: number | null;
  fat_pct?: number | null;
  protein_pct?: number | null;
  productive_life?: number | null;
  dpr?: number | null;
  hcr?: number | null;
  ccr?: number | null;
  fertility_index?: number | null;
  udc?: number | null;
  flc?: number | null;
  scs?: number | null;
  // Mérito econômico expandido
  cheese_merit?: number | null;
  fluid_merit?: number | null;
  feed_efficiency?: number | null;
  // Saúde expandida
  health_index?: number | null;
  mastitis?: number | null;
  livability?: number | null;
  heifer_livability?: number | null;
  early_first_calving?: number | null;
  // Parto
  sire_calving_ease?: number | null;
  daughter_calving_ease?: number | null;
  sire_stillbirth?: number | null;
  daughter_stillbirth?: number | null;
  // Compostos de conformação
  ptat?: number | null;
  bde?: number | null;
  dfm?: number | null;
  // Traits individuais de conformação
  sta?: number | null;
  str_val?: number | null;
  fls?: number | null;
  fta?: number | null;
  ftp?: number | null;
  fua?: number | null;
  rlr?: number | null;
  rls?: number | null;
  rpa?: number | null;
  rtp?: number | null;
  ruh?: number | null;
  ruw?: number | null;
  tlg?: number | null;
  trw?: number | null;
  ucl?: number | null;
  udp?: number | null;
  // Pedigree
  sire_naab?: string | null;
  sire_name?: string | null;
  sire_reg?: string | null;
  mgs_naab?: string | null;
  mgs_name?: string | null;
  mmgs_naab?: string | null;
  dam_id?: string | null;
  dam_reg?: string | null;
  dam_animal_id?: string | null;
  bdate?: string | null;
  genomic?: boolean;
  _custom?: boolean;
  // Caseínas
  beta_casein?: string | null;
  kappa_casein?: string | null;
  // campos estimados pelo Parent Average
  _est_milk?: boolean;
  _est_net_merit?: boolean;
  _rel?: number;
  // Nova propriedade para v2
  is_primiparous?: boolean;
  // Index signature para acesso dinâmico em genetics.ts
  [key: string]: unknown;
}

export interface WeightMap {
  gtpi?: number;
  net_merit?: number;
  milk?: number;
  protein?: number;
  fat?: number;
  productive_life?: number;
  scs?: number;
  dpr?: number;
  fertility_index?: number;
  udc?: number;
  feed_saved?: number;
  cow_livability?: number;
  sire_calving_ease?: number;
  gfi?: number;
  [key: string]: number | undefined;
}

export interface ProgenyIndex {
  key: string;
  label: string;
  hi: boolean;
  fmt: (v: number) => string;
  pta: number | null;
  pppv: number | null;
}

export interface MatchResult {
  bull: Bull;
  inbreeding: number;
  score: number;
  carriers: string[];
  isCustom: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES CDCB
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuração dos índices: limites min/max para normalização e direção
 * (hi: true = maior é melhor, hi: false = menor é melhor)
 */
export const ICFG: Record<string, {
  lb: string; ds: string; hi: boolean; mn: number; mx: number;
}> = {
  gtpi:             { lb: 'GTPI',         ds: 'Índice Total Holstein',       hi: true,  mn: 2800, mx: 3512 },
  net_merit:        { lb: 'NM$',          ds: 'Net Merit (Mérito Líquido)',  hi: true,  mn: 200,  mx: 1155 },
  milk:             { lb: 'Leite (lbs)',  ds: 'PTA Leite',                   hi: true,  mn: -500, mx: 3000 },
  protein:          { lb: 'Proteína',     ds: 'PTA Proteína (lbs)',          hi: true,  mn: -10,  mx: 74   },
  fat:              { lb: 'Gordura',      ds: 'PTA Gordura (lbs)',           hi: true,  mn: -20,  mx: 134  },
  productive_life:  { lb: 'Longevidade',  ds: 'Vida Produtiva (PL)',         hi: true,  mn: -2,   mx: 7    },
  scs:              { lb: 'SCS',          ds: 'Células Somáticas (mastite)', hi: false, mn: 2.5,  mx: 3.2  },
  dpr:              { lb: 'DPR',          ds: 'Taxa Prenhez Filhas',         hi: true,  mn: -3,   mx: 3    },
  fertility_index:  { lb: 'Fertilidade',  ds: 'Índice de Fertilidade',       hi: true,  mn: -2,   mx: 3    },
  udc:              { lb: 'UDC (Úbere)',  ds: 'Conformação de Úbere',        hi: true,  mn: -1,   mx: 2.8  },
  feed_saved:       { lb: 'Eficiência',   ds: 'Feed Saved (lbs/ano)',        hi: true,  mn: -300, mx: 430  },
  cow_livability:   { lb: 'Vivabilidade', ds: 'Vivabilidade das Vacas',      hi: true,  mn: -5,   mx: 5    },
  sire_calving_ease:{ lb: 'Fac.Parto',   ds: 'Facilidade de Parto',         hi: false, mn: 0.8,  mx: 3.0  },
  gfi:              { lb: 'GFI (%)',      ds: 'Genomic Future Inbreeding',   hi: false, mn: 6.6,  mx: 13.9 },
};

/**
 * Desvios padrão oficiais da raça Holandesa (CDCB) — usados no cálculo de PPPV
 */
export const BREED_SD: Record<string, number> = {
  milk: 1200,
  protein: 40,
  fat: 50,
  productive_life: 2.5,
  scs: 0.25,
  dpr: 2.5,
  hcr: 3.0,
  ccr: 3.0,
  fertility_index: 2.5,
  udc: 1.0,
  flc: 1.0,
  net_merit: 250,
  feed_saved: 150,
  cow_livability: 3.0,
};

/**
 * Presets de pesos pré-definidos
 */
export const PRESETS: Record<string, WeightMap> = {
  balanced:    { gtpi:30, net_merit:25, milk:10, productive_life:15, scs:15, dpr:10, fertility_index:8, gfi:10, feed_saved:5, cow_livability:5, udc:3, sire_calving_ease:5, protein:3, fat:3 },
  milk:        { milk:50, protein:25, fat:15, gtpi:15, net_merit:10, scs:5, productive_life:5, dpr:5, gfi:5, fertility_index:3, feed_saved:2, cow_livability:2, udc:1, sire_calving_ease:2 },
  health:      { productive_life:35, scs:30, cow_livability:20, dpr:15, fertility_index:10, gtpi:10, gfi:8, net_merit:5, milk:3, sire_calving_ease:8, feed_saved:3, udc:2, protein:2, fat:2 },
  fertility:   { dpr:35, fertility_index:30, scs:15, productive_life:10, cow_livability:8, gfi:8, gtpi:5, net_merit:5, milk:5, feed_saved:3, udc:2, sire_calving_ease:5, protein:2, fat:2 },
  efficiency:  { feed_saved:35, net_merit:25, milk:15, gtpi:10, productive_life:10, scs:8, dpr:8, gfi:8, fertility_index:5, cow_livability:5, udc:2, sire_calving_ease:3, protein:5, fat:5 },
  conformation:{ udc:35, gtpi:20, productive_life:10, scs:10, dpr:8, gfi:8, net_merit:10, milk:5, feed_saved:3, cow_livability:3, sire_calving_ease:3, protein:2, fat:2, fertility_index:5 },
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÕES MATEMÁTICAS AUXILIARES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CDF da distribuição normal padrão
 * Método: Abramowitz & Stegun (sem scipy)
 * Precisão: ~7 casas decimais
 */
export function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const p = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * poly;
  return x >= 0 ? p : 1 - p;
}

/**
 * Formata PPPV para exibição
 */
export function fmtPppv(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return v >= 99.95 ? '>99%' : v + '%';
}

/**
 * Calcula PPPV (Probabilidade de Produção acima da Média da Raça)
 * @param ptaCria - PTA estimada da cria
 * @param relCombinada - confiabilidade combinada (ex: 0.725)
 * @param sdRaca - desvio padrão da raça para o índice
 * @param higherIsBetter - true para leite/NM$, false para SCS
 */
export function calcPppv(
  ptaCria: number,
  relCombinada: number,
  sdRaca: number,
  higherIsBetter = true
): number | null {
  if (!sdRaca) return null;
  const ptaAdj = higherIsBetter ? ptaCria : -ptaCria;
  const sdProg = sdRaca * Math.sqrt(Math.max(0.01, 1.0 - relCombinada));
  const z = ptaAdj / sdProg;
  return Math.round(normCdf(z) * 100 * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZAÇÃO E SCORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normaliza um valor de índice para 0-100
 */
export function norm(v: number | null | undefined, key: string): number {
  if (v == null) return 50;
  const c = ICFG[key];
  if (!c) return 50;
  let r = (v - c.mn) / (c.mx - c.mn);
  r = Math.max(0, Math.min(1, r));
  return c.hi ? r * 100 : (1 - r) * 100;
}

/**
 * Fator de ajuste pela confiabilidade REL%
 * Se useRel = false: retorna 1.0 (sem ajuste)
 * Fórmula: 0.5 + 0.5 * (REL/100)
 */
export function relFactor(bull: Bull, useRel = true): number {
  if (!useRel) return 1.0;
  const rel = bull.reliability ?? 75;
  return 0.5 + 0.5 * (rel / 100);
}

/**
 * Calcula o score ponderado de um touro com os pesos W
 * Ajustado pela confiabilidade REL%
 */
export function scoreBull(bull: Bull, W: WeightMap, useRel = true): number {
  let s = 0, tw = 0;
  for (const [k, w] of Object.entries(W)) {
    if (!w || w <= 0) continue;
    s += norm((bull as Record<string, unknown>)[k] as number, k) * w;
    tw += w;
  }
  const base = tw > 0 ? s / tw : 0;
  return parseFloat((base * relFactor(bull, useRel)).toFixed(1));
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSANGUINIDADE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estima consanguinidade esperada da cria (%)
 * Fórmula: (GFI touro / 2) + (gINB vaca / 4)
 * 
 * Nota: GFI do touro já incorpora sua própria consanguinidade futura esperada.
 * A divisão por 2 reflete que a cria herda metade do material genético do touro.
 * A divisão por 4 reflete que a vaca contribui 50% mas o valor dela
 * já é um valor acumulado — usamos 1/4 como estimativa conservadora.
 */
export function inb(female: Female, bull: Bull): number {
  return parseFloat(((bull.gfi ?? 12) / 2 + (female.ginb ?? 0) / 4).toFixed(2));
}

/**
 * Classifica o nível de consanguinidade
 */
export function inbClass(pct: number): { label: string; cls: string } {
  if (pct < 6.25) return { label: '✅ Ideal',      cls: 'ib-ok' };
  if (pct < 8)    return { label: '🟡 Aceitável',  cls: 'ib-ac' };
  if (pct < 10)   return { label: '⚠️ Alto',       cls: 'ib-hi' };
  return               { label: '❌ Crítico',     cls: 'ib-cr' };
}

// ─────────────────────────────────────────────────────────────────────────────
// HAPLÓTIPOS LETAIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna lista de haplótipos letais onde o touro é Portador
 */
export function getCarrierHaplotypes(bull: Bull): string[] {
  return ['HH1', 'HH2', 'HH3', 'HH4', 'HH5', 'HH6'].filter(
    h => (bull as Record<string, unknown>)[h] === 'Carrier'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFIL DA PROGÊNIE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o perfil genético esperado da bezerra (PTA + PPPV para cada índice)
 * 
 * Fórmula oficial CDCB: PTA_bezerra = (PTA_mãe + PTA_pai) / 2
 * PPPV = probabilidade da bezerra superar a média da raça Holandesa
 */
export function progenyProfile(female: Female, bull: Bull): ProgenyIndex[] {
  const relCow  = 0.65; // vacas do rebanho = pedigree ~65%
  const relBull = (bull.reliability ?? 75) / 100;
  const relComb = (relCow + relBull) / 2;

  const INDICES: Array<Omit<ProgenyIndex, 'pta' | 'pppv'>> = [
    { key: 'milk',            label: 'Leite (lbs)',    hi: true,  fmt: v => (v >= 0 ? '+' : '') + Math.round(v) },
    { key: 'protein',         label: 'Proteína (lbs)', hi: true,  fmt: v => (v >= 0 ? '+' : '') + Math.round(v) },
    { key: 'fat',             label: 'Gordura (lbs)',  hi: true,  fmt: v => (v >= 0 ? '+' : '') + Math.round(v) },
    { key: 'productive_life', label: 'Vida Produtiva', hi: true,  fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) },
    { key: 'scs',             label: 'SCS',            hi: false, fmt: v => v.toFixed(2) },
    { key: 'dpr',             label: 'DPR',            hi: true,  fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) },
    { key: 'fertility_index', label: 'Fertilidade',    hi: true,  fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) },
    { key: 'udc',             label: 'UDC (Úbere)',    hi: true,  fmt: v => (v >= 0 ? '+' : '') + v.toFixed(2) },
    { key: 'flc',             label: 'FLC (Pernas)',   hi: true,  fmt: v => (v >= 0 ? '+' : '') + v.toFixed(2) },
    { key: 'net_merit',       label: 'NM$ Estimado',   hi: true,  fmt: v => '$' + Math.round(v) },
  ];

  return INDICES.map(idx => {
    const cowVal  = (female as Record<string, unknown>)[idx.key] as number | null;
    const bullVal = (bull as Record<string, unknown>)[idx.key] as number | null;
    if (cowVal == null || bullVal == null) {
      return { ...idx, pta: null, pppv: null };
    }
    const pta  = (cowVal + bullVal) / 2;
    const pppv = calcPppv(pta, relComb, BREED_SD[idx.key], idx.hi);
    return { ...idx, pta, pppv };
  }).filter(i => i.pta !== null) as ProgenyIndex[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIABILIDADE DA VACA (CALCULADA PELO PEDIGREE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula confiabilidade da vaca baseada nos dados de pedigree disponíveis
 * 
 * Regras:
 * - Genômica (SNP chip): 80%
 * - Pai + MGS + MMGS informados: 72%
 * - Pai + MGS: 70%
 * - Só pai: 65%
 * - Sem dados: 55%
 */
export function calcCowRel(female: Female): number {
  if (female.genomic) return 0.80;
  if (female.sire_naab && female.mgs_naab && female.mmgs_naab) return 0.72;
  if (female.sire_naab && female.mgs_naab) return 0.70;
  if (female.sire_naab) return 0.65;
  return 0.55;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARENT AVERAGE (4 GERAÇÕES)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estima PTAs da vaca pelo método Parent Average (4 gerações)
 * Usado quando a vaca não tem avaliação genômica
 * 
 * Contribuições:
 * - Pai (SIRE):        50%
 * - Avô materno (MGS): 25%  (ou 50% da mãe, se mãe cadastrada)
 * - Bisavô mat. (MMGS):12.5%
 */
export function estimateCowPtas(
  female: Female,
  allBulls: Bull[],
  allFemales: Female[]
): Female {
  const INDICES = [
    'milk', 'protein', 'fat', 'productive_life', 'dpr',
    'fertility_index', 'udc', 'flc', 'net_merit', 'scs'
  ];

  const enriched: Female = { ...female };

  const sire  = female.sire_naab  ? allBulls.find(b => b.code === female.sire_naab)  : null;
  const mgs   = female.mgs_naab   ? allBulls.find(b => b.code === female.mgs_naab)   : null;
  const mmgs  = female.mmgs_naab  ? allBulls.find(b => b.code === female.mmgs_naab)  : null;
  const dam   = female.dam_id     ? allFemales.find(f => f.id === female.dam_id)     : null;

  for (const k of INDICES) {
    const existing = (enriched as Record<string, unknown>)[k];
    if (existing != null) continue; // já tem dado real

    let val = 0, weight = 0;

    if (dam && (dam as Record<string, unknown>)[k] != null) {
      val += (dam as Record<string, unknown>)[k] as number * 0.50;
      weight += 0.50;
    } else {
      if (mgs && (mgs as Record<string, unknown>)[k] != null) {
        val += (mgs as Record<string, unknown>)[k] as number * 0.25;
        weight += 0.25;
      }
      if (mmgs && (mmgs as Record<string, unknown>)[k] != null) {
        val += (mmgs as Record<string, unknown>)[k] as number * 0.125;
        weight += 0.125;
      }
    }

    if (sire && (sire as Record<string, unknown>)[k] != null) {
      val += (sire as Record<string, unknown>)[k] as number * 0.50;
      weight += 0.50;
    }

    if (weight > 0) {
      (enriched as Record<string, unknown>)[k] = parseFloat((val).toFixed(2));
      (enriched as Record<string, unknown>)[`_est_${k}`] = true;
    }
  }

  if (enriched.ginb == null) {
    enriched.ginb = parseFloat(estimateGinb(female, allBulls, allFemales).toFixed(2));
  }
  enriched._rel = calcCowRel(female);
  return enriched;
}

/**
 * Estima gINB da vaca pelo pedigree quando não disponível
 */
export function estimateGinb(
  female: Female,
  allBulls: Bull[],
  allFemales: Female[]
): number {
  if (female.ginb != null) return female.ginb;
  if (female.dam_id) {
    const dam = allFemales.find(f => f.id === female.dam_id);
    if (dam) return estimateGinb(dam, allBulls, allFemales) * 0.5;
  }
  if (female.sire_naab) {
    const sire = allBulls.find(b => b.code === female.sire_naab);
    if (sire) return ((sire.gfi ?? 12) * 0.5 + 8) / 2; // conservador
  }
  return 10.0; // default conservador para rebanho sem pedigree
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHING — TOP 3 OPÇÕES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula as top 3 opções de touro para uma vaca:
 * - Opção 1: melhor score genético
 * - Opção 2: segundo melhor score
 * - Opção 3: touro com menor preço/dose que passa nos critérios (opção econômica)
 *            Se nenhum touro tiver preço cadastrado, retorna o 3º por score.
 * 
 * @param female - vaca a ser acasalada
 * @param bulls - lista de touros disponíveis (botijão ou catálogo)
 * @param W - pesos dos índices
 * @param maxInb - consanguinidade máxima permitida
 * @param onlyA2 - filtrar apenas touros A2A2
 * @param useRel - usar fator de confiabilidade no score
 */
export function getTop3Options(
  female: Female,
  bulls: Bull[],
  W: WeightMap,
  maxInb = 8.5,
  onlyA2 = false,
  useRel = true
): Array<{ rank: number; type: 'score' | 'economic'; bull: Bull; inbreeding: number; score: number; carriers: string[] }> {
  // Filtrar touros elegíveis
  const eligible = bulls
    .filter(b => !female.sire_naab || b.code !== female.sire_naab)
    .filter(b => inb(female, b) <= maxInb)
    .filter(b => !onlyA2 || b.beta_casein === 'A2A2')
    .map(b => {
      const i = inb(female, b);
      let sc = scoreBull(b, W, useRel);
      // Penalidade por consanguinidade alta
      if (i > 10) sc -= 20;
      else if (i > 8) sc -= 10;
      else if (i > 6.25) sc -= 3;
      return {
        bull: b,
        inbreeding: i,
        score: sc,
        carriers: getCarrierHaplotypes(b),
      };
    })
    .sort((a, b2) => b2.score - a.score);

  if (!eligible.length) return [];

  const result: Array<{ rank: number; type: 'score' | 'economic'; bull: Bull; inbreeding: number; score: number; carriers: string[] }> = [];

  // Opção 1: melhor score
  if (eligible[0]) {
    result.push({ rank: 1, type: 'score', ...eligible[0] });
  }

  // Opção 2: segundo melhor score
  if (eligible[1]) {
    result.push({ rank: 2, type: 'score', ...eligible[1] });
  }

  // Opção 3: menor preço (econômica) ou 3º por score
  const withPrice = eligible.filter(e => e.bull.price_per_dose != null);
  if (withPrice.length > 0) {
    // Ordenar pelo menor preço
    withPrice.sort((a, b2) => (a.bull.price_per_dose ?? 0) - (b2.bull.price_per_dose ?? 0));
    // Pegar o mais barato que não seja já a 1ª ou 2ª opção
    const topCodes = new Set([eligible[0]?.bull.code, eligible[1]?.bull.code]);
    const economic = withPrice.find(e => !topCodes.has(e.bull.code));
    if (economic) {
      result.push({ rank: 3, type: 'economic', ...economic });
    } else {
      // Todos com preço já aparecem no top 2 — usa 3º por score
      if (eligible[2]) result.push({ rank: 3, type: 'score', ...eligible[2] });
    }
  } else {
    // Nenhum touro com preço cadastrado — 3º por score
    if (eligible[2]) result.push({ rank: 3, type: 'score', ...eligible[2] });
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANO DE ACASALAMENTO (PA) — ALGORITMO DE ALOCAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanResult {
  female: Female;
  bull: Bull | null;
  score: number;
  inbreeding: number;
  progeny: ProgenyIndex[];
  allOptions: Array<{ bull: Bull; score: number; inbreeding: number }>;
  doseAllocated: boolean;
}

/**
 * Executa o Plano de Acasalamento para um conjunto de vacas
 * usando touros do botijão.
 * 
 * Algoritmo: greedy com restrição de doses
 * - Prioriza vacas com MENOS opções disponíveis (evita vacas sem touro)
 * - Respeita limite de doses por touro
 * - Para cada vaca: escolhe o melhor touro disponível por score
 * 
 * @param females - vacas selecionadas para o plano
 * @param tankBulls - Map<code, { doses: number | null }>
 * @param allBulls - todos os touros do sistema
 * @param W - pesos
 * @param maxInb - consanguinidade máxima
 */
export function runMatingPlan(
  females: Female[],
  tankBulls: Map<string, { doses: number | null }>,
  allBulls: Bull[],
  W: WeightMap,
  maxInb = 8.5
): PlanResult[] {
  const tankList = allBulls.filter(b => tankBulls.has(b.code));
  const dosesUsed = new Map<string, number>();
  tankList.forEach(b => dosesUsed.set(b.code, 0));

  // FASE 1: calcular score de todos os pares vaca × touro do botijão
  const allPairs: Array<{ female: Female; pairs: Array<{ bull: Bull; score: number; inbreeding: number }> }> = [];

  for (const female of females) {
    const cowPairs: Array<{ bull: Bull; score: number; inbreeding: number }> = [];
    for (const bull of tankList) {
      if (female.sire_naab && bull.code === female.sire_naab) continue;
      const i = inb(female, bull);
      if (i > maxInb) continue;
      let sc = scoreBull(bull, W);
      if (i > 10) sc -= 20; else if (i > 8) sc -= 10; else if (i > 6.25) sc -= 3;
      cowPairs.push({ bull, score: sc, inbreeding: i });
    }
    cowPairs.sort((a, b2) => b2.score - a.score);
    if (cowPairs.length > 0) allPairs.push({ female, pairs: cowPairs });
    else allPairs.push({ female, pairs: [] });
  }

  // FASE 2: alocação inteligente — vacas com menos opções primeiro
  const sortedPairs = [...allPairs].sort((a, b2) => a.pairs.length - b2.pairs.length);

  const assigned = new Map<string, PlanResult>();

  for (const { female, pairs } of sortedPairs) {
    let chosen: { bull: Bull; score: number; inbreeding: number } | null = null;

    for (const pair of pairs) {
      const data = tankBulls.get(pair.bull.code);
      const used = dosesUsed.get(pair.bull.code) ?? 0;
      const dosesTotal = data?.doses;
      if (dosesTotal != null && used >= dosesTotal) continue;
      chosen = pair;
      break;
    }

    if (chosen) {
      dosesUsed.set(chosen.bull.code, (dosesUsed.get(chosen.bull.code) ?? 0) + 1);
      assigned.set(female.id, {
        female,
        bull: chosen.bull,
        score: Math.round(chosen.score),
        inbreeding: chosen.inbreeding,
        progeny: progenyProfile(female, chosen.bull),
        allOptions: pairs,
        doseAllocated: true,
      });
    } else {
      assigned.set(female.id, {
        female,
        bull: null,
        score: 0,
        inbreeding: 0,
        progeny: [],
        allOptions: pairs,
        doseAllocated: false,
      });
    }
  }

  // Restaurar ordem original das vacas
  return females.map(f => assigned.get(f.id)!).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSCA POR META GENÉTICA
// ─────────────────────────────────────────────────────────────────────────────

export interface MetaGoals {
  gtpi?: number | null;
  net_merit?: number | null;
  milk?: number | null;
  productive_life?: number | null;
  scs?: number | null;
  dpr?: number | null;
}

export interface MetaResult {
  female: Female;
  bull: Bull;
  deviation: number;
  progenyPtas: Record<string, number>;
  inbreeding: number;
}

/**
 * Busca as top N combinações vaca × touro mais próximas de uma meta genética
 * 
 * @param females - todas as vacas do sistema
 * @param bulls - todos os touros do sistema
 * @param goals - metas para cada índice
 * @param maxInb - consanguinidade máxima (default 10%)
 * @param topN - número de resultados (default 10)
 */
export function searchByGoal(
  females: Female[],
  bulls: Bull[],
  goals: MetaGoals,
  maxInb = 10,
  topN = 10
): MetaResult[] {
  const hasGoal = Object.values(goals).some(v => v != null);
  if (!hasGoal) return [];

  const results: MetaResult[] = [];

  for (const female of females) {
    for (const bull of bulls) {
      if (female.sire_naab && bull.code === female.sire_naab) continue;
      const i = inb(female, bull);
      if (i > maxInb) continue;

      const progenyProfile_ = progenyProfile(female, bull);
      const pta: Record<string, number> = {};
      progenyProfile_.forEach(p => { if (p.pta != null) pta[p.key] = p.pta; });

      let totalDev = 0, count = 0;

      if (goals.gtpi != null && bull.gtpi != null) {
        const range = ICFG.gtpi.mx - ICFG.gtpi.mn;
        totalDev += Math.abs(bull.gtpi - goals.gtpi) / range;
        count++;
      }
      if (goals.net_merit != null && pta.net_merit != null) {
        const range = ICFG.net_merit.mx - ICFG.net_merit.mn;
        totalDev += Math.abs(pta.net_merit - goals.net_merit) / range;
        count++;
      }
      if (goals.milk != null && pta.milk != null) {
        const range = ICFG.milk.mx - ICFG.milk.mn;
        totalDev += Math.abs(pta.milk - goals.milk) / range;
        count++;
      }
      if (goals.productive_life != null && pta.productive_life != null) {
        const range = ICFG.productive_life.mx - ICFG.productive_life.mn;
        totalDev += Math.abs(pta.productive_life - goals.productive_life) / range;
        count++;
      }
      if (goals.scs != null && pta.scs != null) {
        const range = ICFG.scs.mx - ICFG.scs.mn;
        const excess = Math.max(0, pta.scs - goals.scs);
        totalDev += excess / range;
        count++;
      }
      if (goals.dpr != null && pta.dpr != null) {
        const range = ICFG.dpr.mx - ICFG.dpr.mn;
        totalDev += Math.abs(pta.dpr - goals.dpr) / range;
        count++;
      }

      if (count === 0) continue;
      results.push({ female, bull, deviation: totalDev / count, progenyPtas: pta, inbreeding: i });
    }
  }

  results.sort((a, b2) => a.deviation - b2.deviation);
  return results.slice(0, topN);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE FORMATAÇÃO (usados na UI)
// ─────────────────────────────────────────────────────────────────────────────

export function fmt(v: number | null | undefined, d = 0): string {
  if (v == null) return '—';
  const n = parseFloat(String(v));
  return (n >= 0 ? '+' : '') + n.toFixed(d);
}

export function plain(v: number | null | undefined, d = 0): string {
  return v == null ? '—' : parseFloat(String(v)).toFixed(d);
}

export function scsColor(v: number | null): string {
  return (v ?? 3) < 2.8 ? '#D5F5E3' : (v ?? 3) < 3 ? '#FFFDE7' : '#FADBD8';
}

export function gfiColor(v: number | null): string {
  return (v ?? 12) < 9 ? '#D5F5E3' : (v ?? 12) < 11 ? '#FFFDE7' : '#FADBD8';
}

export function relColor(v: number | null): string {
  return (v ?? 75) >= 90 ? '#D5F5E3' : (v ?? 75) >= 80 ? '#FFFDE7' : '#FFE0B2';
}

export function scoreClass(v: number | string): string {
  const n = parseFloat(String(v));
  return n >= 70 ? 'sc-hi' : n >= 50 ? 'sc-md' : 'sc-lo';
}

export function pppvClass(pppv: number | null): 'hi' | 'md' | 'lo' {
  if (pppv == null) return 'lo';
  if (pppv >= 75) return 'hi';
  if (pppv >= 50) return 'md';
  return 'lo';
}

/**
 * Calcula meses até a primeira IA (referência: 26 meses de idade)
 */
export function monthsToBreeding(bdate: string | null): number | null {
  if (!bdate) return null;
  const [d, m, y] = bdate.includes('/') ? bdate.split('/') : [1, 1, bdate];
  const born = new Date(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  if (isNaN(born.getTime())) return null;
  const target = new Date(born);
  target.setMonth(target.getMonth() + 26);
  const now = new Date();
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.5));
}
