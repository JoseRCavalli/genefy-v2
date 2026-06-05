import { useEffect, useState, useCallback } from 'react';
import { PRESETS, WeightMap } from '../lib/genetics';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_WEIGHTS: WeightMap = PRESETS['Balanced'] ?? PRESETS[Object.keys(PRESETS)[0]];

/** Presets custom da conta demo: localStorage por browser (sem banco). */
const LS_DEMO_ACCOUNT_PRESETS = 'genefy_demo_account_presets';

type PresetEntry = { id: string; name: string; weights: WeightMap };

function lsGetPresets(): PresetEntry[] {
  try {
    const s = localStorage.getItem(LS_DEMO_ACCOUNT_PRESETS);
    return s ? (JSON.parse(s) as PresetEntry[]) : [];
  } catch { return []; }
}

export function useWeights(farmId: string | null | undefined) {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@gmail.com';

  const [weights, setWeights] = useState<WeightMap>(DEFAULT_WEIGHTS);
  const [presets, setPresets] = useState<PresetEntry[]>([]);
  const [activePreset, setActivePreset] = useState<string>('Balanced');

  const loadPresets = useCallback(async () => {
    if (isDemoUser) {
      setPresets(lsGetPresets());
      return;
    }
    if (!farmId) return;
    try {
      const res = await fetch(`/api/weights?farmId=${encodeURIComponent(farmId)}`, { cache: 'no-store' });
      if (res.ok) {
        const data: { id: string; name: string; weights: WeightMap }[] = await res.json();
        setPresets((data ?? []).map(r => ({ id: r.id, name: r.name, weights: r.weights })));
      }
    } catch (err) {
      console.error('[useWeights] loadPresets:', err);
    }
  }, [farmId, isDemoUser]);

  useEffect(() => { loadPresets(); }, [loadPresets]);

  function applyPreset(name: string) {
    // check built-in presets first
    if (PRESETS[name]) { setWeights(PRESETS[name]); setActivePreset(name); return; }
    // check custom presets
    const found = presets.find(p => p.name === name);
    if (found) { setWeights(found.weights); setActivePreset(name); }
  }

  async function savePreset(name: string) {
    if (isDemoUser) {
      const next = [...lsGetPresets().filter(p => p.name !== name), { id: `demo-${name}`, name, weights }];
      localStorage.setItem(LS_DEMO_ACCOUNT_PRESETS, JSON.stringify(next));
      setPresets(next);
      setActivePreset(name);
      return null;
    }
    if (!farmId) return;
    const res = await fetch('/api/weights', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmId, name, weights }),
    }).catch(() => null);
    if (res?.ok) { loadPresets(); setActivePreset(name); return null; }
    return new Error('Erro ao salvar preset');
  }

  return { weights, setWeights, presets, activePreset, setActivePreset, applyPreset, savePreset };
}
