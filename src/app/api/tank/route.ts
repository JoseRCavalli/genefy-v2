import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/supabase-server';
import { ensureBullInDb } from '../../../lib/ensure-bull-server';

/** GET /api/tank?farmId=<uuid> — entradas do botijão com join em bulls. */
export async function GET(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const farmId = request.nextUrl.searchParams.get('farmId');
  if (!farmId) return NextResponse.json({ error: 'farmId obrigatório' }, { status: 400 });

  const { data, error: qError } = await supabase
    .from('tank_bulls')
    .select('*, bulls(*)')
    .eq('farm_id', farmId);

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/**
 * POST /api/tank — body { farmId, bullDbId, doses?, price? }
 * bullDbId pode ser UUID (touro do banco) ou code (catálogo estático);
 * o servidor resolve via ensureBullInDb e faz upsert (farm_id, bull_id).
 */
export async function POST(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, bullDbId, doses, price } = await request.json();
  if (!farmId || !bullDbId) {
    return NextResponse.json({ error: 'farmId e bullDbId obrigatórios' }, { status: 400 });
  }

  const realBullId = await ensureBullInDb(supabase, bullDbId);
  if (!realBullId) {
    return NextResponse.json({ error: 'Touro não encontrado no banco de dados.' }, { status: 404 });
  }

  const { error: qError } = await supabase
    .from('tank_bulls')
    .upsert(
      { farm_id: farmId, bull_id: realBullId, doses: doses ?? null, price_per_dose: price ?? null },
      { onConflict: 'farm_id,bull_id' }
    );

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
