import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Bull, Female, MetaGoals, MetaResult } from '../../lib/matching';
import { fmt, inbClass } from '../../lib/matching';
import { useAuth } from '../../contexts/AuthContext';
import { calcMetaSearch, isLocalCalc } from '../../lib/calc-client';

interface Props {
  females: Female[];
  allBulls: Bull[];
  tankBulls: Bull[];
  weights: Record<string, number | undefined>;
  farmId?: string;
}

const GOAL_FIELDS: { key: keyof MetaGoals; label: string; step?: number }[] = [
  { key: 'gtpi', label: 'GTPI alvo', step: 10 },
  { key: 'net_merit', label: 'NM$ alvo', step: 10 },
  { key: 'milk', label: 'Leite alvo (kg)', step: 100 },
  { key: 'productive_life', label: 'PL alvo', step: 0.5 },
  { key: 'scs', label: 'SCS máx.', step: 0.05 },
  { key: 'dpr', label: 'DPR alvo', step: 0.5 },
];

export function MetaSearchTab({ females, allBulls, tankBulls, farmId }: Props) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Partial<MetaGoals>>({});
  const [results, setResults] = useState<MetaResult[]>([]);
  const [running, setRunning] = useState(false);
  const [tankOnly, setTankOnly] = useState(false);

  function setGoal(key: keyof MetaGoals, value: string) {
    setGoals(g => ({ ...g, [key]: value === '' ? undefined : parseFloat(value) }));
  }

  // Busca roda no servidor (genetics.ts via /api/calc/meta-search); local em demo
  async function run() {
    setRunning(true);
    const bulls = tankOnly ? tankBulls : allBulls;
    try {
      const res = await calcMetaSearch({
        local: isLocalCalc(user?.email) || !farmId,
        farmId: farmId ?? '',
        females,
        bulls,
        bullsIsFullSet: !tankOnly,
        goals: goals as MetaGoals,
      });
      setResults(res.slice(0, 10));
    } catch (err) {
      console.error('[MetaSearchTab] calcMetaSearch:', err);
      setResults([]);
    }
    setRunning(false);
  }

  // Compute match percentage from deviation (lower deviation = better match)
  function matchPct(deviation: number): number {
    return Math.max(0, Math.min(100, 100 - deviation * 10));
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-lg font-bold text-blue-dark">Busca por Meta Genética</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-600">Metas desejadas na progênie</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {GOAL_FIELDS.map(f => (
            <div key={f.key}>
              <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
              <input
                type="number"
                step={f.step}
                value={goals[f.key] ?? ''}
                onChange={e => setGoal(f.key, e.target.value)}
                placeholder="Qualquer"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-mid"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={tankOnly} onChange={e => setTankOnly(e.target.checked)} className="accent-blue-mid" />
            Apenas botijão
          </label>
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-blue-mid text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            <Search size={14} /> {running ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-[#1B3A5C] text-white text-xs">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Fêmea</th>
                <th className="px-4 py-3 text-left">Touro</th>
                <th className="px-4 py-3 text-center">% Match</th>
                <th className="px-4 py-3 text-center">GTPI prog.</th>
                <th className="px-4 py-3 text-center">NM$ prog.</th>
                <th className="px-4 py-3 text-center">Leite prog.</th>
                <th className="px-4 py-3 text-center">Inb.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((r, i) => {
                const inbPct = r.inbreeding;
                const pct = matchPct(r.deviation);
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium">{r.female.id}</td>
                    <td className="px-4 py-2 font-mono text-blue-dark">{r.bull.code}</td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-mid h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">{r.progenyPtas['gtpi'] != null ? fmt(r.progenyPtas['gtpi'], 0) : '—'}</td>
                    <td className="px-4 py-2 text-center">{r.progenyPtas['net_merit'] != null ? fmt(r.progenyPtas['net_merit'], 0) : '—'}</td>
                    <td className="px-4 py-2 text-center">{r.progenyPtas['milk'] != null ? fmt(r.progenyPtas['milk'], 0) : '—'}</td>
                    <td className={`px-4 py-2 text-center text-xs ${inbClass(inbPct).cls}`}>{inbPct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
