import { useEffect, useState, useCallback } from 'react';
import { supabase, FemaleRow } from '../lib/supabase';
import { BASE_FEMALES } from '../lib/data';
import type { Female } from '../lib/genetics';

export function rowToFemale(r: FemaleRow): Female {
  return {
    id: r.animal_id,
    breed: r.breed,
    lact: r.lact,
    ginb: r.ginb ?? undefined,
    net_merit: r.net_merit ?? undefined,
    milk: r.milk ?? undefined,
    productive_life: r.productive_life ?? undefined,
    dpr: r.dpr ?? undefined,
    fertility_index: r.fertility_index ?? undefined,
    udc: r.udc ?? undefined,
    flc: r.flc ?? undefined,
    scs: r.scs ?? undefined,
    sire_naab: r.sire_naab ?? undefined,
    mgs_naab: r.mgs_naab ?? undefined,
    mmgs_naab: r.mmgs_naab ?? undefined,
    age: r.age ?? undefined,
    // v2 extras stored as metadata
  };
}

export function useFemales(farmId: string | null | undefined) {
  const [females, setFemales] = useState<Female[]>(BASE_FEMALES as Female[]);
  const [femaleRows, setFemaleRows] = useState<FemaleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    const { data } = await supabase.from('females').select('*').eq('farm_id', farmId).order('animal_id');
    if (data && data.length > 0) {
      setFemaleRows(data);
      setFemales(data.map(rowToFemale));
    }
    setLoading(false);
  }, [farmId]);

  useEffect(() => { reload(); }, [reload]);

  async function upsertFemale(farmId: string, female: Partial<FemaleRow> & { animal_id: string }) {
    const { error } = await supabase
      .from('females')
      .upsert({ ...female, farm_id: farmId }, { onConflict: 'farm_id,animal_id' });
    if (!error) reload();
    return error;
  }

  async function setPrimiparous(dbId: string, value: boolean) {
    const { error } = await supabase.from('females').update({ is_primiparous: value }).eq('id', dbId);
    if (!error) reload();
    return error;
  }

  async function deleteFemale(dbId: string) {
    const { error } = await supabase.from('females').delete().eq('id', dbId);
    if (!error) reload();
    return error;
  }

  return { females, femaleRows, loading, reload, upsertFemale, setPrimiparous, deleteFemale };
}
