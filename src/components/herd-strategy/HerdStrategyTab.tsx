import { useState } from 'react';
import type { FemaleRow } from '../../lib/supabase';
import type { Female, WeightMap, Bull } from '../../lib/genetics';
import { useHerdStrategy } from '../../hooks/useHerdStrategy';
import { ReplacementPlanSubTab } from './ReplacementPlanSubTab';
import { HerdClassificationSubTab } from './HerdClassificationSubTab';
import { EconomicReturnSubTab } from './EconomicReturnSubTab';

interface Props {
  females: Female[];
  femaleRows: FemaleRow[];
  allBulls: Bull[];
  weights: WeightMap;
  farmId: string;
}

export function HerdStrategyTab({ females, femaleRows, weights, farmId }: Props) {
  const {
    strategy,
    assignments,
    replacementPlan,
    economics,
    groupCounts,
    updateStrategy,
    isLoading,
  } = useHerdStrategy(farmId, females, femaleRows, weights);

  const [activeSubTab, setActiveSubTab] = useState<'planning' | 'classification' | 'economics'>('planning');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-semibold text-gray-500">Carregando estratégia de rebanho...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header da Aba principal */}
      <div className="border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold text-blue-dark">Estratégia de Rebanho</h2>
        <p className="text-xs text-gray-500 mt-1">
          Gerencie o planejamento de reposição, a classificação de mérito genético do rebanho e analise os retornos financeiros do Beef on Dairy.
        </p>
      </div>

      {/* Sub-abas de Navegação (Pills style) */}
      <div className="flex gap-2 border-b border-gray-100 pb-3">
        <button
          onClick={() => setActiveSubTab('planning')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeSubTab === 'planning'
              ? 'bg-blue-dark text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Planejamento de Reposição
        </button>
        <button
          onClick={() => setActiveSubTab('classification')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeSubTab === 'classification'
              ? 'bg-blue-dark text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Classificação do Rebanho
        </button>
        <button
          onClick={() => setActiveSubTab('economics')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeSubTab === 'economics'
              ? 'bg-blue-dark text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Retorno Econômico
        </button>
      </div>

      {/* Renderização das sub-abas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeSubTab === 'planning' && (
          <ReplacementPlanSubTab
            strategy={strategy}
            plan={replacementPlan}
            onUpdate={updateStrategy}
          />
        )}
        {activeSubTab === 'classification' && (
          <HerdClassificationSubTab
            strategy={strategy}
            assignments={assignments}
            groupCounts={groupCounts}
            onUpdate={updateStrategy}
          />
        )}
        {activeSubTab === 'economics' && (
          <EconomicReturnSubTab
            strategy={strategy}
            economics={economics}
            groupCounts={groupCounts}
            onUpdate={updateStrategy}
          />
        )}
      </div>
    </div>
  );
}
