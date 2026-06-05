import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/supabase-server';

/** PATCH /api/tank/[id] — body { doses, price } — atualiza doses/preço da entrada. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const { doses, price } = await request.json();

  const { error: qError } = await supabase
    .from('tank_bulls')
    .update({ doses, price_per_dose: price })
    .eq('id', id);

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/tank/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const { error: qError } = await supabase.from('tank_bulls').delete().eq('id', id);
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
