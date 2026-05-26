import type { Female, Bull } from '../lib/matching';
import { inb } from '../lib/matching';
import type { PerfilProgenieProps } from '../types/PerfilProgenie.types';

// Helper: average of two nullable numbers
const avg = (a: number | null | undefined, b: number | null | undefined): number | undefined => {
  if (a != null && b != null) return (a + b) / 2;
  return a ?? b ?? undefined;
};

export function calcularIndicesProgenie(female: Female, bull: Bull): PerfilProgenieProps {
  const f = female as Record<string, unknown>;
  const b = bull as Record<string, unknown>;

  return {
    touro: {
      codigo: bull.code,
      nome: bull.name ?? bull.short_name ?? bull.code,
      naab: bull.code,
      pedigree: `${bull.name ?? '—'}`,
    },
    indices: {
      tpi: avg(f.tpi as number, b.gtpi as number),
      netMerit: avg(f.net_merit as number, b.net_merit as number),
      cheeseMerit: avg(f.cheese_merit as number, b.cheese_merit as number),
      milk: avg(f.milk as number, b.milk as number),
      fat: avg(f.fat as number, b.fat as number),
      fatPercent: avg(f.fat_pct as number, b.fat_pct as number),
      protein: avg(f.protein as number, b.protein as number),
      proteinPercent: avg(f.protein_pct as number, b.protein_pct as number),
      productiveLife: avg(f.productive_life as number, b.productive_life as number),
      feedEfficiency: avg(f.feed_efficiency as number, b.feed_saved as number),
      somaticCellScore: avg(f.scs as number, b.scs as number),
      dpr: avg(f.dpr as number, b.dpr as number),
      hcr: avg(f.hcr as number, b.hcr as number),
      ccr: avg(f.ccr as number, b.ccr as number),
      fertilityIndex: avg(f.fertility_index as number, b.fertility_index as number),
      healthIndex: f.health_index as number | undefined,
      livability: avg(f.livability as number, b.cow_livability as number),
      heiferLivability: f.heifer_livability as number | undefined,
      earlyFirstCalving: f.early_first_calving as number | undefined,
      mastitisResistance: f.mastitis as number | undefined,
      sireCalvingEase: avg(f.sire_calving_ease as number, b.sire_calving_ease as number),
      sireStillbirth: avg(f.sire_stillbirth as number, b.sire_stillbirth as number),
      ptat: avg(f.ptat as number, b.ptat as number),
      udc: avg(f.udc as number, b.udc as number),
      flc: avg(f.flc as number, b.flc as number),
      bde: f.bde as number | undefined,
      dfm: f.dfm as number | undefined,
      sta: f.sta as number | undefined,
      str: f.str_val as number | undefined,
      rpa: f.rpa as number | undefined,
      ruw: f.ruw as number | undefined,
      fls: f.fls as number | undefined,
      rls: f.rls as number | undefined,
      fta: f.fta as number | undefined,
      fua: f.fua as number | undefined,
      ruh: f.ruh as number | undefined,
      ucl: f.ucl as number | undefined,
      udp: f.udp as number | undefined,
      tlg: f.tlg as number | undefined,
      trw: f.trw as number | undefined,
      rlr: f.rlr as number | undefined,
      gInb: f.ginb as number | undefined,
      futureInbreeding: inb(female, bull),
    },
    pedigree: {
      sireNome: f.sire_name as string | undefined,
      sireNaab: f.sire_naab as string | undefined,
      mgsNome: f.mgs_name as string | undefined,
      mgsNaab: f.mgs_naab as string | undefined,
      damId: f.dam_animal_id as string | undefined,
    },
  };
}
