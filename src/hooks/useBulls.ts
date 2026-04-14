import { useEffect, useState, useCallback } from 'react';
import { supabase, BullRow } from '../lib/supabase';
import { BASE_BULLS } from '../lib/data';
import type { Bull } from '../lib/genetics';

/** Maps a DB BullRow → genetics.ts Bull shape */
function rowToBull(r: BullRow): Bull {
  return {
    code: r.code,
    name: r.short_name ?? r.code,
    short_name: r.short_name ?? undefined,
    full_name: r.full_name ?? undefined,
    gtpi: r.gtpi,
    net_merit: r.net_merit,
    milk: r.milk,
    protein: r.protein,
    fat: r.fat,
    productive_life: r.productive_life,
    scs: r.scs,
    dpr: r.dpr,
    hcr: r.hcr,
    ccr: r.ccr,
    fertility_index: r.fertility_index,
    ptat: r.ptat,
    udc: r.udc,
    flc: r.flc,
    feed_saved: r.feed_saved,
    gfi: r.gfi,
    cow_livability: r.cow_livability,
    sire_calving_ease: r.sire_calving_ease,
    beta_casein: r.beta_casein,
    kappa_casein: r.kappa_casein,
    HH1: r.hh1,
    HH2: r.hh2,
    HH3: r.hh3,
    HH4: r.hh4,
    HH5: r.hh5,
    HH6: r.hh6,
    reliability: r.reliability,
    price_per_dose: r.price_per_dose,
    _custom: r.is_custom,
  };
}

export function useBulls(farmId: string | null | undefined) {
  const [bulls, setBulls] = useState<Bull[]>(BASE_BULLS as Bull[]);
  const [bullRows, setBullRows] = useState<BullRow[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    // Load custom bulls for this farm from Supabase
    const { data } = await supabase
      .from('bulls')
      .select('*')
      .eq('farm_id', farmId)
      .eq('is_custom', true);

    const custom: Bull[] = (data ?? []).map(rowToBull);
    setBullRows(data ?? []);
    setBulls([...(BASE_BULLS as Bull[]), ...custom]);
    setLoading(false);
  }, [farmId]);

  useEffect(() => { reload(); }, [reload]);

  async function addCustomBull(farmId: string, bull: Omit<BullRow, 'id' | 'created_at' | 'farm_id'>) {
    const { error } = await supabase.from('bulls').insert({ ...bull, farm_id: farmId, is_custom: true });
    if (!error) reload();
    return error;
  }

  async function updateBullPrice(code: string, price: number) {
    const { error } = await supabase.from('bulls').update({ price_per_dose: price }).eq('code', code);
    if (!error) reload();
    return error;
  }

  return { bulls, bullRows, loading, reload, addCustomBull, updateBullPrice };
}
