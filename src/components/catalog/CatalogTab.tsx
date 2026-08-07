import { useState, useMemo, Fragment } from 'react';
import { Search, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Plus, X, BarChart2, Sliders } from 'lucide-react';
import type { Bull } from '../../lib/matching';
import { getCarrierHaplotypes, fmt } from '../../lib/matching';
import type { BullRow } from '../../lib/supabase';
import { BullProfileModal } from './BullProfileModal';

interface Props {
  allBulls: Bull[];
  tankBulls: Bull[];
  bullRows: BullRow[];
  farmId: string;
  onUpdatePrice: (code: string, price: number) => Promise<unknown>;
  onAddBull: (farmId: string, bull: Omit<BullRow, 'id' | 'created_at' | 'farm_id'>) => Promise<unknown>;
  onUpsertBull?: (farmId: string, bull: Partial<BullRow> & { code: string }) => Promise<unknown>;
}

const HH_OPTIONS = [
  { value: 'Free', label: '✅ Livre' },
  { value: 'Carrier', label: '⚠️ Portador' },
  { value: '', label: '❓ N/A' },
];

const EMPTY_FORM = {
  code: '', short_name: '', full_name: '',
  gtpi: '', net_merit: '', milk: '', protein: '', fat: '',
  productive_life: '', scs: '', dpr: '', hcr: '', ccr: '',
  fertility_index: '', ptat: '', udc: '', flc: '',
  feed_saved: '', gfi: '', cow_livability: '', sire_calving_ease: '',
  reliability: '', price_per_dose: '',
  beta_casein: '', kappa_casein: '',
  hh1: 'Free', hh2: 'Free', hh3: 'Free', hh4: 'Free', hh5: 'Free', hh6: 'Free',
};

type FormKey = keyof typeof EMPTY_FORM;

function numOrNull(v: string) { return v.trim() === '' ? null : parseFloat(v); }

