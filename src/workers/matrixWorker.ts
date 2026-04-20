import { scoreBull, inb, getCarrierHaplotypes } from '../lib/genetics';
import type { Bull, Female, WeightMap } from '../lib/genetics';

interface WorkerInput {
  type: 'start';
  females: Female[];
  bulls: Bull[];
  weights: WeightMap;
  maxInb: number;
  minScore: number;
  a2a2Only: boolean;
  tankOnly: boolean;
  tankCodes: string[];
  useRel: boolean;
}

export interface MatrixPair {
  femaleId: string;
  bullCode: string;
  bullName: string;
  score: number;
  inbreeding: number;
  gtpi: number | null;
  net_merit: number | null;
  milk: number | null;
  gfi: number | null;
  beta_casein: string | null;
  hhCarriers: string[];
  catalog: string | null;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  if (e.data.type !== 'start') return;

  const { females, bulls, weights, maxInb, minScore, a2a2Only, tankOnly, tankCodes, useRel } = e.data;
  const tankSet = new Set(tankCodes);

  // Pre-filter bulls
  const eligibleBulls = bulls.filter(b => {
    if (a2a2Only && b.beta_casein !== 'A2A2') return false;
    if (tankOnly && !tankSet.has(b.code)) return false;
    return true;
  });

  const total = females.length * eligibleBulls.length;
  const results: MatrixPair[] = [];
  let count = 0;
  const BATCH = 10000;

  for (let fi = 0; fi < females.length; fi++) {
    const female = females[fi];

    for (let bi = 0; bi < eligibleBulls.length; bi++) {
      const bull = eligibleBulls[bi];
      count++;

      const inbreeding = inb(female, bull);
      if (inbreeding > maxInb) continue;

      const score = scoreBull(bull, weights, useRel);
      if (score < minScore) continue;

      results.push({
        femaleId: female.id,
        bullCode: bull.code,
        bullName: bull.name ?? bull.code,
        score,
        inbreeding,
        gtpi: bull.gtpi ?? null,
        net_merit: bull.net_merit ?? null,
        milk: bull.milk ?? null,
        gfi: bull.gfi ?? null,
        beta_casein: bull.beta_casein ?? null,
        hhCarriers: getCarrierHaplotypes(bull),
        catalog: (bull.catalog as string | null) ?? null,
      });

      if (count % BATCH === 0) {
        self.postMessage({ type: 'progress', count, total });
      }
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  self.postMessage({ type: 'done', results, total: count });
};
