import { useEffect, useState, useCallback } from 'react';
import { supabase, TankBullRow } from '../lib/supabase';
import type { Bull } from '../lib/genetics';

export interface TankEntry {
  tankId: string;
  bull: Bull;
  bullDbId: string;
  doses: number | null;
  pricePerDose: number | null;
}

/** UUID v4 regex — se o id não for UUID, é um pseudo-id (code) dos touros base */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Garante que o touro existe na tabela `bulls` e retorna seu UUID real.
 * Touros do catálogo base não estão no banco — apenas têm id = code como pseudo-id.
 * Para adicioná-los ao botijão (que exige FK para bulls.id), precisamos inserir
 * (ou recuperar) o registro no banco primeiro via upsert pelo code único.
 */
export async function ensureBullInDb(bullDbId: string, allBulls: Bull[]): Promise<string | null> {
  // Se já é UUID real, não precisa fazer nada
  if (UUID_RE.test(bullDbId)) return bullDbId;

  // bullDbId é um code (pseudo-id dos touros base)
  const code = bullDbId;

  // 1. Tenta buscar o touro já existente no banco pelo code
  const { data: existing } = await supabase
    .from('bulls')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // 2. Touro não existe no banco — insere como touro do catálogo (is_custom = false)
  const bull = allBulls.find(b => b.code === code);
  if (!bull) {
    console.error('[useTank] Touro não encontrado localmente:', code);
    return null;
  }

  // Objeto contém apenas colunas que existem na tabela bulls do Supabase
  // (sem 'catalog' — coluna não existe no schema)
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
    // Pode ter havido race condition — tenta buscar novamente
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('bulls')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      return retry?.id ?? null;
    }
    console.error('[useTank] Erro ao inserir touro no banco:', error);
    return null;
  }

  return inserted?.id ?? null;
}

export function useTank(farmId: string | null | undefined, allBulls: Bull[]) {
  const [tank, setTank] = useState<TankEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    const { data } = await supabase
      .from('tank_bulls')
      .select('*, bulls(*)')
      .eq('farm_id', farmId);

    const entries: TankEntry[] = (data ?? []).flatMap((row: TankBullRow) => {
      const code = row.bulls?.code;
      const bull = allBulls.find(b => b.code === code);
      if (!bull || !code) return [];
      return [{
        tankId: row.id,
        bull: { ...bull, price_per_dose: row.price_per_dose ?? bull.price_per_dose },
        bullDbId: row.bull_id,
        doses: row.doses,
        pricePerDose: row.price_per_dose,
      }];
    });
    setTank(entries);
    setLoading(false);
  }, [farmId, allBulls]);

  useEffect(() => { reload(); }, [reload]);

  async function addToTank(farmId: string, bullDbId: string, doses?: number, price?: number) {
    // Garante que o touro existe na tabela bulls com UUID real
    const realBullId = await ensureBullInDb(bullDbId, allBulls);
    if (!realBullId) {
      console.error('[useTank] Não foi possível resolver o UUID do touro:', bullDbId);
      return new Error('Touro não encontrado no banco de dados.');
    }

    const { error } = await supabase
      .from('tank_bulls')
      .upsert(
        { farm_id: farmId, bull_id: realBullId, doses: doses ?? null, price_per_dose: price ?? null },
        { onConflict: 'farm_id,bull_id' }
      );

    if (error) {
      console.error('[useTank] Erro ao inserir no botijão:', error);
    } else {
      reload();
    }
    return error;
  }

  async function removeFromTank(tankId: string) {
    const { error } = await supabase.from('tank_bulls').delete().eq('id', tankId);
    if (!error) reload();
    return error;
  }

  async function updateTankEntry(tankId: string, doses: number | null, price: number | null) {
    const { error } = await supabase
      .from('tank_bulls')
      .update({ doses, price_per_dose: price })
      .eq('id', tankId);
    if (!error) reload();
    return error;
  }

  const tankBulls: Bull[] = tank.map(e => e.bull);
  const tankMap = new Map<string, TankEntry>(tank.map(e => [e.bull.code, e]));

  return { tank, tankBulls, tankMap, loading, reload, addToTank, removeFromTank, updateTankEntry };
}
