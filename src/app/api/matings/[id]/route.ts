import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/supabase-server';

/** PATCH /api/matings/[id] — body { status } — atualiza status do acasalamento. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const { status } = await request.json();
  if (!status) return NextResponse.json({ error: 'status obrigatório' }, { status: 400 });

  const { error: qError } = await supabase.from('matings').update({ status }).eq('id', id);
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/matings/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const { error: qError } = await supabase.from('matings').delete().eq('id', id);
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
