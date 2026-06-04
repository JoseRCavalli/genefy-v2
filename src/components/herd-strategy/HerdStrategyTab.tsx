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
    saveStrategy,
    hasUnsavedChanges,
    isSaving,
    isLoading,
  } = useHerdStrategy(farmId, females, femaleRows, weights);

  const handleSave = async () => {
    const error = await saveStrategy();
    if (error) {
      alert('Ocorreu um erro ao salvar as alterações: ' + (error && typeof error === 'object' && 'message' in error ? error.message : error));
    }
  };

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
      <div className="border-b border-gray-200 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-blue-dark">Estratégia de Rebanho</h2>
          <p className="text-xs text-gray-500 mt-1">
            Gerencie o planejamento de reposição, a classificação de mérito genético do rebanho e analise os retornos financeiros do Beef on Dairy.
          </p>
        </div>
        
        {/* Botão de Salvar no Topo */}
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border w-fit cursor-pointer ${
            hasUnsavedChanges
              ? 'bg-[#1E7E34] text-white border-[#1E7E34] hover:bg-[#155d25] shadow-sm active:scale-95'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Salvando...</span>
            </>
          ) : (
            <>
              {hasUnsavedChanges ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <span>Salvar Alterações</span>
                </>
              ) : (
                <span>Alterações Salvas</span>
              )}
            </>
          )}
        </button>
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
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            onSave={handleSave}
          />
        )}
        {activeSubTab === 'classification' && (
          <HerdClassificationSubTab
            strategy={strategy}
            assignments={assignments}
            groupCounts={groupCounts}
            onUpdate={updateStrategy}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            onSave={handleSave}
          />
        )}
        {activeSubTab === 'economics' && (
          <EconomicReturnSubTab
            strategy={strategy}
            economics={economics}
            groupCounts={groupCounts}
            onUpdate={updateStrategy}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            onSave={handleSave}
          />
        )}
      </div>

      {/* Floating Save Banner */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 shadow-2xl rounded-xl p-4 flex items-center gap-4 animate-slideDown max-w-sm">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-800">Alterações não salvas</span>
            <span className="text-[10px] text-gray-500">Clique para salvar suas configurações de estratégia.</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#1B3A5C] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#2E6DA4] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Salvando...</span>
              </>
            ) : (
              <span>Salvar Alterações</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
