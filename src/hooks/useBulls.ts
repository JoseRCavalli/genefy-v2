import { useEffect, useState, useCallback } from 'react';
import { supabase, BullRow } from '../lib/supabase';
import { CATALOG_BULLS } from '../lib/catalog-bulls';
import { getBrandFromCode } from '../lib/naab-brands';
import type { Bull } from '../lib/genetics';

const ALL_BASE_BULLS: Bull[] = CATALOG_BULLS;

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
    // Include ALL_BASE_BULLS in bullRows with code as pseudo-ID so catalog bulls can be added to tank
    const basePseudoRows: BullRow[] = ALL_BASE_BULLS
      .filter(b => !allRows.some(r => r.code === b.code))
      .map(b => ({
        id: b.code,
        farm_id: null,
        code: b.code,
        short_name: b.name ?? b.short_name ?? null,
        full_name: b.full_name ?? null,
        gtpi: b.gtpi ?? null,
        net_merit: b.net_merit ?? null,
        milk: b.milk ?? null,
        protein: b.protein ?? null,
        fat: b.fat ?? null,
        productive_life: b.productive_life ?? null,
        scs: b.scs ?? null,
        dpr: b.dpr ?? null,
        hcr: b.hcr ?? null,
        ccr: b.ccr ?? null,
        fertility_index: b.fertility_index ?? null,
        ptat: b.ptat ?? null,
        udc: b.udc ?? null,
        flc: b.flc ?? null,
        feed_saved: b.feed_saved ?? null,
        gfi: b.gfi ?? null,
        cow_livability: b.cow_livability ?? null,
        sire_calving_ease: b.sire_calving_ease ?? null,
        beta_casein: b.beta_casein ?? null,
        kappa_casein: b.kappa_casein ?? null,
        hh1: (b.HH1 as string) || 'Free',
        hh2: (b.HH2 as string) || 'Free',
        hh3: (b.HH3 as string) || 'Free',
        hh4: (b.HH4 as string) || 'Free',
        hh5: (b.HH5 as string) || 'Free',
        hh6: (b.HH6 as string) || 'Free',
        reliability: b.reliability ?? null,
        price_per_dose: b.price_per_dose ?? null,
        catalog: (b as { catalog?: string | null }).catalog ?? getBrandFromCode(b.code),
        is_custom: false,
        source: 'CDCB',
        created_at: new Date().toISOString(),
      }));
    setBullRows([...basePseudoRows, ...allRows]);
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
