import { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, Trash2, ChevronDown, ChevronUp, Sliders, FlaskConical,
} from 'lucide-react';
import type { Bull, Female, WeightMap } from '../../lib/matching';
import type { TankEntry } from '../../hooks/useTank';
import { PRESETS, fmt, inbClass } from '../../lib/matching';

interface Props {
  females: Female[];
  selectedFemale: Female | null;
  onSelectFemale: (f: Female) => void;
  allBulls: Bull[];
  tank: TankEntry[];
  tankBulls: Bull[];
  farmId: string;
  onAddToTank: (bullDbId: string, doses?: number, price?: number) => Promise<unknown>;
  onRemoveFromTank: (tankId: string) => Promise<unknown>;
  onUpdateTank: (tankId: string, doses: number | null, price: number | null) => Promise<unknown>;
  bullRows: import('../../lib/supabase').BullRow[];
  weights: WeightMap;
  onWeightsChange: (w: WeightMap) => void;
  activePreset: string;
  onApplyPreset: (name: string) => void;
  onSavePreset: (name: string) => Promise<unknown>;
  customPresets: { id: string; name: string }[];
  // filter state
  maxInb: number;
  onMaxInbChange: (v: number) => void;
  a2a2Only: boolean;
  onA2a2Change: (v: boolean) => void;
  tankOnly: boolean;
  onTankOnlyChange: (v: boolean) => void;
  useRel: boolean;
  onUseRelChange: (v: boolean) => void;
}

const WEIGHT_KEYS: { key: keyof WeightMap; label: string }[] = [
  { key: 'gtpi', label: 'GTPI' },
  { key: 'net_merit', label: 'NM$' },
  { key: 'milk', label: 'Leite' },
  { key: 'protein', label: 'Proteína' },
  { key: 'fat', label: 'Gordura' },
  { key: 'productive_life', label: 'Vida Produtiva' },
  { key: 'scs', label: 'SCS' },
  { key: 'dpr', label: 'DPR' },
  { key: 'fertility_index', label: 'Fertilidade' },
  { key: 'udc', label: 'UDC' },
  { key: 'flc', label: 'FLC' },
  { key: 'feed_saved', label: 'Feed Saved' },
];

