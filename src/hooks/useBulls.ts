import { useEffect, useState, useCallback, useMemo } from 'react';
import { BullRow } from '../lib/supabase';
import { getBrandFromCode } from '../lib/naab-brands';
import { useAuth } from '../contexts/AuthContext';
import { rowToBull } from '../lib/row-mappers';
import type { Bull } from '../lib/genetics';

function bullToPseudoRow(b: Bull): BullRow {
  return {
    id: b.code,
    farm_id: null,
    code: b.code,
    short_name: b.name ?? b.short_name ?? null,
    full_name: b.full_name ?? null,
    gtpi: b.gtpi ?? null,
    net_merit: b.net_merit ?? null,
    milk: b.milk ?? null,
    protein: b.protein ?? null,
    fat: b.fat ?? null,
    productive_life: b.productive_life ?? null,
    scs: b.scs ?? null,
    dpr: b.dpr ?? null,
    hcr: b.hcr ?? null,
    ccr: b.ccr ?? null,
    fertility_index: b.fertility_index ?? null,
    ptat: b.ptat ?? null,
    udc: b.udc ?? null,
    flc: b.flc ?? null,
    feed_saved: b.feed_saved ?? null,
    gfi: b.gfi ?? null,
    cow_livability: b.cow_livability ?? null,
    sire_calving_ease: b.sire_calving_ease ?? null,
    beta_casein: b.beta_casein ?? null,
    kappa_casein: b.kappa_casein ?? null,
    hh1: (b.HH1 as string) || 'Free',
    hh2: (b.HH2 as string) || 'Free',
    hh3: (b.HH3 as string) || 'Free',
    hh4: (b.HH4 as string) || 'Free',
    hh5: (b.HH5 as string) || 'Free',
    hh6: (b.HH6 as string) || 'Free',
    reliability: b.reliability ?? null,
    price_per_dose: b.price_per_dose ?? null,
    is_custom: false,
    source: 'CDCB',
    created_at: new Date().toISOString(),
  };
}

/**
 * Fase 3: o catálogo estático (CATALOG_BULLS) saiu do bundle — é carregado de
 * GET /api/catalog (cacheável; servido para usuário logado e sessão demo).
 * Custom bulls: API (usuário real) ou memória (conta demo).
 */
export function useBulls(farmId: string | null | undefined) {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@gmail.com';

  const [catalog, setCatalog] = useState<Bull[]>([]);
  const [customRows, setCustomRows] = useState<BullRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Catálogo: uma vez por sessão (browser cacheia via Cache-Control)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/catalog');
        if (res.ok && !cancelled) {
          const data = await res.json() as any[];
          const normalized = data.map(b => ({
            ...b,
            productive_life: b.productive_life ?? b.pl,
            cow_livability: b.cow_livability ?? b.liv,
            sire_calving_ease: b.sire_calving_ease ?? b.sce,
            feed_saved: b.feed_saved ?? b.efi,
          }));
          setCatalog(normalized as Bull[]);
        }
      } catch (err) {
        console.error('[useBulls] catálogo:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const reload = useCallback(async () => {
    // Conta demo: customizações ficam em memória (sem API)
    if (isDemoUser) return;
    if (!farmId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bulls?farmId=${encodeURIComponent(farmId)}`, { cache: 'no-store' });
      if (res.ok) {
        setCustomRows((await res.json()) as BullRow[]);
      }
    } catch (err) {
      console.error('[useBulls] reload:', err);
    }
    setLoading(false);
  }, [farmId, isDemoUser]);

  useEffect(() => { reload(); }, [reload]);

  // Mesma derivação de antes: catálogo + overrides/custom
  const { bulls, bullRows } = useMemo(() => {
    const custom: Bull[] = customRows.map(rowToBull);

    const basePseudoRows: BullRow[] = catalog
      .filter(b => !customRows.some(r => r.code === b.code))
      .map(bullToPseudoRow);

    const mergedBulls = catalog.map(baseBull => {
      const customOverride = custom.find(c => c.code === baseBull.code);
      return customOverride ?? baseBull;
    });
    const customOnly = custom.filter(c => !catalog.some(b => b.code === c.code));

    return {
      bulls: [...mergedBulls, ...customOnly],
      bullRows: [...basePseudoRows, ...customRows],
    };
  }, [customRows, catalog]);

  async function addCustomBull(farmId: string, bull: Omit<BullRow, 'id' | 'created_at' | 'farm_id'>) {
    if (isDemoUser) {
      setCustomRows(rows => [
        ...rows,
        { ...bull, id: `demo-${bull.code}`, farm_id: 'demo-account-farm', is_custom: true, created_at: new Date().toISOString() } as BullRow,
      ]);
      return null;
    }
    try {
      const res = await fetch('/api/bulls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, bull }),
      });
      if (!res.ok) return new Error((await res.json()).error ?? 'Erro ao adicionar touro');
      reload();
      return null;
    } catch (err) {
      return err as Error;
    }
  }

  async function updateBullPrice(code: string, price: number) {
    if (isDemoUser) {
      setCustomRows(rows => {
        const existing = rows.find(r => r.code === code);
        if (existing) return rows.map(r => r.code === code ? { ...r, price_per_dose: price } : r);
        const base = catalog.find(b => b.code === code);
        if (!base) return rows;
        return [...rows, { ...bullToPseudoRow({ ...base, price_per_dose: price }), id: `demo-${code}`, farm_id: 'demo-account-farm', is_custom: true }];
      });
      return null;
    }
    try {
      const res = await fetch('/api/bulls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, price }),
      });
      if (!res.ok) return new Error((await res.json()).error ?? 'Erro ao atualizar preço');
      reload();
      return null;
    } catch (err) {
      return err as Error;
    }
  }

  async function upsertBull(farmId: string, bull: Partial<BullRow> & { code: string }) {
    if (isDemoUser) {
      setCustomRows(rows => {
        const idx = rows.findIndex(r => r.code === bull.code);
        const merged = {
          ...(idx >= 0 ? rows[idx] : bullToPseudoRow(catalog.find(b => b.code === bull.code) ?? ({ code: bull.code } as Bull))),
          ...bull,
          id: idx >= 0 ? rows[idx].id : `demo-${bull.code}`,
          farm_id: 'demo-account-farm',
          is_custom: true,
        } as BullRow;
        if (idx >= 0) { const next = [...rows]; next[idx] = merged; return next; }
        return [...rows, merged];
      });
      return null;
    }
    try {
      const res = await fetch('/api/bulls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, bull }),
      });
      if (!res.ok) return new Error((await res.json()).error ?? 'Erro ao salvar touro');
      reload();
      return null;
    } catch (err) {
      return err as Error;
    }
  }

  return { bulls, bullRows, loading, reload, addCustomBull, updateBullPrice, upsertBull };
}
