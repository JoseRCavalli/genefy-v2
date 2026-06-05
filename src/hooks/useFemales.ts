import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, FemaleRow } from '../lib/supabase';
import { BASE_FEMALES } from '../lib/data';
import type { Female } from '../lib/genetics';
import { useAuth } from '../contexts/AuthContext';

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
    categories: r.categories ?? [],
    notes: r.notes ?? '',
  };
}

export function mapBaseFemalesToRows(farmId: string): FemaleRow[] {
  return (BASE_FEMALES as Female[]).map((b, i) => ({
    id: `female-${i}`,
    farm_id: farmId,
    animal_id: b.id,
    reg_id: b.reg_id ?? null,
    name: null,
    breed: b.breed ?? 'HO',
    lact: b.lact ?? 0,
    ginb: b.ginb ?? null,
    net_merit: b.net_merit ?? null,
    tpi: b.tpi ?? null,
    milk: b.milk ?? null,
    protein: b.protein ?? null,
    fat: b.fat ?? null,
    fat_pct: b.fat_pct ?? null,
    protein_pct: b.protein_pct ?? null,
    productive_life: b.productive_life ?? null,
    dpr: b.dpr ?? null,
    hcr: b.hcr ?? null,
    ccr: b.ccr ?? null,
    fertility_index: b.fertility_index ?? null,
    udc: b.udc ?? null,
    flc: b.flc ?? null,
    scs: b.scs ?? null,
    cheese_merit: b.cheese_merit ?? null,
    fluid_merit: b.fluid_merit ?? null,
    feed_efficiency: b.feed_efficiency ?? null,
    health_index: b.health_index ?? null,
    mastitis: b.mastitis ?? null,
    livability: b.livability ?? null,
    heifer_livability: b.heifer_livability ?? null,
    early_first_calving: b.early_first_calving ?? null,
    sire_calving_ease: b.sire_calving_ease ?? null,
    daughter_calving_ease: b.daughter_calving_ease ?? null,
    sire_stillbirth: b.sire_stillbirth ?? null,
    daughter_stillbirth: b.daughter_stillbirth ?? null,
    ptat: b.ptat ?? null,
    bde: b.bde ?? null,
    dfm: b.dfm ?? null,
    sta: b.sta ?? null,
    str_val: b.str_val ?? null,
    fls: b.fls ?? null,
    fta: b.fta ?? null,
    ftp: b.ftp ?? null,
    fua: b.fua ?? null,
    rlr: null,
    rls: null,
    rpa: null,
    rtp: null,
    ruh: null,
    ruw: null,
    tlg: null,
    trw: null,
    ucl: null,
    udp: null,
    sire_naab: b.sire_naab ?? null,
    sire_name: b.sire_name ?? null,
    sire_reg: b.sire_reg ?? null,
    mgs_naab: b.mgs_naab ?? null,
    mgs_name: b.mgs_name ?? null,
    mmgs_naab: b.mmgs_naab ?? null,
    dam_id: b.dam_id ?? null,
    dam_reg: b.dam_reg ?? null,
    dam_animal_id: b.dam_animal_id ?? null,
    bdate: b.bdate ?? null,
    genomic: b.genomic ?? false,
    age: b.age ?? null,
    is_primiparous: b.is_primiparous ?? false,
    beta_casein: b.beta_casein ?? null,
    kappa_casein: b.kappa_casein ?? null,
    notes: b.notes ?? null,
    categories: b.categories ?? [],
    created_at: new Date().toISOString(),
  } as unknown as FemaleRow));
}

