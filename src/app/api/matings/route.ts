import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/supabase-server';
import { ensureBullInDb } from '../../../lib/ensure-bull-server';

/** GET /api/matings?farmId=<uuid> — histórico com joins (limit 200, mais recentes). */
export async function GET(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const farmId = request.nextUrl.searchParams.get('farmId');
  if (!farmId) return NextResponse.json({ error: 'farmId obrigatório' }, { status: 400 });

  const { data, error: qError } = await supabase
    .from('matings')
    .select('*, females(*), bulls(*)')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

interface MatingInput {
  female_id: string;
  bull: string; // uuid OU code do catálogo — resolvido no servidor
  option_rank: number;
  score: number | null;
  inbreeding_pct: number | null;
  is_sexed_semen?: boolean;
  status?: string;
}

/**
 * POST /api/matings — body { farmId, matings: MatingInput[] }
 * Aceita 1..N acasalamentos (o saveAll do plano vira uma única request).
 * Resolução touro code->uuid roda no servidor.
 */
export async function POST(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, matings } = await request.json();
  if (!farmId || !Array.isArray(matings) || matings.length === 0) {
    return NextResponse.json({ error: 'farmId e matings[] obrigatórios' }, { status: 400 });
  }

  let saved = 0;
  let firstError: string | null = null;

  for (const m of matings as MatingInput[]) {
    const bullId = await ensureBullInDb(supabase, m.bull);
    if (!bullId) {
      firstError ??= `Touro não encontrado: ${m.bull}`;
      continue;
    }

    const { error: qError } = await supabase.from('matings').insert({
      farm_id: farmId,
      female_id: m.female_id,
      bull_id: bullId,
      option_rank: m.option_rank,
      score: m.score,
      inbreeding_pct: m.inbreeding_pct,
      ...(m.is_sexed_semen !== undefined ? { is_sexed_semen: m.is_sexed_semen } : {}),
      status: m.status ?? 'planned',
    });

    if (qError) firstError ??= qError.message;
    else saved++;
  }

  return NextResponse.json({ saved, error: firstError });
}