export function Sidebar({
  females, selectedFemale, onSelectFemale,
  allBulls, tank, tankBulls, farmId,
  onAddToTank, onRemoveFromTank, onUpdateTank, bullRows,
  weights, onWeightsChange, activePreset, onApplyPreset, onSavePreset, customPresets,
  maxInb, onMaxInbChange, a2a2Only, onA2a2Change,
  tankOnly, onTankOnlyChange, useRel, onUseRelChange,
}: Props) {
  const [femaleSearch, setFemaleSearch] = useState('');
  const [showFemaleList, setShowFemaleList] = useState(false);
  const [bullSearch, setBullSearch] = useState('');
  const [showBullDropdown, setShowBullDropdown] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [presetName, setPresetName] = useState('');
  const femaleRef = useRef<HTMLDivElement>(null);
  const bullRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (femaleRef.current && !femaleRef.current.contains(e.target as Node)) setShowFemaleList(false);
      if (bullRef.current && !bullRef.current.contains(e.target as Node)) setShowBullDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredFemales = females.filter(f =>
    f.id.toLowerCase().includes(femaleSearch.toLowerCase())
  ).slice(0, 50);

  const filteredBulls = allBulls.filter(b =>
    (b.code.toLowerCase().includes(bullSearch.toLowerCase()) ||
      (b.name ?? '').toLowerCase().includes(bullSearch.toLowerCase())) &&
    !tankBulls.some(t => t.code === b.code)
  ).slice(0, 30);

  async function handleAddBull(bull: Bull) {
    const dbRow = bullRows.find(r => r.code === bull.code);
    if (!dbRow) return;
    setBullSearch('');
    setShowBullDropdown(false);
    await onAddToTank(dbRow.id);
  }

  const allPresets = [
    ...Object.keys(PRESETS),
    ...customPresets.map(p => p.name),
  ];

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-gray-200 overflow-y-auto flex flex-col gap-0">

      {/* ── Selecionar Fêmea ── */}
      <section className="p-4 border-b border-gray-100">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Selecionar Fêmea</h3>
        <div className="relative" ref={femaleRef}>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              value={femaleSearch}
              onChange={e => { setFemaleSearch(e.target.value); setShowFemaleList(true); }}
              onFocus={() => setShowFemaleList(true)}
              placeholder="Buscar por ID…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-mid"
            />
          </div>
          {showFemaleList && (
            <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto text-sm">
              {filteredFemales.length === 0 && (
                <li className="px-3 py-2 text-gray-400">Nenhuma fêmea encontrada</li>
              )}
              {filteredFemales.map(f => (
                <li
                  key={f.id}
                  onClick={() => { onSelectFemale(f); setFemaleSearch(f.id); setShowFemaleList(false); }}
                  className={`px-3 py-1.5 cursor-pointer hover:bg-blue-50 ${selectedFemale?.id === f.id ? 'bg-blue-50 font-medium' : ''}`}
                >
                  {f.id}
                  {f.lact !== null && f.lact !== undefined && (
                    <span className="ml-1 text-gray-400">· L{f.lact}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedFemale && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-blue-dark">{selectedFemale.id}</div>
            <div className="grid grid-cols-2 gap-x-2 text-gray-600">
              <span>Raça: <b>{selectedFemale.breed ?? '—'}</b></span>
              <span>Lact: <b>{selectedFemale.lact ?? '—'}</b></span>
              <span>NM$: <b>{fmt(selectedFemale.net_merit, 0)}</b></span>
              <span>Leite: <b>{fmt(selectedFemale.milk, 0)}</b></span>
              {selectedFemale.ginb != null && (
                <span className={`col-span-2 ${inbClass(selectedFemale.ginb).cls}`}>
                  Inb: <b>{(selectedFemale.ginb as number).toFixed(1)}%</b>
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Botijão ── */}
      <section className="p-4 border-b border-gray-100">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Botijão ({tank.length} touros)
        </h3>

        <div className="relative mb-2" ref={bullRef}>
          <div className="relative">
            <Plus size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              value={bullSearch}
              onChange={e => { setBullSearch(e.target.value); setShowBullDropdown(true); }}
              onFocus={() => setShowBullDropdown(true)}
              placeholder="Adicionar touro…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
            />
          </div>
          {showBullDropdown && bullSearch && (
            <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto text-xs">
              {filteredBulls.length === 0 && (
                <li className="px-3 py-2 text-gray-400">Nenhum touro encontrado</li>
              )}
              {filteredBulls.map(b => (
                <li
                  key={b.code}
                  onClick={() => handleAddBull(b)}
                  className="px-3 py-1.5 cursor-pointer hover:bg-amber-50 flex justify-between"
                >
                  <span className="font-medium">{b.code}</span>
                  <span className="text-gray-500">{b.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {tank.map(entry => (
            <div key={entry.tankId} className="flex items-center gap-1 p-1.5 bg-gray-50 rounded text-xs">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{entry.bull.code}</div>
                <div className="text-gray-500 truncate">{entry.bull.name}</div>
              </div>
              <input
                type="number"
                placeholder="doses"
                defaultValue={entry.doses ?? ''}
                onBlur={e => onUpdateTank(entry.tankId, e.target.value ? +e.target.value : null, entry.pricePerDose)}
                className="w-12 px-1 py-0.5 border border-gray-200 rounded text-center"
              />
              <input
                type="number"
                placeholder="R$"
                defaultValue={entry.pricePerDose ?? ''}
                onBlur={e => onUpdateTank(entry.tankId, entry.doses, e.target.value ? +e.target.value : null)}
                className="w-14 px-1 py-0.5 border border-gray-200 rounded text-center"
              />
              <button onClick={() => onRemoveFromTank(entry.tankId)} className="text-red-400 hover:text-red-600">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Filtros ── */}
      <section className="p-4 border-b border-gray-100">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1">
          <Sliders size={12} /> Filtros de Matching
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <label className="flex justify-between text-xs text-gray-600 mb-1">
              Consanguinidade máx.
              <span className={`font-semibold ${inbClass(maxInb).cls}`}>{maxInb.toFixed(1)}%</span>
            </label>
            <input
              type="range" min={0} max={10} step={0.5} value={maxInb}
              onChange={e => onMaxInbChange(+e.target.value)}
              className="w-full accent-blue-mid"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={a2a2Only} onChange={e => onA2a2Change(e.target.checked)} className="accent-blue-mid" />
            <span className="text-xs">A2A2 only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={tankOnly} onChange={e => onTankOnlyChange(e.target.checked)} className="accent-blue-mid" />
            <span className="text-xs">Apenas botijão</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useRel} onChange={e => onUseRelChange(e.target.checked)} className="accent-blue-mid" />
            <span className="text-xs">Usar REL%</span>
          </label>
        </div>
      </section>

      {/* ── Pesos ── */}
      <section className="p-4">
        <button
          onClick={() => setShowWeights(v => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2"
        >
          <span className="flex items-center gap-1"><FlaskConical size={12} /> Pesos dos Índices</span>
          {showWeights ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Presets */}
        <div className="flex flex-wrap gap-1 mb-3">
          {allPresets.map(name => (
            <button
              key={name}
              onClick={() => onApplyPreset(name)}
              className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                activePreset === name
                  ? 'bg-blue-mid text-white border-blue-mid'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-mid'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {showWeights && (
          <div className="space-y-2">
            {WEIGHT_KEYS.map(({ key, label }) => (
              <div key={key}>
                <label className="flex justify-between text-xs text-gray-600 mb-0.5">
                  {label}
                  <span className="font-medium text-blue-mid">{(weights[key] ?? 0).toFixed(2)}</span>
                </label>
                <input
                  type="range" min={0} max={3} step={0.05}
                  value={weights[key] ?? 0}
                  onChange={e => onWeightsChange({ ...weights, [key]: +e.target.value })}
                  className="w-full accent-blue-mid"
                />
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <input
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                placeholder="Nome do preset"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              />
              <button
                onClick={() => { if (presetName.trim()) { onSavePreset(presetName.trim()); setPresetName(''); } }}
                className="px-3 py-1 bg-gold text-white text-xs rounded hover:opacity-90"
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}