export function CatalogTab({ allBulls, tankBulls, bullRows, farmId, onUpdatePrice, onAddBull, onUpsertBull }: Props) {
  const [search, setSearch] = useState('');
  const [tankOnly, setTankOnly] = useState(false);
  const [a2a2Only, setA2a2Only] = useState(false);
  const [hhFreeOnly, setHhFreeOnly] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState('');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [profileBull, setProfileBull] = useState<Bull | null>(null);
  const [editingBullCode, setEditingBullCode] = useState<string | null>(null);

  const tankCodes = new Set(tankBulls.map(b => b.code));

  const catalogOptions = useMemo(() => {
    const seen = new Set<string>();
    allBulls.forEach(b => { if (b.catalog) seen.add(b.catalog); });
    return Array.from(seen).sort();
  }, [allBulls]);

  const filtered = useMemo(() => {
    return allBulls.filter(b => {
      if (search && !b.code.toLowerCase().includes(search.toLowerCase()) &&
        !(b.name ?? '').toLowerCase().includes(search.toLowerCase()) &&
        !(b.short_name ?? '').toLowerCase().includes(search.toLowerCase()) &&
        !(b.full_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      if (tankOnly && !tankCodes.has(b.code)) return false;
      if (a2a2Only && b.beta_casein !== 'A2A2') return false;
      if (hhFreeOnly && getCarrierHaplotypes(b).length > 0) return false;
      if (catalogFilter && (b.catalog ?? 'CDCB') !== catalogFilter) return false;
      return true;
    });
  }, [allBulls, search, tankOnly, a2a2Only, hhFreeOnly, catalogFilter, tankCodes]);

  function setField(key: FormKey, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setFormError('');
  }

  function startEditPrice(bull: Bull) {
    setEditingPrice(bull.code);
    setPriceValue(bull.price_per_dose != null ? String(bull.price_per_dose) : '');
  }

  async function commitPrice(code: string) {
    const val = parseFloat(priceValue);
    if (!isNaN(val)) await onUpdatePrice(code, val);
    setEditingPrice(null);
  }

  function handleStartEditBull(bull: Bull) {
    setEditingBullCode(bull.code);
    setForm({
      code: bull.code,
      short_name: bull.name ?? bull.short_name ?? '',
      full_name: bull.full_name ?? '',
      gtpi: bull.gtpi != null ? String(bull.gtpi) : '',
      net_merit: bull.net_merit != null ? String(bull.net_merit) : '',
      milk: bull.milk != null ? String(bull.milk) : '',
      protein: bull.protein != null ? String(bull.protein) : '',
      fat: bull.fat != null ? String(bull.fat) : '',
      productive_life: bull.productive_life != null ? String(bull.productive_life) : '',
      scs: bull.scs != null ? String(bull.scs) : '',
      dpr: bull.dpr != null ? String(bull.dpr) : '',
      hcr: bull.hcr != null ? String(bull.hcr) : '',
      ccr: bull.ccr != null ? String(bull.ccr) : '',
      fertility_index: bull.fertility_index != null ? String(bull.fertility_index) : '',
      ptat: bull.ptat != null ? String(bull.ptat) : '',
      udc: bull.udc != null ? String(bull.udc) : '',
      flc: bull.flc != null ? String(bull.flc) : '',
      feed_saved: bull.feed_saved != null ? String(bull.feed_saved) : '',
      gfi: bull.gfi != null ? String(bull.gfi) : '',
      cow_livability: bull.cow_livability != null ? String(bull.cow_livability) : '',
      sire_calving_ease: bull.sire_calving_ease != null ? String(bull.sire_calving_ease) : '',
      reliability: bull.reliability != null ? String(bull.reliability) : '',
      price_per_dose: bull.price_per_dose != null ? String(bull.price_per_dose) : '',
      beta_casein: bull.beta_casein ?? '',
      kappa_casein: bull.kappa_casein ?? '',
      hh1: bull.HH1 || 'Free',
      hh2: bull.HH2 || 'Free',
      hh3: bull.HH3 || 'Free',
      hh4: bull.HH4 || 'Free',
      hh5: bull.HH5 || 'Free',
      hh6: bull.HH6 || 'Free',
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) { setFormError('Código NAAB é obrigatório.'); return; }
    if (!form.gtpi.trim()) { setFormError('GTPI é obrigatório.'); return; }

    if (!editingBullCode) {
      const existing = allBulls.find(b => b.code === form.code.trim().toUpperCase());
      if (existing) { setFormError(`Código ${form.code} já existe no catálogo.`); return; }
    }

    setSaving(true);
    const bullData = {
      code: form.code.trim().toUpperCase(),
      short_name: form.short_name || null,
      full_name: form.full_name || null,
      gtpi: numOrNull(form.gtpi) as number | null,
      net_merit: numOrNull(form.net_merit),
      gfi: numOrNull(form.gfi),
      reliability: numOrNull(form.reliability),
      milk: numOrNull(form.milk),
      protein: numOrNull(form.protein),
      fat: numOrNull(form.fat),
      productive_life: numOrNull(form.productive_life),
      scs: numOrNull(form.scs),
      dpr: numOrNull(form.dpr),
      hcr: numOrNull(form.hcr),
      ccr: numOrNull(form.ccr),
      fertility_index: numOrNull(form.fertility_index),
      ptat: numOrNull(form.ptat),
      udc: numOrNull(form.udc),
      flc: numOrNull(form.flc),
      feed_saved: numOrNull(form.feed_saved),
      cow_livability: numOrNull(form.cow_livability),
      sire_calving_ease: numOrNull(form.sire_calving_ease),
      beta_casein: form.beta_casein || null,
      kappa_casein: form.kappa_casein || null,
      hh1: form.hh1 || 'Free',
      hh2: form.hh2 || 'Free',
      hh3: form.hh3 || 'Free',
      hh4: form.hh4 || 'Free',
      hh5: form.hh5 || 'Free',
      hh6: form.hh6 || 'Free',
      price_per_dose: numOrNull(form.price_per_dose),
      is_custom: true,
      source: editingBullCode ? (allBulls.find(b => b.code === editingBullCode)?._custom ? 'MANUAL' : 'CDCB') : 'MANUAL',
    };

    let err;
    if (editingBullCode) {
      if (onUpsertBull) {
        err = await onUpsertBull(farmId, bullData);
      } else {
        err = new Error("Função de atualização de touros não disponível.");
      }
    } else {
      err = await onAddBull(farmId, bullData);
    }

    setSaving(false);
    if (err) { setFormError((err as { message: string }).message || String(err)); return; }
    setShowModal(false);
    setForm({ ...EMPTY_FORM });
    setEditingBullCode(null);
  }


  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-blue-dark">Catálogo de Touros</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingBullCode(null); setShowModal(true); setForm({ ...EMPTY_FORM }); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-white text-sm rounded-lg hover:opacity-90"
          >
            <Plus size={14} /> Adicionar Touro
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código ou nome…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-mid"
          />
        </div>
        {[
          { label: 'Apenas botijão', val: tankOnly, set: setTankOnly },
          { label: 'A2A2', val: a2a2Only, set: setA2a2Only },
          { label: 'HH Livre', val: hhFreeOnly, set: setHhFreeOnly },
        ].map(f => (
          <label key={f.label} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={f.val} onChange={e => f.set(e.target.checked)} className="accent-blue-mid" />
            {f.label}
          </label>
        ))}
        <select
          value={catalogFilter}
          onChange={e => setCatalogFilter(e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none"
        >
          <option value="">Todos os catálogos</option>
          {catalogOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} touros</span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#1B3A5C] text-white text-xs">
            <tr>
              <th className="px-3 py-3 text-left w-6"></th>
              <th className="px-3 py-3 text-left">Código</th>
              <th className="px-3 py-3 text-left">Nome</th>
              <th className="px-3 py-3 text-center">GTPI</th>
              <th className="px-3 py-3 text-center">NM$</th>
              <th className="px-3 py-3 text-center">Leite</th>
              <th className="px-3 py-3 text-center">Prot.</th>
              <th className="px-3 py-3 text-center">SCS</th>
              <th className="px-3 py-3 text-center">DPR</th>
              <th className="px-3 py-3 text-center">REL%</th>
              <th className="px-3 py-3 text-center">Caseína</th>
              <th className="px-3 py-3 text-center">HH</th>
              <th className="px-3 py-3 text-center">Preço/Dose</th>
              <th className="px-3 py-3 text-center">Origem</th>
              <th className="px-3 py-3 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(bull => {
              const isExpanded = expandedCode === bull.code;
              const isCustom = bull._custom;
              const inTank = tankCodes.has(bull.code);
              const carriers = getCarrierHaplotypes(bull);

              return (
                <Fragment key={bull.code}>
                  <tr
                    className={`hover:bg-gray-50 cursor-pointer ${inTank ? 'bg-amber-50/40' : ''}`}
                    onClick={() => setExpandedCode(isExpanded ? null : bull.code)}
                  >
                    <td className="px-3 py-2 text-center text-gray-400">
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold text-blue-dark">{bull.code}</td>
                    <td className="px-3 py-2 max-w-[180px] truncate text-gray-700">{bull.name ?? bull.short_name}</td>
                    <td className="px-3 py-2 text-center font-semibold">{bull.gtpi ?? '—'}</td>
                    <td className="px-3 py-2 text-center">{fmt(bull.net_merit, 0)}</td>
                    <td className="px-3 py-2 text-center">{fmt(bull.milk, 0)}</td>
                    <td className="px-3 py-2 text-center">{fmt(bull.protein, 1)}</td>
                    <td className="px-3 py-2 text-center">{fmt(bull.scs, 2)}</td>
                    <td className="px-3 py-2 text-center">{fmt(bull.dpr, 1)}</td>
                    <td className="px-3 py-2 text-center">{bull.reliability != null ? `${bull.reliability}%` : '—'}</td>
                    <td className="px-3 py-2 text-center text-xs">
                      {bull.beta_casein && <span className="px-1 bg-blue-50 text-blue-700 rounded">{bull.beta_casein}</span>}
                      {bull.kappa_casein && <span className="ml-1 px-1 bg-purple-50 text-purple-700 rounded">{bull.kappa_casein}</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {carriers.length === 0
                        ? <CheckCircle size={14} className="text-green-600 mx-auto" />
                        : <AlertTriangle size={14} className="text-red-500 mx-auto" />}
                    </td>
                    <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                      {editingPrice === bull.code ? (
                        <input
                          autoFocus
                          type="number"
                          value={priceValue}
                          onChange={e => setPriceValue(e.target.value)}
                          onBlur={() => commitPrice(bull.code)}
                          onKeyDown={e => e.key === 'Enter' && commitPrice(bull.code)}
                          className="w-16 px-1 py-0.5 border border-blue-mid rounded text-center text-xs"
                        />
                      ) : (
                        <button onClick={() => startEditPrice(bull)} className="text-amber-600 hover:underline text-xs">
                          {bull.price_per_dose != null ? `R$ ${bull.price_per_dose}` : '—'}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        bull.catalog === 'Select Sires' ? 'bg-green-100 text-green-700' :
                        isCustom && !bull.catalog ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {bull.catalog ?? (isCustom ? 'MANUAL' : 'CDCB')}
                      </span>
                    </td>
                    {/* Ação */}
                    <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setProfileBull(bull)}
                          title="Ver índices completos"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 8px', fontSize: '11px',
                            fontFamily: "'Inter', sans-serif", fontWeight: 600,
                            letterSpacing: '0.02em', color: '#1B3A5C',
                            background: 'rgba(30,58,92,0.07)',
                            border: '1px solid rgba(30,58,92,0.18)',
                            borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,58,92,0.13)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(30,58,92,0.07)')}
                        >
                          <BarChart2 size={10} />
                          Índices
                        </button>
                        <button
                          onClick={() => handleStartEditBull(bull)}
                          title="Editar índices do touro"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 8px', fontSize: '11px',
                            fontFamily: "'Inter', sans-serif", fontWeight: 600,
                            letterSpacing: '0.02em', color: '#B45309',
                            background: 'rgba(180,83,9,0.07)',
                            border: '1px solid rgba(180,83,9,0.18)',
                            borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(180,83,9,0.13)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(180,83,9,0.07)')}
                        >
                          <Sliders size={10} />
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${bull.code}-exp`} className="bg-blue-50/30">
                      <td colSpan={14} className="px-6 py-3">
                        <div className="grid grid-cols-4 gap-x-6 gap-y-1 text-xs text-gray-600">
                          <span>PL: <b>{fmt(bull.productive_life, 1)}</b></span>
                          <span>HCR: <b>{fmt(bull.hcr, 1)}</b></span>
                          <span>CCR: <b>{fmt(bull.ccr, 1)}</b></span>
                          <span>PTAT: <b>{fmt(bull.ptat, 2)}</b></span>
                          <span>UDC: <b>{fmt(bull.udc, 2)}</b></span>
                          <span>FLC: <b>{fmt(bull.flc, 2)}</b></span>
                          <span>Feed Saved: <b>{fmt(bull.feed_saved, 0)}</b></span>
                          <span>GFI: <b>{fmt(bull.gfi, 2)}</b></span>
                          <span>Cow Livability: <b>{fmt(bull.cow_livability, 1)}</b></span>
                          <span>SCE: <b>{fmt(bull.sire_calving_ease, 1)}</b></span>
                          <span>Kappa-Caséina: <b>{bull.kappa_casein ?? '—'}</b></span>
                          {carriers.length > 0 && (
                            <span className="col-span-4 text-red-600">
                              ⚠️ Portador: {carriers.join(', ')}
                            </span>
                          )}
                          {bull.full_name && (
                            <span className="col-span-4 text-gray-500">Nome completo: {bull.full_name}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">Nenhum touro encontrado.</div>
        )}
      </div>

      {/* ── Modal Adicionar Touro ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-blue-dark">
                {editingBullCode ? `Editar Touro ${editingBullCode}` : 'Adicionar Touro Manual'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Identificação */}
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Identificação</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="col-span-1">
                    <label className="text-xs text-gray-500 mb-1 block">Código NAAB *</label>
                    <input value={form.code} onChange={e => setField('code', e.target.value)}
                      placeholder="7HO12345"
                      disabled={!!editingBullCode}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-mid text-sm font-mono disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nome curto</label>
                    <input value={form.short_name} onChange={e => setField('short_name', e.target.value)}
                      placeholder="MADCAP"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-mid text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Preço/dose (R$)</label>
                    <input type="number" value={form.price_per_dose} onChange={e => setField('price_per_dose', e.target.value)}
                      placeholder="200"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-mid text-sm" />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-xs text-gray-500 mb-1 block">Nome completo (opcional)</label>
                  <input value={form.full_name} onChange={e => setField('full_name', e.target.value)}
                    placeholder="Holsteins Madcap-ET"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-mid text-sm" />
                </div>
              </div>

              {/* Índices principais */}
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Índices Principais</p>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  {[
                    { key: 'gtpi', label: 'GTPI *' },
                    { key: 'net_merit', label: 'NM$' },
                    { key: 'gfi', label: 'GFI (%)' },
                    { key: 'reliability', label: 'REL%' },
                    { key: 'milk', label: 'Leite (lbs)' },
                    { key: 'protein', label: 'Proteína (lbs)' },
                    { key: 'fat', label: 'Gordura (lbs)' },
                    { key: 'productive_life', label: 'Vida Produtiva' },
                    { key: 'scs', label: 'SCS' },
                    { key: 'dpr', label: 'DPR' },
                    { key: 'hcr', label: 'HCR' },
                    { key: 'ccr', label: 'CCR' },
                    { key: 'fertility_index', label: 'Fertilidade' },
                    { key: 'udc', label: 'UDC' },
                    { key: 'flc', label: 'FLC' },
                    { key: 'ptat', label: 'PTAT' },
                    { key: 'feed_saved', label: 'Feed Saved' },
                    { key: 'cow_livability', label: 'Cow Livability' },
                    { key: 'sire_calving_ease', label: 'Fac. Parto (SCE)' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                      <input
                        type="number" step="any"
                        value={(form as Record<string, string>)[f.key]}
                        onChange={e => setField(f.key as FormKey, e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-mid text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Caseína */}
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Caseínas</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'beta_casein', label: 'Beta-Caseína', opts: ['', 'A1A1', 'A1A2', 'A2A2'] },
                    { key: 'kappa_casein', label: 'Kappa-Caseína', opts: ['', 'AA', 'AB', 'BB'] },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                      <select
                        value={(form as Record<string, string>)[f.key]}
                        onChange={e => setField(f.key as FormKey, e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none"
                      >
                        {f.opts.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Haplótipos */}
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Haplótipos Letais</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['hh1','hh2','hh3','hh4','hh5','hh6'] as FormKey[]).map(hh => (
                    <div key={hh}>
                      <label className="text-xs text-gray-500 mb-1 block">{hh.toUpperCase()}</label>
                      <select
                        value={form[hh]}
                        onChange={e => setField(hh, e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none"
                      >
                        {HH_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                <strong>Cruzamento automático:</strong> ao salvar, este touro será automaticamente elegível para matching com todas as{' '}
                fêmeas do rebanho, usando os mesmos algoritmos genéticos do sistema (score ponderado, consanguinidade, PPPV).
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">{formError}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-[#C9A84C] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : editingBullCode ? 'Salvar Alterações' : 'Salvar Touro'}
                </button>
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bull profile modal */}
      <BullProfileModal
        bull={profileBull}
        inTank={profileBull ? tankCodes.has(profileBull.code) : false}
        onClose={() => setProfileBull(null)}
      />
    </div>
  );
}
