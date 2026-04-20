import { useEffect, useState, useCallback } from 'react';
import { supabase, BullRow } from '../lib/supabase';
import { BASE_BULLS } from '../lib/data';
import { CATALOG_BULLS } from '../lib/catalog-bulls';
import { getBrandFromCode } from '../lib/naab-brands';
import type { Bull } from '../lib/genetics';

const ALL_BASE_BULLS: Bull[] = [
  ...(BASE_BULLS as Bull[]).map(b => ({
    ...b,
    catalog: b.catalog ?? getBrandFromCode(b.code),
  })),
  ...CATALOG_BULLS,
];

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
    catalog: r.catalog ?? getBrandFromCode(r.code),
    _custom: r.is_custom,
  };
}

export function useBulls(farmId: string | null | undefined) {
  const [bulls, setBulls] = useState<Bull[]>(ALL_BASE_BULLS);
  const [bullRows, setBullRows] = useState<BullRow[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);

    // Paginate custom bulls (handles farms with many custom entries)
    const PAGE = 1000;
    let allRows: BullRow[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('bulls')
        .select('*')
        .eq('farm_id', farmId)
        .eq('is_custom', true)
        .range(from, from + PAGE - 1);
      if (error || !data?.length) break;
      allRows = [...allRows, ...data];
      if (data.length < PAGE) break;
      from += PAGE;
    }

    const custom: Bull[] = allRows.map(rowToBull);
    setBullRows(allRows);
    setBulls([...ALL_BASE_BULLS, ...custom]);
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
