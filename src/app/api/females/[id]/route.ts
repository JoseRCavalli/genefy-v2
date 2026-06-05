import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/supabase-server';

/** Campos editáveis via PATCH — espelha os updates pontuais do hook antigo. */
const PATCHABLE = ['is_primiparous', 'categories', 'notes'] as const;

/** PATCH /api/females/[id] — body com subset de { is_primiparous, categories, notes }. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = {};
  for (const key of PATCHABLE) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'nenhum campo editável informado' }, { status: 400 });
  }

  const { error: qError } = await supabase.from('females').update(update).eq('id', id);
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/females/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const { error: qError } = await supabase.from('females').delete().eq('id', id);
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
