import { NextRequest, NextResponse } from 'next/server';
import { getCalcContext } from '../../../../lib/calc-data-server';
import { searchByGoal } from '../../../../lib/matching';
import type { MetaGoals } from '../../../../lib/genetics';

/**
 * POST /api/calc/meta-search
 * body { farmId, goals, bullCodes?: string[] | null }
 * Roda searchByGoal (genetics.ts) no servidor sobre todas as fêmeas da
 * fazenda (ou DEMO_FEMALES na sessão demo). Retorna MetaResult[] (top 10).
 */
export async function POST(request: NextRequest) {
  const { farmId, goals, bullCodes } = await request.json();

  if (!farmId || !goals) {
    return NextResponse.json({ error: 'farmId e goals obrigatórios' }, { status: 400 });
  }

  const { allBulls, females, error } = await getCalcContext(farmId);
  if (error) return error;

  const bulls = Array.isArray(bullCodes) && bullCodes.length > 0
    ? allBulls.filter(b => bullCodes.includes(b.code))
    : allBulls;

  const results = searchByGoal(females, bulls, goals as MetaGoals);
  return NextResponse.json(results);
}
