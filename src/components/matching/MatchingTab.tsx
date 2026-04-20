import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Bull, Female, WeightMap } from '../../lib/matching';
import { getTop3Options } from '../../lib/matching';
import { supabase } from '../../lib/supabase';
import { BullOptionCard } from './BullOptionCard';
import type { BullRow, FemaleRow } from '../../lib/supabase';

type MatchOption = ReturnType<typeof getTop3Options>[number];

interface Props {
  female: Female | null;
  allBulls: Bull[];
  tankBulls: Bull[];
  weights: WeightMap;
  maxInb: number;
  a2a2Only: boolean;
  tankOnly: boolean;
  useRel: boolean;
  farmId: string;
  bullRows: BullRow[];
  femaleRows: FemaleRow[];
}

export function MatchingTab({
  female, allBulls, tankBulls, weights,
  maxInb, a2a2Only, tankOnly, useRel,
  farmId, bullRows, femaleRows,
}: Props) {
  const [saved, setSaved] = useState<string[]>([]);
  const [catalogFilter, setCatalogFilter] = useState('');

  const catalogOptions = useMemo(() => {
    const seen = new Set<string>();
    allBulls.forEach(b => { if (b.catalog) seen.add(b.catalog); });
    return Array.from(seen).sort();
  }, [allBulls]);

  const options = useMemo((): MatchOption[] => {
    if (!female) return [];
    const base = tankOnly ? tankBulls : allBulls;
    const bulls = catalogFilter ? base.filter(b => (b.catalog ?? 'CDCB') === catalogFilter) : base;
    return getTop3Options(female, bulls, weights, maxInb, a2a2Only, useRel);
  }, [female, allBulls, tankBulls, weights, maxInb, a2a2Only, tankOnly, useRel, catalogFilter]);

  async function handleSave(opt: MatchOption, rank: number, isSexed: boolean) {
    if (!female) return;
    const femaleRow = femaleRows.find(r => r.animal_id === female.id);
    const bullRow = bullRows.find(r => r.code === opt.bull.code);
    if (!femaleRow || !bullRow) { alert('Fêmea ou touro não encontrado no banco de dados.'); return; }
    const { error } = await supabase.from('matings').insert({
      farm_id: farmId,
      female_id: femaleRow.id,
      bull_id: bullRow.id,
      option_rank: rank,
      score: opt.score,
      inbreeding_pct: opt.inbreeding,
      is_sexed_semen: isSexed,
      status: 'planned',
    });
    if (!error) setSaved(v => [...v, `${female.id}-${rank}`]);
    else alert(`Erro ao salvar: ${error.message}`);
  }

  if (!female) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-20">
        <AlertCircle size={40} strokeWidth={1.5} />
        <p className="text-sm">Selecione uma fêmea na barra lateral para ver as opções de matching.</p>
      </div>
    );
  }

  if (!options) {
    return <div className="p-8 text-center text-gray-400">Calculando opções…</div>;
  }

  // Convert array result to MatchResult shape expected by BullOptionCard
  const asMatchResult = (opt: MatchOption) => ({
    bull: opt.bull,
    inbreeding: opt.inbreeding,
    score: opt.score,
    carriers: opt.carriers,
    isCustom: opt.bull._custom ?? false,
  });

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-blue-dark">
          Matching — <span className="text-blue-mid">{female.id}</span>
        </h2>
        <select
          value={catalogFilter}
          onChange={e => setCatalogFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">Todos os catálogos</option>
          {catalogOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {options.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          Nenhum touro encontrado com os filtros atuais. Tente reduzir a consanguinidade máxima ou desabilitar outros filtros.
        </div>
      )}
      {options.map((opt) => {
        const rank = opt.rank as 1 | 2 | 3;
        const isEconomic = opt.type === 'economic';
        const saveKey = `${female.id}-${rank}`;
        return (
          <BullOptionCard
            key={opt.bull.code}
            result={asMatchResult(opt)}
            rank={rank}
            female={female}
            isEconomic={isEconomic}
            onSave={saved.includes(saveKey) ? undefined : (_r, r, s) => handleSave(opt, r, s)}
          />
        );
      })}
    </div>
  );
}
