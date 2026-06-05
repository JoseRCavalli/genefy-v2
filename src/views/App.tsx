'use client';

import { useState, useMemo } from 'react';
import { AuthGuard } from '../components/ui/AuthGuard';
import LoadingScreen from '../components/ui/LoadingScreen';
import { CustomHeader } from '../components/ui/CustomHeader';
import { Sidebar } from '../components/layout/Sidebar';
import { MatchingTab } from '../components/matching/MatchingTab';
import { MatingPlanTab } from '../components/mating-plan/MatingPlanTab';
import { PrimiparousTab } from '../components/primiparous/PrimiparousTab';
import { CatalogTab } from '../components/catalog/CatalogTab';
import { HerdTab } from '../components/herd/HerdTab';
import { FemalesCatalogTab } from '../components/catalog/FemalesCatalogTab';
import { MetaSearchTab } from '../components/meta-search/MetaSearchTab';
import { HistoryTab } from '../components/history/HistoryTab';
import { HerdStrategyTab } from '../components/herd-strategy/HerdStrategyTab';
import { useHerdStrategy } from '../hooks/useHerdStrategy';

import { useFarm } from '../hooks/useFarm';
import { useBulls } from '../hooks/useBulls';
import { useFemales } from '../hooks/useFemales';
import { useTank } from '../hooks/useTank';
import { useWeights } from '../hooks/useWeights';

import type { Female } from '../lib/matching';

