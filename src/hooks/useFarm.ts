import { useEffect, useState } from 'react';
import { FarmRow } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DEMO_FARM_ID_KEY = 'genefy_farm_id';

/**
 * Conta demo (demo@gmail.com): farm fixa client-side, sem tocar no banco.
 * A sessão mock não tem cookies Supabase, então a API interna respondería 401
 * de qualquer forma — dados reais de rebanho são inalcançáveis por construção.
 */
const DEMO_ACCOUNT_FARM: FarmRow = {
  id: 'demo-account-farm',
  name: 'Fazenda Teste',
  owner_name: 'user',
  created_at: '2026-01-01T00:00:00.000Z',
};

export function useFarm() {
  const { user } = useAuth();
  const [farm, setFarm] = useState<FarmRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (user?.email === 'demo@gmail.com') {
        setFarm(DEMO_ACCOUNT_FARM);
        setLoading(false);
        return;
      }

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
