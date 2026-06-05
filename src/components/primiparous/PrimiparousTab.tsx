import { useState, useMemo, useEffect } from 'react';
import { Lightbulb, Circle, Star, ChevronDown, ChevronUp } from 'lucide-react';
import type { Bull, Female, WeightMap } from '../../lib/matching';
import { calcTop3, isLocalCalc, type MatchOption } from '../../lib/calc-client';

type MatchResult = { bull: Bull; inbreeding: number; score: number; carriers: string[]; isCustom: boolean };
import type { FemaleRow, BullRow } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { insertDemoMating } from '../../lib/demo-matings';
import { BullOptionCard } from '../matching/BullOptionCard';
import type { FemaleAssignment } from '../../types/herd-strategy.types';
import { GROUP_LABELS, GROUP_COLORS } from '../../types/herd-strategy.types';

interface Props {
  females: Female[];
  femaleRows: FemaleRow[];
  allBulls: Bull[];
  tankBulls: Bull[];
  weights: WeightMap;
  maxInb: number;
  a2a2Only: boolean;
  useRel: boolean;
  farmId: string;
  bullRows: BullRow[];
  onReloadFemales: () => void;
  onTogglePrimiparous?: (rowId: string, value: boolean) => void;
  assignments?: FemaleAssignment[];
}

