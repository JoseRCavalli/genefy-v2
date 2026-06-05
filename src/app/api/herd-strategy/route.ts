import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/supabase-server';
import { DEFAULT_HERD_STRATEGY } from '../../../types/herd-strategy.types';

/**
 * GET /api/herd-strategy?farmId=<uuid>
 * Get-or-create: se a fazenda ainda não tem estratégia, insere a default
 * (mesmo comportamento do hook antigo).
 */
export async function GET(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const farmId = request.nextUrl.searchParams.get('farmId');
  if (!farmId) return NextResponse.json({ error: 'farmId obrigatório' }, { status: 400 });

  const { data, error: qError } = await supabase
    .from('herd_strategy')
    .select('*')
    .eq('farm_id', farmId)
    .maybeSingle();

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  if (data) return NextResponse.json(data);

  const newStrategy = { ...DEFAULT_HERD_STRATEGY, farm_id: farmId };
  const { error: insertError } = await supabase.from('herd_strategy').insert(newStrategy);
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json(newStrategy);
}

/** PUT /api/herd-strategy — body { farmId, strategy } — upsert com updated_at. */
export async function PUT(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, strategy } = await request.json();
  if (!farmId || !strategy) {
    return NextResponse.json({ error: 'farmId e strategy obrigatórios' }, { status: 400 });
  }

  const { error: qError } = await supabase
    .from('herd_strategy')
    .upsert({ ...strategy, farm_id: farmId, updated_at: new Date().toISOString() });

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
