/**
 * Façade de CÁLCULO do client (Fase 3).
 *
 * TODOS os cálculos rodam no SERVIDOR via /api/calc/* — inclusive para a
 * sessão demo (o servidor detecta o cookie e computa sobre dados fictícios).
 * Este módulo não importa genetics.ts em runtime: os algoritmos de decisão
 * (getTop3Options, runMatingPlan, searchByGoal) NÃO existem no bundle do
 * client. Os tipos abaixo usam `typeof import(...)`, apagado na compilação.
 */
import type { Bull, Female, WeightMap, PlanResult, MetaGoals, MetaResult } from './genetics';
import type { PerfilProgenieProps } from '../types/PerfilProgenie.types';

type Matching = typeof import('./matching');
export type MatchOption = ReturnType<Matching['getTop3Options']>[number];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.json().then(b => b.error).catch(() => null);
    throw new Error(msg ?? `Erro ${res.status} em ${url}`);
  }
  return res.json() as Promise<T>;
}

interface Top3Params {
  farmId: string;
  females: Female[];
  /** Lista de touros JÁ filtrada pela UI (tankOnly/catálogo). */
  bulls: Bull[];
  /** true quando `bulls` é o conjunto completo — evita mandar 2,7k códigos. */
  bullsIsFullSet: boolean;
  weights: WeightMap;
  maxInb: number;
  a2a2Only: boolean;
  useRel: boolean;
}

/** Top 3 opções por fêmea (1..N fêmeas em uma chamada). */
export async function calcTop3(params: Top3Params): Promise<Record<string, MatchOption[]>> {
  const { farmId, females, bulls, bullsIsFullSet, weights, maxInb, a2a2Only, useRel } = params;

  return post('/api/calc/top3', {
    farmId,
    femaleAnimalIds: females.map(f => f.id),
    bullCodes: bullsIsFullSet ? null : bulls.map(b => b.code),
    weights,
    maxInb,
    a2a2Only,
    useRel,
  });
}

interface MatingPlanParams {
  farmId: string;
  females: Female[];
  tank: [code: string, doses: number | null][];
  weights: WeightMap;
  maxInb: number;
}

/** Plano de acasalamento (alocação greedy com restrição de doses). */
export async function calcMatingPlan(params: MatingPlanParams): Promise<PlanResult[]> {
  const { farmId, females, tank, weights, maxInb } = params;

  return post('/api/calc/mating-plan', {
    farmId,
    femaleAnimalIds: females.map(f => f.id),
    tank,
    weights,
    maxInb,
  });
}

interface MetaSearchParams {
  farmId: string;
  bulls: Bull[];
  bullsIsFullSet: boolean;
  goals: MetaGoals;
}

/** Busca por meta genética. */
export async function calcMetaSearch(params: MetaSearchParams): Promise<MetaResult[]> {
  const { farmId, bulls, bullsIsFullSet, goals } = params;

  return post('/api/calc/meta-search', {
    farmId,
    goals,
    bullCodes: bullsIsFullSet ? null : bulls.map(b => b.code),
  });
}

interface ProgenyParams {
  farmId: string;
  female: Female;
  bull: Bull;
}

/** Perfil Genético da Progênie (modal). */
export async function calcProgeny(params: ProgenyParams): Promise<PerfilProgenieProps> {
  const { farmId, female, bull } = params;

  return post('/api/calc/progeny', {
    farmId,
    femaleAnimalId: female.id,
    bullCode: bull.code,
  });
}
