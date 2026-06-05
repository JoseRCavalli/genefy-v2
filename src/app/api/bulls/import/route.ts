import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/supabase-server';

const BATCH = 50;

/**
 * POST /api/bulls/import — body { farmId, bulls: Partial<BullRow>[] }
 * Importação em lote (Select Sires): upsert por (farm_id, code) com fallback
 * individual, replicando o comportamento do SelectSiresImportModal.
 */
export async function POST(request: NextRequest) {
  const { supabase, error } = await requireUser();
  if (error) return error;

  const { farmId, bulls } = await request.json();
  if (!farmId || !Array.isArray(bulls)) {
    return NextResponse.json({ error: 'farmId e bulls[] obrigatórios' }, { status: 400 });
  }

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < bulls.length; i += BATCH) {
    const batch = bulls.slice(i, i + BATCH).map((bull: Record<string, unknown>) => ({
      ...bull,
      farm_id: farmId,
    }));

    const { error: batchError } = await supabase
      .from('bulls')
      .upsert(batch, { onConflict: 'farm_id,code' });

    if (batchError) {
      // Fallback: tenta individualmente
      for (const row of batch) {
        const { error: e2 } = await supabase.from('bulls').upsert(row, { onConflict: 'farm_id,code' });
        if (e2) errors++;
        else inserted++;
      }
    } else {
      inserted += batch.length;
    }
  }

  return NextResponse.json({ inserted, errors });
}
