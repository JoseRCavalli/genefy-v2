import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/supabase-server';
import { loadMergedBulls, loadFemales } from '../../../../lib/calc-data-server';
import { runMatingPlan } from '../../../../lib/matching';
import type { WeightMap } from '../../../../lib/genetics';

/**
 * POST /api/calc/mating-plan
 * body { farmId, femaleAnimalIds: string[], tank: [code, doses|null][],
 *        weights, maxInb }
 * Roda runMatingPlan (genetics.ts) no servidor. Retorna PlanResult[].
 */
export async function POST(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, femaleAnimalIds, tank, weights, maxInb } = await request.json();

  if (!farmId || !Array.isArray(femaleAnimalIds) || !Array.isArray(tank) || !weights) {
    return NextResponse.json(
      { error: 'farmId, femaleAnimalIds[], tank[] e weights obrigatórios' },
      { status: 400 }
    );
  }

  const [allBulls, females] = await Promise.all([
    loadMergedBulls(supabase, farmId),
    loadFemales(supabase, farmId, femaleAnimalIds),
  ]);

  const tankMap = new Map<string, { doses: number | null }>(
    (tank as [string, number | null][]).map(([code, doses]) => [code, { doses }])
  );

  const results = runMatingPlan(females, tankMap, allBulls, weights as WeightMap, maxInb ?? 8.5);
  return NextResponse.json(results);
}
