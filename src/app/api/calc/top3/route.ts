import { NextRequest, NextResponse } from 'next/server';
import { getCalcContext } from '../../../../lib/calc-data-server';
import { getTop3Options } from '../../../../lib/matching';
import type { WeightMap } from '../../../../lib/genetics';

/**
 * POST /api/calc/top3
 * body { farmId, femaleAnimalIds: string[], bullCodes?: string[] | null,
 *        weights, maxInb, a2a2Only, useRel }
 * Roda getTop3Options (genetics.ts) no servidor para 1..N fêmeas.
 * Sessão demo (cookie): computa sobre DEMO_FEMALES + catálogo, sem Supabase.
 * Retorna { [animalId]: MatchOption[] }.
 */
export async function POST(request: NextRequest) {
  const { farmId, femaleAnimalIds, bullCodes, weights, maxInb, a2a2Only, useRel } =
    await request.json();

  if (!farmId || !Array.isArray(femaleAnimalIds) || femaleAnimalIds.length === 0 || !weights) {
    return NextResponse.json({ error: 'farmId, femaleAnimalIds[] e weights obrigatórios' }, { status: 400 });
  }

  const { allBulls, females, error } = await getCalcContext(farmId, femaleAnimalIds);
  if (error) return error;

  const bulls = Array.isArray(bullCodes) && bullCodes.length > 0
    ? allBulls.filter(b => bullCodes.includes(b.code))
    : allBulls;

  const result: Record<string, unknown> = {};
  for (const female of females) {
    result[female.id] = getTop3Options(
      female,
      bulls,
      weights as WeightMap,
      maxInb ?? 8.5,
      a2a2Only ?? false,
      useRel ?? true
    );
  }

  return NextResponse.json(result);
}
