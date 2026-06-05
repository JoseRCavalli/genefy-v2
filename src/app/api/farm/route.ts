import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/supabase-server';
import { isDemoRequest, DEMO_FARM_ROW } from '../../../lib/demo-server';

/**
 * GET /api/farm[?id=<uuid>]
 * Mesma semântica do useFarm antigo: tenta a farm do id informado (se visível
 * pelo RLS); senão, a primeira farm visível. Escopo 100% via RLS.
 * Sessão demo (cookie): Fazenda Teste fixa, sem tocar no Supabase.
 */
export async function GET(request: NextRequest) {
  if (await isDemoRequest()) {
    return NextResponse.json(DEMO_FARM_ROW);
  }

  const { supabase, error } = await requireUser();
  if (error) return error;

  const id = request.nextUrl.searchParams.get('id');

  if (id) {
    const { data } = await supabase.from('farms').select('*').eq('id', id).maybeSingle();
    if (data) return NextResponse.json(data);
  }

  const { data } = await supabase.from('farms').select('*').limit(1).maybeSingle();
  return NextResponse.json(data ?? null);
}