export function useFemales(farmId: string | null | undefined) {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@gmail.com';

  const [females, setFemales] = useState<Female[]>(BASE_FEMALES as Female[]);
  const [femaleRows, setFemaleRows] = useState<FemaleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (isDemoUser) {
      const rows = mapBaseFemalesToRows(farmId ?? 'demo-farm-id');
      setFemaleRows(rows);
      setFemales(rows.map(rowToFemale));
      return;
    }

    if (!farmId) return;
    setLoading(true);
    const { data } = await supabase.from('females').select('*').eq('farm_id', farmId).order('animal_id');
    if (data && data.length > 0) {
      setFemaleRows(data);
      setFemales(data.map(rowToFemale));
    }
    setLoading(false);
  }, [farmId, isDemoUser]);

  useEffect(() => { reload(); }, [reload]);

  const catalogFemales = useMemo(() => {
    if (femaleRows.length === 0) {
      return BASE_FEMALES as Female[];
    }
    const custom = females;
    const merged = (BASE_FEMALES as Female[]).map(base => {
      const override = custom.find(c => c.id === base.id);
      return override ?? base;
    });
    const customOnly = custom.filter(c => !(BASE_FEMALES as Female[]).some(b => b.id === c.id));
    return [...merged, ...customOnly];
  }, [females, femaleRows]);

  const catalogFemaleRows = useMemo(() => {
    if (femaleRows.length === 0) {
      return (BASE_FEMALES as Female[]).map((b, i) => ({
        id: `female-${i}`,
        farm_id: farmId ?? '',
        animal_id: b.id,
        reg_id: b.reg_id ?? null,
        name: null,
        breed: b.breed ?? 'HO',
        lact: b.lact ?? 0,
        ginb: b.ginb ?? null,
        net_merit: b.net_merit ?? null,
        tpi: b.tpi ?? null,
        milk: b.milk ?? null,
        protein: b.protein ?? null,
        fat: b.fat ?? null,
        fat_pct: b.fat_pct ?? null,
        protein_pct: b.protein_pct ?? null,
        productive_life: b.productive_life ?? null,
        dpr: b.dpr ?? null,
        hcr: b.hcr ?? null,
        ccr: b.ccr ?? null,
        fertility_index: b.fertility_index ?? null,
        udc: b.udc ?? null,
        flc: b.flc ?? null,
        scs: b.scs ?? null,
        cheese_merit: b.cheese_merit ?? null,
        fluid_merit: b.fluid_merit ?? null,
        feed_efficiency: b.feed_efficiency ?? null,
        health_index: b.health_index ?? null,
        mastitis: b.mastitis ?? null,
        livability: b.livability ?? null,
        heifer_livability: b.heifer_livability ?? null,
        early_first_calving: b.early_first_calving ?? null,
        sire_calving_ease: b.sire_calving_ease ?? null,
        daughter_calving_ease: b.daughter_calving_ease ?? null,
        sire_stillbirth: b.sire_stillbirth ?? null,
        daughter_stillbirth: b.daughter_stillbirth ?? null,
        ptat: b.ptat ?? null,
        bde: b.bde ?? null,
        dfm: b.dfm ?? null,
        sta: b.sta ?? null,
        str_val: b.str_val ?? null,
        fls: b.fls ?? null,
        fta: b.fta ?? null,
        ftp: b.ftp ?? null,
        fua: b.fua ?? null,
        rlr: null,
        rls: null,
        rpa: null,
        rtp: null,
        ruh: null,
        ruw: null,
        tlg: null,
        trw: null,
        ucl: null,
        udp: null,
        sire_naab: b.sire_naab ?? null,
        sire_name: b.sire_name ?? null,
        sire_reg: b.sire_reg ?? null,
        mgs_naab: b.mgs_naab ?? null,
        mgs_name: b.mgs_name ?? null,
        mmgs_naab: b.mmgs_naab ?? null,
        dam_id: b.dam_id ?? null,
        dam_reg: b.dam_reg ?? null,
        dam_animal_id: b.dam_animal_id ?? null,
        bdate: b.bdate ?? null,
        genomic: b.genomic ?? false,
        age: b.age ?? null,
        is_primiparous: b.is_primiparous ?? false,
        beta_casein: b.beta_casein ?? null,
        kappa_casein: b.kappa_casein ?? null,
        notes: b.notes ?? null,
        categories: b.categories ?? [],
        created_at: new Date().toISOString(),
      } as unknown as FemaleRow));
    }
    const basePseudoRows: FemaleRow[] = (BASE_FEMALES as Female[])
      .filter(b => !femaleRows.some(r => r.animal_id === b.id))
      .map((b, i) => ({
        id: `female-${i}`,
        farm_id: farmId ?? '',
        animal_id: b.id,
        reg_id: b.reg_id ?? null,
        name: null,
        breed: b.breed ?? 'HO',
        lact: b.lact ?? 0,
        ginb: b.ginb ?? null,
        net_merit: b.net_merit ?? null,
        tpi: b.tpi ?? null,
        milk: b.milk ?? null,
        protein: b.protein ?? null,
        fat: b.fat ?? null,
        fat_pct: b.fat_pct ?? null,
        protein_pct: b.protein_pct ?? null,
        productive_life: b.productive_life ?? null,
        dpr: b.dpr ?? null,
        hcr: b.hcr ?? null,
        ccr: b.ccr ?? null,
        fertility_index: b.fertility_index ?? null,
        udc: b.udc ?? null,
        flc: b.flc ?? null,
        scs: b.scs ?? null,
        cheese_merit: b.cheese_merit ?? null,
        fluid_merit: b.fluid_merit ?? null,
        feed_efficiency: b.feed_efficiency ?? null,
        health_index: b.health_index ?? null,
        mastitis: b.mastitis ?? null,
        livability: b.livability ?? null,
        heifer_livability: b.heifer_livability ?? null,
        early_first_calving: b.early_first_calving ?? null,
        sire_calving_ease: b.sire_calving_ease ?? null,
        daughter_calving_ease: b.daughter_calving_ease ?? null,
        sire_stillbirth: b.sire_stillbirth ?? null,
        daughter_stillbirth: b.daughter_stillbirth ?? null,
        ptat: b.ptat ?? null,
        bde: b.bde ?? null,
        dfm: b.dfm ?? null,
        sta: b.sta ?? null,
        str_val: b.str_val ?? null,
        fls: b.fls ?? null,
        fta: b.fta ?? null,
        ftp: b.ftp ?? null,
        fua: b.fua ?? null,
        rlr: null,
        rls: null,
        rpa: null,
        rtp: null,
        ruh: null,
        ruw: null,
        tlg: null,
        trw: null,
        ucl: null,
        udp: null,
        sire_naab: b.sire_naab ?? null,
        sire_name: b.sire_name ?? null,
        sire_reg: b.sire_reg ?? null,
        mgs_naab: b.mgs_naab ?? null,
        mgs_name: b.mgs_name ?? null,
        mmgs_naab: b.mmgs_naab ?? null,
        dam_id: b.dam_id ?? null,
        dam_reg: b.dam_reg ?? null,
        dam_animal_id: b.dam_animal_id ?? null,
        bdate: b.bdate ?? null,
        genomic: b.genomic ?? false,
        age: b.age ?? null,
        is_primiparous: b.is_primiparous ?? false,
        beta_casein: b.beta_casein ?? null,
        kappa_casein: b.kappa_casein ?? null,
        notes: b.notes ?? null,
        categories: b.categories ?? [],
        created_at: new Date().toISOString(),
      } as unknown as FemaleRow));
    return [...basePseudoRows, ...femaleRows];
  }, [femaleRows, farmId]);

  async function upsertFemale(farmId: string, female: Partial<FemaleRow> & { animal_id: string }) {
    if (isDemoUser) {
      setFemaleRows(rows => {
        const idx = rows.findIndex(r => r.animal_id === female.animal_id);
        let updated = [...rows];
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], ...female };
        } else {
          updated.push({
            id: `female-new-${Date.now()}`,
            farm_id: farmId || 'demo-farm-id',
            categories: [],
            notes: '',
            ...female,
          } as FemaleRow);
        }
        setFemales(updated.map(rowToFemale));
        return updated;
      });
      return null;
    }

    const { error } = await supabase
      .from('females')
      .upsert({ ...female, farm_id: farmId }, { onConflict: 'farm_id,animal_id' });
    if (!error) reload();
    return error;
  }

  async function setPrimiparous(dbId: string, value: boolean) {
    if (isDemoUser) {
      setFemaleRows(rows => {
        const updated = rows.map(r => r.id === dbId ? { ...r, is_primiparous: value } : r);
        setFemales(updated.map(rowToFemale));
        return updated;
      });
      return null;
    }

    const { error } = await supabase.from('females').update({ is_primiparous: value }).eq('id', dbId);
    if (!error) reload();
    return error;
  }

  async function deleteFemale(dbId: string) {
    if (isDemoUser) {
      setFemaleRows(rows => {
        const updated = rows.filter(r => r.id !== dbId);
        setFemales(updated.map(rowToFemale));
        return updated;
      });
      return null;
    }

    const { error } = await supabase.from('females').delete().eq('id', dbId);
    if (!error) reload();
    return error;
  }

  async function updateFemaleCategories(dbId: string, categories: string[]) {
    if (isDemoUser) {
      setFemaleRows(rows => {
        const updated = rows.map(r => r.id === dbId ? { ...r, categories } : r);
        setFemales(updated.map(rowToFemale));
        return updated;
      });
      return null;
    }

    const { error } = await supabase.from('females').update({ categories }).eq('id', dbId);
    if (!error) reload();
    return error;
  }

  async function updateFemaleNotes(dbId: string, notes: string) {
    if (isDemoUser) {
      setFemaleRows(rows => {
        const updated = rows.map(r => r.id === dbId ? { ...r, notes } : r);
        setFemales(updated.map(rowToFemale));
        return updated;
      });
      return null;
    }

    const { error } = await supabase.from('females').update({ notes }).eq('id', dbId);
    if (!error) reload();
    return error;
  }

  return {
    females,
    femaleRows,
    catalogFemales,
    catalogFemaleRows,
    loading,
    reload,
    upsertFemale,
    setPrimiparous,
    deleteFemale,
    updateFemaleCategories,
    updateFemaleNotes
  };
}

