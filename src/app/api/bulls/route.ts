import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/supabase-server';

/**
 * GET /api/bulls?farmId=<uuid>
 * Touros CUSTOM da fazenda (is_custom = true), paginados como no hook antigo.
 * O catálogo estático (CATALOG_BULLS) continua no client — aqui só vai o que
 * vive no banco.
 */
export async function GET(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const farmId = request.nextUrl.searchParams.get('farmId');
  if (!farmId) return NextResponse.json({ error: 'farmId obrigatório' }, { status: 400 });

  const PAGE = 1000;
  let allRows: unknown[] = [];
  let from = 0;
  while (true) {
    const { data, error: qError } = await supabase
      .from('bulls')
      .select('*')
      .eq('farm_id', farmId)
      .eq('is_custom', true)
      .range(from, from + PAGE - 1);
    if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
    if (!data?.length) break;
    allRows = [...allRows, ...data];
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return NextResponse.json(allRows);
}

/** POST /api/bulls — body { farmId, bull } — addCustomBull (insert is_custom). */
export async function POST(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, bull } = await request.json();
  if (!farmId || !bull) return NextResponse.json({ error: 'farmId e bull obrigatórios' }, { status: 400 });

  const { error: qError } = await supabase
    .from('bulls')
    .insert({ ...bull, farm_id: farmId, is_custom: true });

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** PUT /api/bulls — body { farmId, bull } — upsertBull (onConflict farm_id,code). */
export async function PUT(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, bull } = await request.json();
  if (!farmId || !bull?.code) return NextResponse.json({ error: 'farmId e bull.code obrigatórios' }, { status: 400 });

  const { error: qError } = await supabase
    .from('bulls')
    .upsert({ ...bull, farm_id: farmId, is_custom: true }, { onConflict: 'farm_id,code' });

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** PATCH /api/bulls — body { code, price } — updateBullPrice (mesma query antiga, escopo via RLS). */
export async function PATCH(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { code, price } = await request.json();
  if (!code) return NextResponse.json({ error: 'code obrigatório' }, { status: 400 });

  const { error: qError } = await supabase
    .from('bulls')
    .update({ price_per_dose: price })
    .eq('code', code);

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
