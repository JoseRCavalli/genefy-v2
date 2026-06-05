import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/supabase-server';

/**
 * GET /api/matings/failed-counts?farmId=<uuid>
 * Contagem de acasalamentos com status 'failed' por fêmea (usado pelo
 * useHerdStrategy para a ordem de inseminação).
 */
export async function GET(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const farmId = request.nextUrl.searchParams.get('farmId');
  if (!farmId) return NextResponse.json({ error: 'farmId obrigatório' }, { status: 400 });

  const { data, error: qError } = await supabase
    .from('matings')
    .select('female_id, status')
    .eq('farm_id', farmId)
    .eq('status', 'failed');

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });

  const counts: Record<string, number> = {};
  (data ?? []).forEach((m: { female_id: string | null }) => {
    if (m.female_id) counts[m.female_id] = (counts[m.female_id] || 0) + 1;
  });

  return NextResponse.json(counts);
}
