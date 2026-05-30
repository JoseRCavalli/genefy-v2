// Re-exports from genetics.ts + any v2-specific helpers

export {
  scoreBull,
  inb,
  progenyProfile,
  getTop3Options,
  runMatingPlan,
  searchByGoal,
  estimateCowPtas,
  calcCowRel,
  calculateFemaleMeritScore,
  ICFG,
  BREED_SD,
  PRESETS,
} from './genetics';


export type {
  Bull,
  Female,
  WeightMap,
  ProgenyIndex,
  MatchResult,
  PlanResult,
  MetaGoals,
  MetaResult,
} from './genetics';

export {
  inbClass,
  getCarrierHaplotypes,
  normCdf,
  fmtPppv,
  calcPppv,
  norm,
  relFactor,
  estimateGinb,
  fmt,
  plain,
  scsColor,
  gfiColor,
  relColor,
  scoreClass,
  pppvClass,
  monthsToBreeding,
} from './genetics';
