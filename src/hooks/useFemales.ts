import { useEffect, useState, useCallback } from 'react';
import { supabase, FemaleRow } from '../lib/supabase';
import { BASE_FEMALES } from '../lib/data';
import type { Female } from '../lib/genetics';

export function rowToFemale(r: FemaleRow): Female {
  return {
    id: r.animal_id,
    reg_id: r.reg_id ?? undefined,
    breed: r.breed,
    lact: r.lact,
    ginb: r.ginb ?? undefined,
    // Mérito econômico
    net_merit: r.net_merit ?? undefined,
    tpi: r.tpi ?? undefined,
    cheese_merit: r.cheese_merit ?? undefined,
    fluid_merit: r.fluid_merit ?? undefined,
    // Produção
    milk: r.milk ?? undefined,
    protein: r.protein ?? undefined,
    fat: r.fat ?? undefined,
    fat_pct: r.fat_pct ?? undefined,
    protein_pct: r.protein_pct ?? undefined,
    productive_life: r.productive_life ?? undefined,
    feed_efficiency: r.feed_efficiency ?? undefined,
    // Fertilidade
    dpr: r.dpr ?? undefined,
    hcr: r.hcr ?? undefined,
    ccr: r.ccr ?? undefined,
    fertility_index: r.fertility_index ?? undefined,
    early_first_calving: r.early_first_calving ?? undefined,
    // Saúde
    scs: r.scs ?? undefined,
    health_index: r.health_index ?? undefined,
    mastitis: r.mastitis ?? undefined,
    livability: r.livability ?? undefined,
    heifer_livability: r.heifer_livability ?? undefined,
    // Parto
    sire_calving_ease: r.sire_calving_ease ?? undefined,
    daughter_calving_ease: r.daughter_calving_ease ?? undefined,
    sire_stillbirth: r.sire_stillbirth ?? undefined,
    daughter_stillbirth: r.daughter_stillbirth ?? undefined,
    // Compostos de conformação
    ptat: r.ptat ?? undefined,
    udc: r.udc ?? undefined,
    flc: r.flc ?? undefined,
    bde: r.bde ?? undefined,
    dfm: r.dfm ?? undefined,
    // Traits individuais
    sta: r.sta ?? undefined,
    str_val: r.str_val ?? undefined,
    fls: r.fls ?? undefined,
    fta: r.fta ?? undefined,
    ftp: r.ftp ?? undefined,
    fua: r.fua ?? undefined,
    rlr: r.rlr ?? undefined,
    rls: r.rls ?? undefined,
    rpa: r.rpa ?? undefined,
    rtp: r.rtp ?? undefined,
    ruh: r.ruh ?? undefined,
    ruw: r.ruw ?? undefined,
    tlg: r.tlg ?? undefined,
    trw: r.trw ?? undefined,
    ucl: r.ucl ?? undefined,
    udp: r.udp ?? undefined,
    // Pedigree
    sire_naab: r.sire_naab ?? undefined,
    sire_name: r.sire_name ?? undefined,
    sire_reg: r.sire_reg ?? undefined,
    mgs_naab: r.mgs_naab ?? undefined,
    mgs_name: r.mgs_name ?? undefined,
    mmgs_naab: r.mmgs_naab ?? undefined,
    dam_reg: r.dam_reg ?? undefined,
    dam_animal_id: r.dam_animal_id ?? undefined,
    // Caseínas
    beta_casein: r.beta_casein ?? undefined,
    kappa_casein: r.kappa_casein ?? undefined,
    // Metadata
    bdate: r.bdate ?? undefined,
    age: r.age ?? undefined,
    is_primiparous: r.is_primiparous,
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
