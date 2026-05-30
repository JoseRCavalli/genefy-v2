import { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { MatchingTab } from '../components/matching/MatchingTab';
import { MatingPlanTab } from '../components/mating-plan/MatingPlanTab';
import { FullAnalysisTab } from '../components/full-analysis/FullAnalysisTab';
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

import {
  useDemoBulls, useDemoFemales, useDemoTank, useDemoWeights, DEMO_FARM,
} from '../hooks/useDemo';

import type { Female } from '../lib/matching';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

// ── Demo wrapper ──────────────────────────────────────────────────────────────
function DemoApp() {
  const [activeTab, setActiveTab] = useState('matching');
  const [selectedFemale, setSelectedFemale] = useState<Female | null>(null);
  const [maxInb, setMaxInb] = useState(6.25);
  const [a2a2Only, setA2a2Only] = useState(false);
  const [tankOnly, setTankOnly] = useState(false);
  const [useRel, setUseRel] = useState(true);
  const [bullTypeFilter, setBullTypeFilter] = useState('all');

  const { bulls, bullRows, addCustomBull, updateBullPrice } = useDemoBulls();
  const { females, femaleRows, reload: reloadFemales, upsertFemale, setPrimiparous, deleteFemale } = useDemoFemales();
  const { tank, tankBulls, addToTank, removeFromTank, updateTankEntry } = useDemoTank(bulls);
  const { weights, setWeights, presets, activePreset, setActivePreset, applyPreset, savePreset } = useDemoWeights();

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

  const farm = DEMO_FARM;
  const { assignments } = useHerdStrategy(farm.id, females, femaleRows, weights);

  function handleApplyPreset(name: string) {
    if (name === 'Personalizado') { setActivePreset('Personalizado'); return; }
    applyPreset(name);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header farm={farm} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Demo banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-700 flex items-center gap-2">
        <span>🧪 <strong>Modo Demo</strong> — dados locais (376 touros CDCB + 469 fêmeas Granja Cavalli). Salvamentos ficam no localStorage.</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          females={females}
          selectedFemale={selectedFemale}
          onSelectFemale={setSelectedFemale}
          allBulls={bulls}
          tank={filteredTank}
          tankBulls={filteredTankBulls}
          farmId={farm.id}
          onAddToTank={(bullCode, doses, price) => addToTank(farm.id, bullCode, doses, price)}
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
              females={females}
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
          {activeTab === 'full-analysis' && (
            <FullAnalysisTab
              females={females}
              allBulls={filteredBulls}
              tankBulls={filteredTankBulls}
              tank={filteredTank}
              weights={weights}
              maxInb={maxInb}
              a2a2Only={a2a2Only}
              useRel={useRel}
              farmId={farm.id}
              bullRows={bullRows}
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
              onTogglePrimiparous={setPrimiparous}
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
            />
          )}
          {activeTab === 'females-catalog' && (
            <FemalesCatalogTab
              females={females}
              femaleRows={femaleRows}
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
            />
          )}
          {activeTab === 'meta-search' && (
            <MetaSearchTab
              females={females}
              allBulls={bulls}
              tankBulls={tankBulls}
              weights={weights}
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab farmId={farm.id} demoMode />
          )}
        </main>
      </div>
    </div>
  );
}

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
  const { bulls, bullRows, addCustomBull, updateBullPrice } = useBulls(farm?.id);
  const { females, femaleRows, reload: reloadFemales, upsertFemale, setPrimiparous, deleteFemale } = useFemales(farm?.id);
  const { tank, tankBulls, addToTank, removeFromTank, updateTankEntry } = useTank(farm?.id, bulls);
  const { weights, setWeights, presets, activePreset, setActivePreset, applyPreset, savePreset } = useWeights(farm?.id);
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
    return (
      <div className="flex items-center justify-center h-screen bg-[#1B3A5C] text-white text-lg">
        Carregando Genefy…
      </div>
    );
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
      <Header farm={farm} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          females={females}
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
              females={females}
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
          {activeTab === 'full-analysis' && (
            <FullAnalysisTab
              females={females}
              allBulls={filteredBulls}
              tankBulls={filteredTankBulls}
              tank={filteredTank}
              weights={weights}
              maxInb={maxInb}
              a2a2Only={a2a2Only}
              useRel={useRel}
              farmId={farm.id}
              bullRows={bullRows}
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

            />
          )}
          {activeTab === 'females-catalog' && (
            <FemalesCatalogTab
              females={females}
              femaleRows={femaleRows}
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
            />
          )}
          {activeTab === 'meta-search' && (
            <MetaSearchTab
              females={females}
              allBulls={bulls}
              tankBulls={tankBulls}
              weights={weights}
            />
          )}
          {activeTab === 'history' && <HistoryTab farmId={farm.id} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return IS_DEMO ? <DemoApp /> : <SupabaseApp />;
}