// ── Supabase App ──────────────────────────────────────────────────────────────
function SupabaseApp() {
  const [activeTab, setActiveTab] = useState('matching');
  const [selectedFemale, setSelectedFemale] = useState<Female | null>(null);
  const [maxInb, setMaxInb] = useState(6.25);
  const [a2a2Only, setA2a2Only] = useState(false);
  const [tankOnly, setTankOnly] = useState(false);
  const [useRel, setUseRel] = useState(true);
  const [bullTypeFilter, setBullTypeFilter] = useState('all');

  const { farm, loading: farmLoading } = useFarm();
  const { bulls, bullRows, addCustomBull, updateBullPrice, upsertBull } = useBulls(farm?.id);
  const { females, femaleRows, catalogFemales, catalogFemaleRows, reload: reloadFemales, upsertFemale, setPrimiparous, deleteFemale, updateFemaleCategories, updateFemaleNotes } = useFemales(farm?.id);
  const { tank, tankBulls, addToTank, removeFromTank, updateTankEntry } = useTank(farm?.id, bulls);
  const { weights, setWeights, presets, activePreset, setActivePreset, applyPreset, savePreset } = useWeights(farm?.id);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'sexed_premium', 'sexed_budget', 'conventional', 'beef', 'none'
  ]);

  const filteredFemalesMatching = useMemo(() => {
    return females.filter(f => {
      const cats = f.categories ?? [];
      if (cats.length === 0) return selectedCategories.includes('none');
      return cats.some(c => selectedCategories.includes(c));
    });
  }, [females, selectedCategories]);
  const { assignments } = useHerdStrategy(farm?.id, females, femaleRows, weights);

  const filteredBulls = useMemo(() => {
    if (bullTypeFilter === 'all') return bulls;
    return bulls.filter(b => (b.bull_type || 'dairy') === bullTypeFilter);
  }, [bulls, bullTypeFilter]);

  const filteredTankBulls = useMemo(() => {
    if (bullTypeFilter === 'all') return tankBulls;
    return tankBulls.filter(b => (b.bull_type || 'dairy') === bullTypeFilter);
  }, [tankBulls, bullTypeFilter]);

  const filteredTank = useMemo(() => {
    if (bullTypeFilter === 'all') return tank;
    return tank.filter(t => (t.bull.bull_type || 'dairy') === bullTypeFilter);
  }, [tank, bullTypeFilter]);

  function handleApplyPreset(name: string) {
    if (name === 'Personalizado') { setActivePreset('Personalizado'); return; }
    applyPreset(name);
  }

  if (farmLoading) {
    return <LoadingScreen />;
  }

  if (!farm) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
        <h1 className="text-xl font-bold text-[#1B3A5C]">Genefy</h1>
        <p className="text-gray-500">Nenhuma fazenda encontrada. Configure as variáveis de ambiente e rode o seed.</p>
        <code className="text-sm bg-gray-100 px-3 py-2 rounded">npm run seed</code>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <CustomHeader farm={farm} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          females={filteredFemalesMatching}
          selectedFemale={selectedFemale}
          onSelectFemale={setSelectedFemale}
          allBulls={bulls}
          tank={filteredTank}
          tankBulls={filteredTankBulls}
          farmId={farm.id}
          onAddToTank={(bullDbId, doses, price) => addToTank(farm.id, bullDbId, doses, price)}
          onRemoveFromTank={removeFromTank}
          onUpdateTank={updateTankEntry}
          bullRows={bullRows}
          weights={weights}
          onWeightsChange={setWeights}
          activePreset={activePreset}
          onApplyPreset={handleApplyPreset}
          onSavePreset={savePreset}
          customPresets={presets}
          maxInb={maxInb}
          onMaxInbChange={setMaxInb}
          a2a2Only={a2a2Only}
          onA2a2Change={setA2a2Only}
          tankOnly={tankOnly}
          onTankOnlyChange={setTankOnly}
          useRel={useRel}
          onUseRelChange={setUseRel}
          bullTypeFilter={bullTypeFilter}
          onBullTypeFilterChange={setBullTypeFilter}
          selectedCategories={selectedCategories}
          onSelectedCategoriesChange={setSelectedCategories}
        />
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'matching' && (
            <MatchingTab
              female={selectedFemale}
              allBulls={filteredBulls}
              tankBulls={filteredTankBulls}
              weights={weights}
              maxInb={maxInb}
              a2a2Only={a2a2Only}
              tankOnly={tankOnly}
              useRel={useRel}
              farmId={farm.id}
              bullRows={bullRows}
              femaleRows={femaleRows}
              onNavigate={setActiveTab}
              assignments={assignments}
            />
          )}
          {activeTab === 'mating-plan' && (
            <MatingPlanTab
              females={filteredFemalesMatching}
              allBulls={filteredBulls}
              tankBulls={filteredTankBulls}
              tank={filteredTank}
              weights={weights}
              maxInb={maxInb}
              a2a2Only={a2a2Only}
              useRel={useRel}
              farmId={farm.id}
              farmName={farm.name}
              bullRows={bullRows}
              femaleRows={femaleRows}
              onUpdateTank={updateTankEntry}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'primiparous' && (
            <PrimiparousTab
              females={females}
              femaleRows={femaleRows}
              allBulls={filteredBulls}
              tankBulls={filteredTankBulls}
              weights={weights}
              maxInb={maxInb}
              a2a2Only={a2a2Only}
              useRel={useRel}
              farmId={farm.id}
              bullRows={bullRows}
              onReloadFemales={reloadFemales}
              assignments={assignments}
            />
          )}
          {activeTab === 'herd-strategy' && (
            <HerdStrategyTab
              females={females}
              femaleRows={femaleRows}
              allBulls={filteredBulls}
              weights={weights}
              farmId={farm.id}
            />
          )}
          {activeTab === 'catalog' && (
            <CatalogTab
              allBulls={bulls}
              tankBulls={tankBulls}
              bullRows={bullRows}
              farmId={farm.id}
              onUpdatePrice={updateBullPrice}
              onAddBull={addCustomBull}
              onUpsertBull={upsertBull}
            />
          )}
          {activeTab === 'females-catalog' && (
            <FemalesCatalogTab
              females={catalogFemales}
              femaleRows={catalogFemaleRows}
              onSelectFemale={setSelectedFemale}
              onTabChange={setActiveTab}
            />
          )}
          {activeTab === 'herd' && (
            <HerdTab
              females={females}
              femaleRows={femaleRows}
              allBulls={bulls}
              farmId={farm.id}
              onUpsert={upsertFemale}
              onDelete={deleteFemale}
              onSelectFemale={setSelectedFemale}
              onTabChange={setActiveTab}
              onUpdateCategories={updateFemaleCategories}
              onUpdateNotes={updateFemaleNotes}
              viewMode="register"
            />
          )}
          {activeTab === 'manage-herd' && (
            <HerdTab
              females={females}
              femaleRows={femaleRows}
              allBulls={bulls}
              farmId={farm.id}
              onUpsert={upsertFemale}
              onDelete={deleteFemale}
              onSelectFemale={setSelectedFemale}
              onTabChange={setActiveTab}
              onUpdateCategories={updateFemaleCategories}
              onUpdateNotes={updateFemaleNotes}
              viewMode="manage"
            />
          )}
          {activeTab === 'meta-search' && (
            <MetaSearchTab
              females={females}
              allBulls={bulls}
              tankBulls={tankBulls}
              weights={weights}
              farmId={farm.id}
            />
          )}
          {activeTab === 'history' && <HistoryTab farmId={farm.id} />}
        </main>
      </div>
    </div>
  );
}

// Shell da rota /app — o roteamento entre páginas é do Next (src/app/).
// O antigo DemoApp (NEXT_PUBLIC_DEMO_MODE) foi removido na Fase 3; a
// experiência de demonstração é a conta demo@gmail.com, servida pela API.
export default function AppShell() {
  return (
    <AuthGuard>
      <SupabaseApp />
    </AuthGuard>
  );
}
