/**
 * ensureBullInDb — versão SERVER-SIDE (Route Handlers).
 *
 * Touros do catálogo estático não existem na tabela `bulls`; o botijão e os
 * acasalamentos exigem FK para bulls.id. Resolve code -> UUID real, inserindo
 * o registro do catálogo (farm_id null, is_custom false) quando necessário.
 * Mesma lógica do antigo src/hooks/useTank.ts, agora rodando com a sessão do
 * usuário (RLS) no servidor.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { CATALOG_BULLS } from './catalog-bulls';
import type { Bull } from './genetics';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function ensureBullInDb(
  supabase: SupabaseClient,
  bullDbId: string
): Promise<string | null> {
  // Já é UUID real (touro custom do banco)
  if (UUID_RE.test(bullDbId)) return bullDbId;

  const code = bullDbId;

  // 1. Touro já existente no banco pelo code
  const { data: existing } = await supabase
    .from('bulls')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // 2. Não existe — insere a partir do catálogo estático
  const bull: Bull | undefined = CATALOG_BULLS.find(b => b.code === code);
  if (!bull) {
    console.error('[ensureBullInDb] Touro não encontrado no catálogo:', code);
    return null;
  }

  const row = {
    farm_id: null as string | null,
    code: bull.code,
    short_name: bull.name ?? bull.short_name ?? null,
    full_name: bull.full_name ?? null,
    gtpi: bull.gtpi ?? null,
    net_merit: bull.net_merit ?? null,
    gfi: bull.gfi ?? null,
    reliability: bull.reliability ?? null,
    milk: bull.milk ?? null,
    protein: bull.protein ?? null,
    fat: bull.fat ?? null,
    productive_life: bull.productive_life ?? null,
    scs: bull.scs ?? null,
    dpr: bull.dpr ?? null,
    hcr: bull.hcr ?? null,
    ccr: bull.ccr ?? null,
    fertility_index: bull.fertility_index ?? null,
    ptat: bull.ptat ?? null,
    udc: bull.udc ?? null,
    flc: bull.flc ?? null,
    feed_saved: bull.feed_saved ?? null,
    cow_livability: bull.cow_livability ?? null,
    sire_calving_ease: bull.sire_calving_ease ?? null,
    beta_casein: bull.beta_casein ?? null,
    kappa_casein: bull.kappa_casein ?? null,
    hh1: (bull.HH1 as string) || 'Free',
    hh2: (bull.HH2 as string) || 'Free',
    hh3: (bull.HH3 as string) || 'Free',
    hh4: (bull.HH4 as string) || 'Free',
    hh5: (bull.HH5 as string) || 'Free',
    hh6: (bull.HH6 as string) || 'Free',
    price_per_dose: bull.price_per_dose ?? null,
    is_custom: false,
    source: 'CDCB',
  };

  const { data: inserted, error } = await supabase
    .from('bulls')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    // Race condition — tenta buscar novamente
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('bulls')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      return retry?.id ?? null;
    }
    console.error('[ensureBullInDb] Erro ao inserir touro:', error.message);
    return null;
  }

  return inserted?.id ?? null;
}
