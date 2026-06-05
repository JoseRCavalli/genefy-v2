import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/supabase-server';

/** GET /api/females?farmId=<uuid> — fêmeas da fazenda (ordem animal_id), RLS via sessão. */
export async function GET(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const farmId = request.nextUrl.searchParams.get('farmId');
  if (!farmId) return NextResponse.json({ error: 'farmId obrigatório' }, { status: 400 });

  const { data, error: qError } = await supabase
    .from('females')
    .select('*')
    .eq('farm_id', farmId)
    .order('animal_id');

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** PUT /api/females — body { farmId, female } — upsert (onConflict farm_id,animal_id). */
export async function PUT(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, female } = await request.json();
  if (!farmId || !female) return NextResponse.json({ error: 'farmId e female obrigatórios' }, { status: 400 });

  const { error: qError } = await supabase
    .from('females')
    .upsert({ ...female, farm_id: farmId }, { onConflict: 'farm_id,animal_id' });

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
