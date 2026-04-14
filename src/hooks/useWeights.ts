import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PRESETS, WeightMap } from '../lib/genetics';

const DEFAULT_WEIGHTS: WeightMap = PRESETS['Balanced'] ?? PRESETS[Object.keys(PRESETS)[0]];

export function useWeights(farmId: string | null | undefined) {
  const [weights, setWeights] = useState<WeightMap>(DEFAULT_WEIGHTS);
  const [presets, setPresets] = useState<{ id: string; name: string; weights: WeightMap }[]>([]);
  const [activePreset, setActivePreset] = useState<string>('Balanced');

  const loadPresets = useCallback(async () => {
    if (!farmId) return;
    const { data } = await supabase.from('weight_presets').select('*').eq('farm_id', farmId);
    setPresets((data ?? []).map(r => ({ id: r.id, name: r.name, weights: r.weights as WeightMap })));
  }, [farmId]);

  useEffect(() => { loadPresets(); }, [loadPresets]);

  function applyPreset(name: string) {
    // check built-in presets first
    if (PRESETS[name]) { setWeights(PRESETS[name]); setActivePreset(name); return; }
    // check custom presets
    const found = presets.find(p => p.name === name);
    if (found) { setWeights(found.weights); setActivePreset(name); }
  }

  async function savePreset(name: string) {
    if (!farmId) return;
    const { error } = await supabase
      .from('weight_presets')
      .upsert({ farm_id: farmId, name, weights }, { onConflict: 'farm_id,name' } as never);
    if (!error) { loadPresets(); setActivePreset(name); }
    return error;
  }

  return { weights, setWeights, presets, activePreset, applyPreset, savePreset };
}
