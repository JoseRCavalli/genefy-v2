import { useState, useMemo } from 'react';
import type { Bull, Female, WeightMap } from '../../lib/matching';
import { getTop3Options } from '../../lib/matching';

type MatchOption = ReturnType<typeof getTop3Options>[number];
type MatchResult = { bull: Bull; inbreeding: number; score: number; carriers: string[]; isCustom: boolean };
import { supabase } from '../../lib/supabase';
import type { FemaleRow, BullRow } from '../../lib/supabase';
import { BullOptionCard } from '../matching/BullOptionCard';

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
}

export function PrimiparousTab({
  females, femaleRows, allBulls, tankBulls,
  weights, maxInb, a2a2Only, useRel,
  farmId, bullRows, onReloadFemales, onTogglePrimiparous,
}: Props) {
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

  async function togglePrimiparous(row: FemaleRow) {
    const newValue = !row.is_primiparous;
    if (onTogglePrimiparous) {
      onTogglePrimiparous(row.id, newValue);
    } else {
      const { error } = await supabase
        .from('females')
        .update({ is_primiparous: newValue })
        .eq('farm_id', farmId)
        .eq('id', row.id);
      if (error) {
        console.error('Erro ao salvar primípara:', error.message);
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
    await supabase.from('matings').insert({
      farm_id: farmId,
      female_id: femaleRow.id,
      bull_id: bullRow.id,
      option_rank: rank,
      score: result.score,
      inbreeding_pct: result.inbreeding ?? 0,
      is_sexed_semen: isSexed,
      status: 'planned',
    });
    setSaving(null);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-lg font-bold text-blue-dark">Primíparas</h2>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">💡 Por que sêmen sexado para primíparas?</p>
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
                      {row.is_primiparous ? '★ Primípara' : 'Marcar'}
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
            const bulls = allBulls.length > 0 ? (tankBulls.length > 0 ? tankBulls : allBulls) : allBulls;
            const options: MatchOption[] = getTop3Options(female, bulls, weights, maxInb, a2a2Only, useRel);
            const asResult = (o: MatchOption): MatchResult => ({
              bull: o.bull, inbreeding: o.inbreeding, score: o.score,
              carriers: o.carriers, isCustom: o.bull._custom ?? false,
            });
            const isSexed = sexedMap[female.id] ?? true;

            return (
              <div key={female.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-blue-dark">{female.id}</h4>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">Tipo de sêmen:</span>
                    <button
                      onClick={() => setSexedMap(m => ({ ...m, [female.id]: false }))}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${!isSexed ? 'bg-blue-mid text-white border-blue-mid' : 'border-gray-300 text-gray-600'}`}
                    >
                      🔵 Convencional
                    </button>
                    <button
                      onClick={() => setSexedMap(m => ({ ...m, [female.id]: true }))}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${isSexed ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600'}`}
                    >
                      🟣 Sexado
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === female.id ? null : female.id)}
                  className="text-sm text-blue-mid hover:underline mb-3"
                >
                  {expandedId === female.id ? '▲ Ocultar opções' : '▼ Ver opções de touros'}
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
