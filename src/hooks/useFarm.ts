import { useEffect, useState } from 'react';
import { FarmRow } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DEMO_FARM_ID_KEY = 'genefy_farm_id';

/**
 * Fase 3: a conta demo também busca via API — o servidor detecta o cookie
 * demo e devolve a Fazenda Teste fixa, sem tocar no Supabase.
 */
export function useFarm() {
  const { user } = useAuth();
  const [farm, setFarm] = useState<FarmRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stored = localStorage.getItem(DEMO_FARM_ID_KEY);
        const qs = stored ? `?id=${encodeURIComponent(stored)}` : '';
        const res = await fetch(`/api/farm${qs}`, { cache: 'no-store' });
        if (res.ok) {
          const data: FarmRow | null = await res.json();
          if (!cancelled && data) {
            localStorage.setItem(DEMO_FARM_ID_KEY, data.id);
            setFarm(data);
          }
        }
      } catch (err) {
        console.error('Failed to load farm:', err);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  return { farm, loading };
}
