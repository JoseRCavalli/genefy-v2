import { useEffect, useState, useCallback } from 'react';
import { supabase, TankBullRow } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Bull } from '../lib/genetics';

/** UUID v4 regex — se o id não for UUID, é um pseudo-id (code) dos touros base */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @deprecated TRANSITÓRIO (Fase 2): usado apenas por MatchingTab/MatingPlanTab
 * até a fatia de matings mover a resolução code->uuid para o servidor
 * (src/lib/ensure-bull-server.ts). Não usar em código novo.
 */
export async function ensureBullInDb(bullDbId: string, allBulls: Bull[]): Promise<string | null> {
  if (UUID_RE.test(bullDbId)) return bullDbId;
  const code = bullDbId;

  const { data: existing } = await supabase
    .from('bulls')
    .select('id')
    .eq('code', code)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const bull = allBulls.find(b => b.code === code);
  if (!bull) return null;

  const { data: inserted, error } = await supabase
    .from('bulls')
    .insert({
      farm_id: null,
      code: bull.code,
      short_name: bull.name ?? bull.short_name ?? null,
      full_name: bull.full_name ?? null,
      gtpi: bull.gtpi ?? null,
      net_merit: bull.net_merit ?? null,
      gfi: bull.gfi ?? null,
      reliability: bull.reliability ?? null,
      milk: bull.milk ?? null,
      protein: bull.protein ?? null,
      fat: bull.fat ?? null,
      productive_life: bull.productive_life ?? null,
      scs: bull.scs ?? null,
      dpr: bull.dpr ?? null,
      hcr: bull.hcr ?? null,
      ccr: bull.ccr ?? null,
      fertility_index: bull.fertility_index ?? null,
      ptat: bull.ptat ?? null,
      udc: bull.udc ?? null,
      flc: bull.flc ?? null,
      feed_saved: bull.feed_saved ?? null,
      cow_livability: bull.cow_livability ?? null,
      sire_calving_ease: bull.sire_calving_ease ?? null,
      beta_casein: bull.beta_casein ?? null,
      kappa_casein: bull.kappa_casein ?? null,
      hh1: (bull.HH1 as string) || 'Free',
      hh2: (bull.HH2 as string) || 'Free',
      hh3: (bull.HH3 as string) || 'Free',
      hh4: (bull.HH4 as string) || 'Free',
      hh5: (bull.HH5 as string) || 'Free',
      hh6: (bull.HH6 as string) || 'Free',
      price_per_dose: bull.price_per_dose ?? null,
      is_custom: false,
      source: 'CDCB',
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: retry } = await supabase.from('bulls').select('id').eq('code', code).maybeSingle();
      return retry?.id ?? null;
    }
    return null;
  }
  return inserted?.id ?? null;
}

export interface TankEntry {
  tankId: string;
  bull: Bull;
  bullDbId: string;
  doses: number | null;
  pricePerDose: number | null;
}

/** Botijão da conta demo: localStorage por browser (sem tocar no banco). */
const LS_DEMO_ACCOUNT_TANK = 'genefy_demo_account_tank';

type DemoTankMap = [string, { doses: number | null; price: number | null; tankId: string }][];

function lsGetTank(): DemoTankMap {
  try {
    const s = localStorage.getItem(LS_DEMO_ACCOUNT_TANK);
    return s ? (JSON.parse(s) as DemoTankMap) : [];
  } catch { return []; }
}

function lsSetTank(entries: DemoTankMap) {
  localStorage.setItem(LS_DEMO_ACCOUNT_TANK, JSON.stringify(entries));
}

export function useTank(farmId: string | null | undefined, allBulls: Bull[]) {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@gmail.com';

  const [tank, setTank] = useState<TankEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (isDemoUser) {
      const entries: TankEntry[] = lsGetTank().flatMap(([code, v]) => {
        const bull = allBulls.find(b => b.code === code);
        if (!bull) return [];
        return [{
          tankId: v.tankId,
          bull: { ...bull, price_per_dose: v.price ?? bull.price_per_dose },
          bullDbId: code,
          doses: v.doses,
          pricePerDose: v.price,
        }];
      });
      setTank(entries);
      return;
    }

    if (!farmId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tank?farmId=${encodeURIComponent(farmId)}`, { cache: 'no-store' });
      if (res.ok) {
        const data: TankBullRow[] = await res.json();
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
      }
    } catch (err) {
      console.error('[useTank] reload:', err);
    }
    setLoading(false);
  }, [farmId, allBulls, isDemoUser]);

  useEffect(() => { reload(); }, [reload]);

  async function addToTank(farmId: string, bullDbId: string, doses?: number, price?: number) {
    if (isDemoUser) {
      // bullDbId pode ser uuid pseudo (code) — no demo usamos sempre o code
      const code = allBulls.find(b => b.code === bullDbId)?.code ?? bullDbId;
      const entries = lsGetTank().filter(([c]) => c !== code);
      entries.push([code, { doses: doses ?? null, price: price ?? null, tankId: `tank-${code}` }]);
      lsSetTank(entries);
      reload();
      return null;
    }

    try {
      const res = await fetch('/api/tank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, bullDbId, doses, price }),
      });
      if (!res.ok) {
        const msg = (await res.json()).error ?? 'Erro ao inserir no botijão';
        console.error('[useTank] addToTank:', msg);
        return new Error(msg);
      }
      reload();
      return null;
    } catch (err) {
      console.error('[useTank] addToTank:', err);
      return err as Error;
    }
  }

  async function removeFromTank(tankId: string) {
    if (isDemoUser) {
      lsSetTank(lsGetTank().filter(([, v]) => v.tankId !== tankId));
      reload();
      return null;
    }

    const res = await fetch(`/api/tank/${encodeURIComponent(tankId)}`, { method: 'DELETE' }).catch(() => null);
    if (res?.ok) { reload(); return null; }
    return new Error('Erro ao remover do botijão');
  }

  async function updateTankEntry(tankId: string, doses: number | null, price: number | null) {
    if (isDemoUser) {
      lsSetTank(lsGetTank().map(([c, v]) => v.tankId === tankId ? [c, { ...v, doses, price }] : [c, v]));
      reload();
      return null;
    }

    const res = await fetch(`/api/tank/${encodeURIComponent(tankId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doses, price }),
    }).catch(() => null);
    if (res?.ok) { reload(); return null; }
    return new Error('Erro ao atualizar botijão');
  }

  const tankBulls: Bull[] = tank.map(e => e.bull);
  const tankMap = new Map<string, TankEntry>(tank.map(e => [e.bull.code, e]));

  return { tank, tankBulls, tankMap, loading, reload, addToTank, removeFromTank, updateTankEntry };
}
