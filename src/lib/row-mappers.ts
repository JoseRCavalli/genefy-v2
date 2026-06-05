/**
 * Conversões row (banco) -> domínio (genetics.ts) — módulo AGNÓSTICO de
 * framework, importável tanto pelos hooks (client) quanto pelos Route
 * Handlers (server). Extraído de useFemales.ts/useBulls.ts na Fase 2.
 */
import type { FemaleRow, BullRow } from './supabase';
import type { Female, Bull } from './genetics';
import { getBrandFromCode } from './naab-brands';

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

export function rowToBull(r: BullRow): Bull {
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
