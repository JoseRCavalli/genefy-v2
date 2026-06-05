import { useEffect, useState, useCallback, useMemo } from 'react';
import { FemaleRow } from '../lib/supabase';
import type { Female } from '../lib/genetics';
import { useAuth } from '../contexts/AuthContext';
import { rowToFemale } from '../lib/row-mappers';

// Conversão movida para módulo agnóstico (usada também pelos Route Handlers)
export { rowToFemale };

/**
 * Fase 3: os dados saíram do bundle.
 * - Usuário real: GET /api/females (RLS via sessão).
 * - Conta demo: o MESMO GET — o servidor detecta o cookie demo e devolve as
 *   DEMO_FEMALES fictícias. Edições demo continuam em memória (browser).
 * - BASE_FEMALES (rebanho real) não é mais embarcado nem usado como fallback.
 */
export function useFemales(farmId: string | null | undefined) {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@gmail.com';

  const [females, setFemales] = useState<Female[]>([]);
  const [femaleRows, setFemaleRows] = useState<FemaleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    // Demo: o servidor responde com as fêmeas fictícias (cookie demo);
    // usuário real precisa de farmId.
    if (!isDemoUser && !farmId) return;
    setLoading(true);
    try {
      const qs = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
      const res = await fetch(`/api/females${qs}`, { cache: 'no-store' });
      if (res.ok) {
        const data: FemaleRow[] = await res.json();
        if (data && data.length > 0) {
          setFemaleRows(data);
          setFemales(data.map(rowToFemale));
        }
      }
    } catch (err) {
      console.error('[useFemales] reload:', err);
    }
    setLoading(false);
  }, [farmId, isDemoUser]);

  useEffect(() => { reload(); }, [reload]);

  // Catálogo de fêmeas = exatamente o rebanho carregado (sem merge com dados
  // estáticos; o fallback BASE_FEMALES foi removido na Fase 3).
  const catalogFemales = useMemo(() => females, [females]);
  const catalogFemaleRows = useMemo(() => femaleRows, [femaleRows]);

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
            farm_id: farmId || 'demo-account-farm',
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

    const res = await fetch('/api/females', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmId, female }),
    }).catch(() => null);
    if (res?.ok) { reload(); return null; }
    return new Error(res ? (await res.json()).error ?? 'Erro ao salvar fêmea' : 'Erro de rede');
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

    const res = await fetch(`/api/females/${encodeURIComponent(dbId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_primiparous: value }),
    }).catch(() => null);
    if (res?.ok) { reload(); return null; }
    return new Error('Erro ao atualizar primípara');
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

    const res = await fetch(`/api/females/${encodeURIComponent(dbId)}`, { method: 'DELETE' }).catch(() => null);
    if (res?.ok) { reload(); return null; }
    return new Error('Erro ao excluir fêmea');
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

    const res = await fetch(`/api/females/${encodeURIComponent(dbId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    }).catch(() => null);
    if (res?.ok) { reload(); return null; }
    return new Error('Erro ao atualizar categorias');
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

    const res = await fetch(`/api/females/${encodeURIComponent(dbId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }).catch(() => null);
    if (res?.ok) { reload(); return null; }
    return new Error('Erro ao atualizar notas');
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
