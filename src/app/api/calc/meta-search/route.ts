import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/supabase-server';
import { loadMergedBulls, loadFemales } from '../../../../lib/calc-data-server';
import { searchByGoal } from '../../../../lib/matching';
import type { MetaGoals } from '../../../../lib/genetics';

/**
 * POST /api/calc/meta-search
 * body { farmId, goals, bullCodes?: string[] | null }
 * Roda searchByGoal (genetics.ts) no servidor sobre todas as fêmeas da
 * fazenda. Retorna MetaResult[] (top 10, como na UI).
 */
export async function POST(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, goals, bullCodes } = await request.json();

  if (!farmId || !goals) {
    return NextResponse.json({ error: 'farmId e goals obrigatórios' }, { status: 400 });
  }

  const [allBulls, females] = await Promise.all([
    loadMergedBulls(supabase, farmId),
    loadFemales(supabase, farmId),
  ]);

  const bulls = Array.isArray(bullCodes) && bullCodes.length > 0
    ? allBulls.filter(b => bullCodes.includes(b.code))
    : allBulls;

  const results = searchByGoal(females, bulls, goals as MetaGoals);
  return NextResponse.json(results);
}
