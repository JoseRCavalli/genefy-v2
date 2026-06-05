/**
 * Façade de CÁLCULO do client (Fase 2).
 *
 * Modo real (SupabaseApp logado): os cálculos rodam no SERVIDOR via
 * /api/calc/* — o client manda ids/códigos + parâmetros, nunca os dados.
 *
 * Modo demo (NEXT_PUBLIC_DEMO_MODE=true) e conta demo@gmail.com: os cálculos
 * rodam LOCALMENTE com genetics.ts (que permanece agnóstico de framework) —
 * nenhuma chamada à API, como definido no plano da Fase 2.
 */
import {
  getTop3Options,
  runMatingPlan,
  searchByGoal,
} from './matching';
import { calcularIndicesProgenie } from '../utils/calcularProgenie';
import type { Bull, Female, WeightMap, PlanResult, MetaGoals, MetaResult } from './genetics';
import type { PerfilProgenieProps } from '../types/PerfilProgenie.types';

export type MatchOption = ReturnType<typeof getTop3Options>[number];

const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/** true = calcular localmente (DemoApp ou conta demo@gmail.com). */
export function isLocalCalc(userEmail: string | null | undefined): boolean {
  return IS_DEMO_MODE || userEmail === 'demo@gmail.com';
}

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
  local: boolean;
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
  const { local, farmId, females, bulls, bullsIsFullSet, weights, maxInb, a2a2Only, useRel } = params;

  if (local) {
    const out: Record<string, MatchOption[]> = {};
    for (const female of females) {
      out[female.id] = getTop3Options(female, bulls, weights, maxInb, a2a2Only, useRel);
    }
    return out;
  }

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
  local: boolean;
  farmId: string;
  females: Female[];
  tank: [code: string, doses: number | null][];
  allBulls: Bull[];
  weights: WeightMap;
  maxInb: number;
}

/** Plano de acasalamento (alocação greedy com restrição de doses). */
export async function calcMatingPlan(params: MatingPlanParams): Promise<PlanResult[]> {
  const { local, farmId, females, tank, allBulls, weights, maxInb } = params;

  if (local) {
    const tankMap = new Map<string, { doses: number | null }>(
      tank.map(([code, doses]) => [code, { doses }])
    );
    return runMatingPlan(females, tankMap, allBulls, weights, maxInb);
  }

  return post('/api/calc/mating-plan', {
    farmId,
    femaleAnimalIds: females.map(f => f.id),
    tank,
    weights,
    maxInb,
  });
}

interface MetaSearchParams {
  local: boolean;
  farmId: string;
  females: Female[];
  bulls: Bull[];
  bullsIsFullSet: boolean;
  goals: MetaGoals;
}

/** Busca por meta genética. */
export async function calcMetaSearch(params: MetaSearchParams): Promise<MetaResult[]> {
  const { local, farmId, females, bulls, bullsIsFullSet, goals } = params;

  if (local) {
    return searchByGoal(females, bulls, goals);
  }

  return post('/api/calc/meta-search', {
    farmId,
    goals,
    bullCodes: bullsIsFullSet ? null : bulls.map(b => b.code),
  });
}

interface ProgenyParams {
  local: boolean;
  farmId: string;
  female: Female;
  bull: Bull;
}

/** Perfil Genético da Progênie (modal). */
export async function calcProgeny(params: ProgenyParams): Promise<PerfilProgenieProps> {
  const { local, farmId, female, bull } = params;

  if (local) {
    return calcularIndicesProgenie(female, bull);
  }

  return post('/api/calc/progeny', {
    farmId,
    femaleAnimalId: female.id,
    bullCode: bull.code,
  });
}
