import { NextRequest, NextResponse } from 'next/server';
import { getCalcContext } from '../../../../lib/calc-data-server';
import { runMatingPlan } from '../../../../lib/matching';
import type { WeightMap } from '../../../../lib/genetics';

/**
 * POST /api/calc/mating-plan
 * body { farmId, femaleAnimalIds: string[], tank: [code, doses|null][],
 *        weights, maxInb }
 * Roda runMatingPlan (genetics.ts) no servidor. Retorna PlanResult[].
 * Sessão demo (cookie): computa sobre DEMO_FEMALES + catálogo, sem Supabase
 * (o botijão demo vem no payload — vive no localStorage do browser).
 */
export async function POST(request: NextRequest) {
  const { farmId, femaleAnimalIds, tank, weights, maxInb } = await request.json();

  if (!farmId || !Array.isArray(femaleAnimalIds) || !Array.isArray(tank) || !weights) {
    return NextResponse.json(
      { error: 'farmId, femaleAnimalIds[], tank[] e weights obrigatórios' },
      { status: 400 }
    );
  }

  const { allBulls, females, error } = await getCalcContext(farmId, femaleAnimalIds);
  if (error) return error;

  const tankMap = new Map<string, { doses: number | null }>(
    (tank as [string, number | null][]).map(([code, doses]) => [code, { doses }])
  );

  const results = runMatingPlan(females, tankMap, allBulls, weights as WeightMap, maxInb ?? 8.5);
  return NextResponse.json(results);
}
