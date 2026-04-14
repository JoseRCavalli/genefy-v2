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
    const { error } = await supabase
      .from('tank_bulls')
      .upsert({ farm_id: farmId, bull_id: bullDbId, doses: doses ?? null, price_per_dose: price ?? null },
        { onConflict: 'farm_id,bull_id' });
    if (!error) reload();
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
