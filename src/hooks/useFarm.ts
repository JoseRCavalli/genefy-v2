import { useEffect, useState } from 'react';
import { supabase, FarmRow } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DEMO_FARM_ID_KEY = 'genefy_farm_id';

export function useFarm() {
  const { user } = useAuth();
  const [farm, setFarm] = useState<FarmRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (user?.email === 'demo@gmail.com') {
        try {
          // Query if 'Fazenda Teste' already exists
          let { data } = await supabase
            .from('farms')
            .select('*')
            .eq('name', 'Fazenda Teste')
            .maybeSingle();

          if (!data) {
            // Create 'Fazenda Teste' if it doesn't exist
            const { data: newFarm, error } = await supabase
              .from('farms')
              .insert({ name: 'Fazenda Teste', owner_name: 'user' })
              .select()
              .single();
            if (newFarm) {
              data = newFarm;
            } else if (error) {
              console.error('Error creating demo farm:', error);
            }
          }

          if (data) {
            setFarm(data);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Failed to load demo farm:', err);
        }
      }

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
  }, [user]);

  return { farm, loading };
}
