import { Dna } from 'lucide-react';
import type { FarmRow } from '../../lib/supabase';

interface Props {
  farm: FarmRow | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'matching', label: 'Matching Individual' },
  { id: 'mating-plan', label: 'Plano de Acasalamento' },
  { id: 'full-analysis', label: 'Análise Completa' },
  { id: 'primiparous', label: 'Primíparas' },
  { id: 'catalog', label: 'Catálogo de Touros' },
  { id: 'females-catalog', label: 'Catálogo de Fêmeas' },
  { id: 'herd', label: 'Rebanho' },
  { id: 'meta-search', label: 'Busca por Meta' },
  { id: 'history', label: 'Histórico' },
];

export function Header({ farm, activeTab, onTabChange }: Props) {
  return (
    <header className="bg-[#1B3A5C] text-white shadow-lg">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/10">
        <Dna size={28} className="text-[#C9A84C]" />
        <div>
          <h1 className="text-xl font-bold tracking-tight">Genefy</h1>
          <p className="text-xs text-white/60">
            {farm ? `${farm.name}` : 'Carregando...'}
          </p>
        </div>
      </div>
      <nav className="flex overflow-x-auto px-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#C9A84C] text-[#C9A84C]'
                : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
