import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/supabase-server';

/** GET /api/weights?farmId=<uuid> — presets de pesos da fazenda. */
export async function GET(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const farmId = request.nextUrl.searchParams.get('farmId');
  if (!farmId) return NextResponse.json({ error: 'farmId obrigatório' }, { status: 400 });

  const { data, error: qError } = await supabase
    .from('weight_presets')
    .select('*')
    .eq('farm_id', farmId);

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** PUT /api/weights — body { farmId, name, weights } — upsert (farm_id, name). */
export async function PUT(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, name, weights } = await request.json();
  if (!farmId || !name || !weights) {
    return NextResponse.json({ error: 'farmId, name e weights obrigatórios' }, { status: 400 });
  }

  const { error: qError } = await supabase
    .from('weight_presets')
    .upsert({ farm_id: farmId, name, weights }, { onConflict: 'farm_id,name' });

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
