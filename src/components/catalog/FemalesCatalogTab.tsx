import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Dna, Star, Users, BarChart2, MilkOff, FileText } from 'lucide-react';
import type { Female } from '../../lib/matching';
import { fmt, calcCowRel, monthsToBreeding } from '../../lib/matching';
import type { FemaleRow } from '../../lib/supabase';
import { FemaleProfileModal } from './FemaleProfileModal';

interface Props {
  females: Female[];
  femaleRows: FemaleRow[];
  onSelectFemale: (f: Female) => void;
  onTabChange: (tab: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relBadge(rel: number) {
  if (rel >= 80) return 'bg-purple-100 text-purple-700';
  if (rel >= 70) return 'bg-blue-100 text-blue-700';
  if (rel >= 60) return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-500';
}

function inbBadge(ginb: number | null | undefined) {
  if (ginb == null) return '';
  if (ginb >= 10) return 'text-red-600 font-bold';
  if (ginb >= 7)  return 'text-orange-500 font-semibold';
  return 'text-green-700';
}

function iaBadgeShort(bdate: string | null | undefined): React.ReactNode {
  if (!bdate) return null;
  const m = monthsToBreeding(bdate);
  if (m === null) return null;
  if (m <= 0) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', borderRadius: '3px', fontSize: '9.5px', fontFamily: "'Inter', sans-serif", fontWeight: 600, background: 'rgba(22,163,74,0.10)', color: '#15803d' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
      Pronta
    </span>
  );
  if (m <= 6) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', borderRadius: '3px', fontSize: '9.5px', fontFamily: "'Inter', sans-serif", fontWeight: 600, background: 'rgba(180,83,9,0.10)', color: '#b45309' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#b45309', display: 'inline-block' }} />
      {m}m
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', borderRadius: '3px', fontSize: '9.5px', fontFamily: "'Inter', sans-serif", fontWeight: 600, background: 'rgba(30,58,92,0.07)', color: '#6B7280' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6B7280', display: 'inline-block' }} />
      {m}m
    </span>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────

export function FemalesCatalogTab({ females, femaleRows, onSelectFemale, onTabChange }: Props) {
  const [search, setSearch]           = useState('');
  const [genomicOnly, setGenomicOnly] = useState(false);
  const [primiOnly, setPrimiOnly]     = useState(false);
  const [customOnly, setCustomOnly]   = useState(false);
  const [breedFilter, setBreedFilter] = useState('');
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [profileFemale, setProfileFemale] = useState<Female | null>(null);

  // Mapa rápido: animal_id → FemaleRow (para campos extras como name, bdate)
  const rowMap = useMemo(() =>
    new Map(femaleRows.map(r => [r.animal_id, r])),
  [femaleRows]);

  // Detectar fêmeas "custom" (adicionadas manualmente)
  const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
  const customIds = useMemo(() => {
    if (IS_DEMO) {
      return new Set(
        femaleRows
          .filter(r => r.id.startsWith('female-new-') || !r.id.match(/^female-\d+$/))
          .map(r => r.animal_id)
      );
    }
    return new Set(femaleRows.map(r => r.animal_id));
  }, [femaleRows, IS_DEMO]);

  const breeds = useMemo(() => {
    const s = new Set(females.map(f => f.breed ?? 'HO').filter(Boolean));
    return Array.from(s).sort();
  }, [females]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return females.filter(f => {
      const row = rowMap.get(f.id);
      if (search && !f.id.toLowerCase().includes(q) &&
          !(row?.name ?? '').toLowerCase().includes(q) &&
          !(f.sire_naab ?? '').toLowerCase().includes(q)) return false;
      if (genomicOnly && !f.genomic) return false;
      if (primiOnly   && !f.is_primiparous) return false;
      if (customOnly  && !customIds.has(f.id)) return false;
      if (breedFilter && (f.breed ?? 'HO') !== breedFilter) return false;
      return true;
    });
  }, [females, search, genomicOnly, primiOnly, customOnly, breedFilter, rowMap, customIds]);

  // ── Estatísticas resumo ──
  const stats = useMemo(() => ({
    total: females.length,
    genomic: females.filter(f => f.genomic).length,
    primiparous: females.filter(f => f.is_primiparous).length,
    custom: customIds.size,
    avgNM: (() => {
      const vals = females.map(f => f.net_merit).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    })(),
    avgMilk: (() => {
      const vals = females.map(f => f.milk).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    })(),
  }), [females, customIds]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Users size={20} className="text-blue-600" />
        <h2 className="text-lg font-bold text-blue-900">Catálogo de Fêmeas</h2>
        <span className="text-sm text-gray-400">{females.length} fêmeas no sistema</span>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',          value: stats.total,       cls: 'text-blue-900' },
          { label: 'Com genoma',     value: stats.genomic,     cls: 'text-purple-700' },
          { label: 'Primíparas',     value: stats.primiparous, cls: 'text-pink-600' },
          { label: 'Cadastradas',    value: stats.custom,      cls: 'text-amber-700' },
          {
            label: 'NM$ médio',
            value: stats.avgNM != null ? `$${Math.round(stats.avgNM)}` : '—',
            cls: 'text-green-700',
          },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="text-xs text-gray-400 uppercase">{s.label}</div>
            <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID, nome ou touro pai…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {breeds.length > 1 && (
          <select
            value={breedFilter}
            onChange={e => setBreedFilter(e.target.value)}
            className="px-2 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none"
          >
            <option value="">Todas as raças</option>
            {breeds.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}

        {[
          { label: '🧬 Genoma', val: genomicOnly, set: setGenomicOnly },
          { label: 'Primíparas', val: primiOnly, set: setPrimiOnly },
          { label: '⭐ Cadastradas', val: customOnly, set: setCustomOnly },
        ].map(f => (
          <label key={f.label} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
            <input type="checkbox" checked={f.val} onChange={e => f.set(e.target.checked)} className="accent-blue-600" />
            {f.label === 'Primíparas'
              ? <span className="flex items-center gap-1"><MilkOff size={11} className="text-pink-500" />Primíparas</span>
              : f.label
            }
          </label>
        ))}

        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} de {females.length} fêmeas
        </span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#1B3A5C] text-white text-xs">
            <tr>
              <th className="px-3 py-3 w-6"></th>
              <th className="px-3 py-3 text-left">ID Animal</th>
              <th className="px-3 py-3 text-left">Nome</th>
              <th className="px-3 py-3 text-center">Raça</th>
              <th className="px-3 py-3 text-center">Lact.</th>
              <th className="px-3 py-3 text-center">gINB%</th>
              <th className="px-3 py-3 text-center">NM$</th>
              <th className="px-3 py-3 text-center">Leite</th>
              <th className="px-3 py-3 text-center">DPR</th>
              <th className="px-3 py-3 text-center">SCS</th>
              <th className="px-3 py-3 text-center">Pai (NAAB)</th>
              <th className="px-3 py-3 text-center">REL%</th>
              <th className="px-3 py-3 text-center">IA</th>
              <th className="px-3 py-3 text-center">Flags</th>
              <th className="px-3 py-3 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(f => {
              const isExpanded = expandedId === f.id;
              const row = rowMap.get(f.id);
              const rel = Math.round((f._rel ?? calcCowRel(f)) * 100);
              const isCustom = customIds.has(f.id);
              const ia = iaBadgeShort(row?.bdate ?? f.bdate);
              return (
                <>
                  <tr
                    key={f.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors
                      ${isCustom ? 'bg-amber-50/30' : ''}
                      ${f.is_primiparous ? 'bg-pink-50/20' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  >
                    {/* Expand */}
                    <td className="px-3 py-2 text-center text-gray-400">
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </td>

                    {/* ID */}
                    <td className="px-3 py-2 font-mono font-bold text-blue-900">{f.id}</td>

                    {/* Nome */}
                    <td className="px-3 py-2 text-gray-600 text-xs max-w-[120px] truncate">
                      {row?.name ?? '—'}
                    </td>

                    {/* Raça */}
                    <td className="px-3 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                        {f.breed ?? 'HO'}
                      </span>
                    </td>

                    {/* Lactação */}
                    <td className="px-3 py-2 text-center text-gray-700">{f.lact ?? 0}</td>

                    {/* gINB */}
                    <td className={`px-3 py-2 text-center text-xs ${inbBadge(f.ginb)}`}>
                      {f.ginb != null ? `${f.ginb.toFixed(1)}%` : '—'}
                    </td>

                    {/* NM$ */}
                    <td className="px-3 py-2 text-center text-xs">
                      {f.net_merit != null ? (
                        <span className="font-medium">
                          {f.net_merit >= 0 ? '+' : ''}{fmt(f.net_merit, 0)}
                          {(f as { _est_net_merit?: boolean })._est_net_merit && (
                            <i className="text-gray-400 font-normal"> est.</i>
                          )}
                        </span>
                      ) : '—'}
                    </td>

                    {/* Leite */}
                    <td className="px-3 py-2 text-center text-xs">
                      {f.milk != null ? (
                        <span>
                          {f.milk >= 0 ? '+' : ''}{fmt(f.milk, 0)}
                          {(f as { _est_milk?: boolean })._est_milk && (
                            <i className="text-gray-400"> est.</i>
                          )}
                        </span>
                      ) : '—'}
                    </td>

                    {/* DPR */}
                    <td className="px-3 py-2 text-center text-xs">{fmt(f.dpr, 1)}</td>

                    {/* SCS */}
                    <td className="px-3 py-2 text-center text-xs">{fmt(f.scs, 2)}</td>

                    {/* Pai */}
                    <td className="px-3 py-2 text-center font-mono text-xs text-blue-800">
                      {f.sire_naab ?? '—'}
                    </td>

                    {/* REL% */}
                    <td className="px-3 py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${relBadge(rel)}`}>
                        {rel}%
                      </span>
                    </td>

                    {/* IA badge */}
                    <td className="px-3 py-2 text-center text-xs font-medium">
                      {iaBadgeShort(row?.bdate ?? f.bdate) ?? '—'}
                    </td>

                    {/* Flags */}
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {f.genomic && (
                          <span title="Genoma" className="text-purple-600"><Dna size={12} /></span>
                        )}
                        {f.is_primiparous && (
                          <span title="Primípara" className="text-pink-500 text-[10px] font-bold">1ª</span>
                        )}
                        {isCustom && (
                          <span title="Cadastrada manualmente">
                            <Star size={11} className="text-amber-500" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ação */}
                    <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          onClick={() => setProfileFemale(f)}
                          title="Ver índices completos"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                            color: '#1B3A5C',
                            background: 'rgba(30,58,92,0.07)',
                            border: '1px solid rgba(30,58,92,0.18)',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,58,92,0.13)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(30,58,92,0.07)')}
                        >
                          <BarChart2 size={10} />
                          Índices
                        </button>
                        <button
                          onClick={() => { onSelectFemale(f); onTabChange('matching'); }}
                          className="px-2 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                        >
                          Matching →
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Linha expandida */}
                  {isExpanded && (
                    <tr key={`${f.id}-exp`} className="bg-blue-50/40">
                      <td colSpan={15} className="px-6 py-3">
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-1.5 text-xs text-gray-600">
                          <span>PL: <b>{fmt(f.productive_life, 1)}</b></span>
                          <span>Fat: <b>{fmt(f.fat, 1)}</b></span>
                          <span>Prot: <b>{fmt(f.protein, 1)}</b></span>
                          <span>UDC: <b>{fmt(f.udc, 2)}</b></span>
                          <span>FLC: <b>{fmt(f.flc, 2)}</b></span>
                          <span>Fert.: <b>{fmt(f.fertility_index, 1)}</b></span>
                          {f.mgs_naab && (
                            <span>MGS: <b className="font-mono">{f.mgs_naab}</b></span>
                          )}
                          {f.mmgs_naab && (
                            <span>MMGS: <b className="font-mono">{f.mmgs_naab}</b></span>
                          )}
                          {row?.bdate && (
                            <span>Nascimento: <b>{new Date(row.bdate).toLocaleDateString('pt-BR')}</b></span>
                          )}
                          {row?.dam_id && (
                            <span>Mãe: <b>{row.dam_id}</b></span>
                          )}
                          {(row?.notes || f.notes) && (
                            <div className="col-span-3 md:col-span-6 mt-2 pt-2 border-t border-gray-100 flex items-start gap-1.5 text-gray-400">
                              <FileText size={13} className="shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{row?.notes || f.notes}</span>
                            </div>
                          )}
                          <div className="col-span-3 md:col-span-6 mt-1 flex items-center gap-2 flex-wrap">
                            {f.genomic && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">
                                🧬 Genoma confirmado — REL {rel}%
                              </span>
                            )}
                            {isCustom && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">
                                ⭐ Cadastrada manualmente
                              </span>
                            )}
                            {(f as { _est_milk?: boolean })._est_milk && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
                                Índices estimados (Parent Average)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Nenhuma fêmea encontrada com os filtros aplicados.
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <span><Dna size={11} className="inline text-purple-600" /> = Genoma confirmado</span>
        <span><Star size={11} className="inline text-amber-500" /> = Cadastrada manualmente</span>
        <span><span className="text-pink-500 font-bold">1ª</span> = Primípara</span>
        <span>Pronta para IA · IA em breve · IA futura</span>
        <span><i>est.</i> = valor estimado pelo Parent Average</span>
        <span>gINB% ≥10% = consanguinidade elevada</span>
      </div>

      {/* Female profile modal */}
      <FemaleProfileModal
        female={profileFemale}
        femaleRow={profileFemale ? rowMap.get(profileFemale.id) : undefined}
        onClose={() => setProfileFemale(null)}
        onGoToMatching={() => {
          if (profileFemale) {
            onSelectFemale(profileFemale);
            onTabChange('matching');
          }
        }}
      />
    </div>
  );
}
