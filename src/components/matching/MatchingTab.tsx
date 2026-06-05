import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Bull, Female, WeightMap } from '../../lib/matching';
import { BullOptionCard } from './BullOptionCard';
import type { BullRow, FemaleRow } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { insertDemoMating } from '../../lib/demo-matings';
import { calcTop3, type MatchOption } from '../../lib/calc-client';

import type { FemaleAssignment } from '../../types/herd-strategy.types';
import { GROUP_LABELS, GROUP_COLORS } from '../../types/herd-strategy.types';

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
  onNavigate?: (tab: string) => void;
  assignments?: FemaleAssignment[];
}

export function MatchingTab({
  female, allBulls, tankBulls, weights,
  maxInb, a2a2Only, tankOnly, useRel,
  farmId, bullRows, femaleRows, onNavigate,
  assignments,
}: Props) {
  const [saved, setSaved] = useState<string[]>([]);
  const [catalogFilter, setCatalogFilter] = useState('');
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@gmail.com';

  const catalogOptions = useMemo(() => {
    const seen = new Set<string>();
    allBulls.forEach(b => { if (b.catalog) seen.add(b.catalog); });
    return Array.from(seen).sort();
  }, [allBulls]);

  // Cálculo no servidor (genetics.ts via /api/calc/top3); local apenas em demo
  const [options, setOptions] = useState<MatchOption[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!female) { setOptions([]); return; }
      const base = tankOnly ? tankBulls : allBulls;
      const bulls = catalogFilter ? base.filter(b => (b.catalog ?? 'CDCB') === catalogFilter) : base;
      try {
        const result = await calcTop3({
          farmId,
          females: [female],
          bulls,
          bullsIsFullSet: !tankOnly && !catalogFilter,
          weights,
          maxInb,
          a2a2Only,
          useRel,
        });
        if (!cancelled) setOptions(result[female.id] ?? []);
      } catch (err) {
        console.error('[MatchingTab] calcTop3:', err);
        if (!cancelled) setOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [female, allBulls, tankBulls, weights, maxInb, a2a2Only, tankOnly, useRel, catalogFilter, farmId, user?.email]);

  async function handleSave(opt: MatchOption, rank: number, isSexed: boolean) {
    if (!female) return;
    const femaleRow = femaleRows.find(r => r.animal_id === female.id);
    if (!femaleRow) { alert('Fêmea não encontrada no banco de dados.'); return; }

    // Conta demo: histórico local por browser, sem tocar no banco
    if (isDemoUser) {
      insertDemoMating({
        farm_id: farmId,
        femaleRow,
        bullRow: bullRows.find(b => b.code === opt.bull.code) ?? null,
        bullCode: opt.bull.code,
        option_rank: rank,
        score: opt.score,
        inbreeding_pct: opt.inbreeding,
        is_sexed_semen: isSexed,
      });
      setSaved(v => [...v, `${female.id}-${rank}`]);
      if (onNavigate) onNavigate('history');
      return;
    }

    // A resolução code->uuid do touro roda no servidor
    const res = await fetch('/api/matings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmId,
        matings: [{
          female_id: femaleRow.id,
          bull: opt.bull.code,
          option_rank: rank,
          score: opt.score,
          inbreeding_pct: opt.inbreeding,
          is_sexed_semen: isSexed,
          status: 'planned',
        }],
      }),
    }).catch(() => null);

    const body = res ? await res.json() : null;
    if (res?.ok && body?.saved > 0) {
      setSaved(v => [...v, `${female.id}-${rank}`]);
      if (onNavigate) onNavigate('history');
    } else {
      alert(`Erro ao salvar: ${body?.error ?? 'falha de rede'}`);
    }
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
        <h2 className="text-lg font-bold text-blue-dark flex items-center gap-2 flex-wrap">
          Matching — <span className="text-blue-mid">{female.id}</span>
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
