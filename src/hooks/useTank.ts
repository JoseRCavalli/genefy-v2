import { useEffect, useState, useCallback } from 'react';
import { TankBullRow } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Bull } from '../lib/genetics';

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
