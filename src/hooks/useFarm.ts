import { useEffect, useState } from 'react';
import { supabase, FarmRow } from '../lib/supabase';

const DEMO_FARM_ID_KEY = 'genefy_farm_id';

export function useFarm() {
  const [farm, setFarm] = useState<FarmRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem(DEMO_FARM_ID_KEY);
      if (stored) {
        const { data } = await supabase.from('farms').select('*').eq('id', stored).single();
        if (data) { setFarm(data); setLoading(false); return; }
      }
      // fallback: first farm
      const { data } = await supabase.from('farms').select('*').limit(1).single();
      if (data) {
        localStorage.setItem(DEMO_FARM_ID_KEY, data.id);
        setFarm(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { farm, loading };
}