export function PrimiparousTab({
  females, femaleRows, allBulls, tankBulls,
  weights, maxInb, a2a2Only, useRel,
  farmId, bullRows, onReloadFemales, onTogglePrimiparous,
  assignments,
}: Props) {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@gmail.com';
  const [sexedMap, setSexedMap] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const primiparousRows = useMemo(() =>
    femaleRows.filter(r => r.is_primiparous),
    [femaleRows]
  );

  const primiparousFemales = useMemo(() =>
    females.filter(f => femaleRows.find(r => r.animal_id === f.id && r.is_primiparous)),
    [females, femaleRows]
  );

  // Top 3 por primípara em lote no servidor (genetics.ts via /api/calc/top3);
  // local apenas em demo
  const [optionsMap, setOptionsMap] = useState<Record<string, MatchOption[]>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (primiparousFemales.length === 0) { setOptionsMap({}); return; }
      const bulls = allBulls.length > 0 ? (tankBulls.length > 0 ? tankBulls : allBulls) : allBulls;
      try {
        const result = await calcTop3({
          local: isLocalCalc(user?.email),
          farmId,
          females: primiparousFemales,
          bulls,
          bullsIsFullSet: tankBulls.length === 0,
          weights,
          maxInb,
          a2a2Only,
          useRel,
        });
        if (!cancelled) setOptionsMap(result);
      } catch (err) {
        console.error('[PrimiparousTab] calcTop3:', err);
        if (!cancelled) setOptionsMap({});
      }
    })();
    return () => { cancelled = true; };
  }, [primiparousFemales, allBulls, tankBulls, weights, maxInb, a2a2Only, useRel, farmId, user?.email]);

  async function togglePrimiparous(row: FemaleRow) {
    const newValue = !row.is_primiparous;
    if (onTogglePrimiparous) {
      onTogglePrimiparous(row.id, newValue);
    } else {
      const res = await fetch(`/api/females/${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_primiparous: newValue }),
      }).catch(() => null);
      if (!res?.ok) {
        console.error('Erro ao salvar primípara');
        return;
      }
      onReloadFemales();
    }
  }

  async function handleSaveMating(female: Female, result: MatchResult, rank: number, isSexed: boolean) {
    setSaving(female.id);
    const femaleRow = femaleRows.find(r => r.animal_id === female.id);
    const bullRow = bullRows.find(b => b.code === result.bull.code);
    if (!femaleRow || !bullRow) { setSaving(null); return; }

    if (isDemoUser) {
      // Conta demo: histórico local por browser, sem tocar no banco
      insertDemoMating({
        farm_id: farmId,
        femaleRow,
        bullRow,
        bullCode: result.bull.code,
        option_rank: rank,
        score: result.score,
        inbreeding_pct: result.inbreeding ?? 0,
        is_sexed_semen: isSexed,
      });
    } else {
      await fetch('/api/matings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          matings: [{
            female_id: femaleRow.id,
            bull: result.bull.code,
            option_rank: rank,
            score: result.score,
            inbreeding_pct: result.inbreeding ?? 0,
            is_sexed_semen: isSexed,
            status: 'planned',
          }],
        }),
      }).catch(() => null);
    }
    setSaving(null);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-lg font-bold text-blue-dark">Primíparas</h2>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1 flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-500" style={{ flexShrink: 0 }} />
          Por que sêmen sexado para primíparas?
        </p>
        <p>Vacas de primeiro parto têm pelve menor, tornando partos de bezerros machos mais arriscados. O sêmen sexado garante ~90% de chance de bezerra fêmea, reduzindo risco de distocia. Custo por dose é 2-3× maior e taxa de concepção ~10-15% inferior ao convencional.</p>
      </div>

      {/* Lista de todas as fêmeas com toggle */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm">Marcar Primíparas ({primiparousRows.length} marcadas)</h3>
        </div>
        <div className="overflow-y-auto max-h-64">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-center">Lact.</th>
                <th className="px-4 py-2 text-center">NM$</th>
                <th className="px-4 py-2 text-center">Primípara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {femaleRows.map(row => (
                <tr key={row.id} className={`hover:bg-gray-50 ${row.is_primiparous ? 'bg-purple-50' : ''}`}>
                  <td className="px-4 py-1.5 font-medium">{row.animal_id}</td>
                  <td className="px-4 py-1.5 text-center">{row.lact}</td>
                  <td className="px-4 py-1.5 text-center">{row.net_merit ?? '—'}</td>
                  <td className="px-4 py-1.5 text-center">
                    <button
                      onClick={() => togglePrimiparous(row)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        row.is_primiparous
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {row.is_primiparous
                        ? <><Star size={10} className="inline" style={{ marginRight: '3px', marginBottom: '1px' }} />Primípara</>
                        : 'Marcar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matching para primíparas */}
      {primiparousFemales.length > 0 && (
        <div className="space-y-6">
          <h3 className="font-semibold text-gray-700">Opções de Matching para Primíparas</h3>
          {primiparousFemales.map(female => {
            const options: MatchOption[] = optionsMap[female.id] ?? [];
            const asResult = (o: MatchOption): MatchResult => ({
              bull: o.bull, inbreeding: o.inbreeding, score: o.score,
              carriers: o.carriers, isCustom: o.bull._custom ?? false,
            });
            const isSexed = sexedMap[female.id] ?? true;

            return (
              <div key={female.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-blue-dark">{female.id}</h4>
                    {(() => {
                      const a = assignments?.find((item) => item.female_id === female.id);
                      if (!a) return null;
                      const colors = GROUP_COLORS[a.assignment_group];
                      const label = GROUP_LABELS[a.assignment_group];
                      if (!colors || !label) return null;
                      return (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">Tipo de sêmen:</span>
                    <button
                      onClick={() => setSexedMap(m => ({ ...m, [female.id]: false }))}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${!isSexed ? 'bg-blue-mid text-white border-blue-mid' : 'border-gray-300 text-gray-600'}`}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Circle size={7} fill="currentColor" strokeWidth={0} style={{ color: !isSexed ? '#fff' : '#2E6DA4' }} />
                        Convencional
                      </span>
                    </button>
                    <button
                      onClick={() => setSexedMap(m => ({ ...m, [female.id]: true }))}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${isSexed ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600'}`}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Circle size={7} fill="currentColor" strokeWidth={0} style={{ color: isSexed ? '#fff' : '#7c3aed' }} />
                        Sexado
                      </span>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === female.id ? null : female.id)}
                  className="text-sm text-blue-mid hover:underline mb-3 flex items-center gap-1"
                >
                  {expandedId === female.id
                    ? <><ChevronUp size={13} /> Ocultar opções</>
                    : <><ChevronDown size={13} /> Ver opções de touros</>}
                </button>
                {expandedId === female.id && (
                  <div className="grid md:grid-cols-3 gap-3">
                    {options.map((opt, i) => (
                      <BullOptionCard
                        key={opt.bull.code}
                        result={asResult(opt)}
                        rank={(i + 1) as 1 | 2 | 3}
                        female={female}
                        isEconomic={opt.type === 'economic'}
                        onSave={saving === female.id ? undefined : (_r, rank) => handleSaveMating(female, asResult(opt), rank, isSexed)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
