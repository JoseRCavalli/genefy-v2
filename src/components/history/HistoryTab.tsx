import { useEffect, useState, useCallback, Fragment } from 'react';
import { CheckCircle, Baby, XCircle, RefreshCw, Trash2, ClipboardList, Syringe, Leaf, AlertOctagon, Circle, Dna, ChevronRight } from 'lucide-react';
import type { MatingRow, FemaleRow, BullRow } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { listDemoMatings, updateDemoMatingStatus, deleteDemoMating } from '../../lib/demo-matings';
import { PerfilProgenieModal } from '../matching/PerfilProgenie';
import { calcularIndicesProgenie } from '../../utils/calcularProgenie';
import type { PerfilProgenieProps } from '../../types/PerfilProgenie.types';

type MatingStatus = MatingRow['status'];

interface Props {
  farmId: string;
}

const STATUS_LABELS: Record<MatingStatus, string> = {
  planned: 'Planejado',
  executed: 'Executado',
  confirmed_pregnant: 'Prenha',
  failed: 'Falhou',
};

const STATUS_COLORS: Record<MatingStatus, string> = {
  planned: 'bg-blue-50 text-blue-700',
  executed: 'bg-amber-50 text-amber-700',
  confirmed_pregnant: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-600',
};

export function HistoryTab({ farmId }: Props) {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@gmail.com';

  const [matings, setMatings] = useState<(MatingRow & { females?: FemaleRow; bulls?: BullRow })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<MatingStatus | ''>('');
  const [filterSexed, setFilterSexed] = useState<'' | 'yes' | 'no'>('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [progenieAberta, setProgenieAberta] = useState<PerfilProgenieProps | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    if (isDemoUser) {
      setMatings(listDemoMatings() as typeof matings);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/matings?farmId=${encodeURIComponent(farmId)}`, { cache: 'no-store' });
      if (res.ok) setMatings((await res.json()) as typeof matings);
    } catch (err) {
      console.error('[HistoryTab] load:', err);
    }
    setLoading(false);
  }, [farmId, isDemoUser]);

  const handleRowClick = (matingId: string) => {
    setExpandedRow(prev => prev === matingId ? null : matingId);
  };

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: MatingStatus) {
    setUpdating(id);
    // Optimistic update
    setMatings(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    if (isDemoUser) {
      updateDemoMatingStatus(id, status);
    } else {
      const res = await fetch(`/api/matings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => null);
      if (!res?.ok) console.error('Erro ao atualizar status do acasalamento');
    }
    setUpdating(null);
    load();
  }

  async function handleStatusChange(mating: typeof matings[0], newStatus: MatingStatus) {
    if (mating.status === 'confirmed_pregnant' && newStatus !== 'confirmed_pregnant') {
      const confirmed = window.confirm(
        `Tem certeza que deseja alterar o status de Prenha para ${STATUS_LABELS[newStatus]}?\nEsta ação pode afetar os relatórios de prenhez.`
      );
      if (!confirmed) return;
    }
    await updateStatus(mating.id, newStatus);
  }

  async function deleteMating(id: string) {
    if (!confirm('Tem certeza que deseja deletar este acasalamento?')) return;
    setUpdating(id);
    if (isDemoUser) {
      deleteDemoMating(id);
    } else {
      await fetch(`/api/matings/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null);
    }
    setUpdating(null);
    load();
  }

  const filtered = matings.filter(m => {
    if (filterStatus && m.status !== filterStatus) return false;
    if (filterSexed === 'yes' && !m.is_sexed_semen) return false;
    if (filterSexed === 'no' && m.is_sexed_semen) return false;
    return true;
  });

  // Summary counts
  const counts = matings.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-blue-dark">Histórico de Acasalamentos</h2>
        <button onClick={load} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-mid">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { status: 'planned' as const,            Icon: ClipboardList,  label: 'Planejados', bg: 'bg-blue-50/50', defaultBorder: 'border-blue-200/60', activeBorder: 'border-blue-600 ring-1 ring-blue-600', iconColor: '#2E6DA4' },
          { status: 'executed' as const,           Icon: Syringe,        label: 'Executados', bg: 'bg-amber-50/50', defaultBorder: 'border-amber-200/60', activeBorder: 'border-amber-500 ring-1 ring-amber-500', iconColor: '#b45309' },
          { status: 'confirmed_pregnant' as const, Icon: Leaf,           label: 'Prenhes',    bg: 'bg-green-50/50', defaultBorder: 'border-green-200/60', activeBorder: 'border-green-600 ring-1 ring-green-600', iconColor: '#15803d' },
          { status: 'failed' as const,             Icon: AlertOctagon,   label: 'Falharam',   bg: 'bg-red-50/50', defaultBorder: 'border-red-200/60', activeBorder: 'border-red-600 ring-1 ring-red-600', iconColor: '#b91c1c' },
        ]).map(card => {
          const isActive = filterStatus === card.status;
          return (
            <div
              key={card.status}
              onClick={() => setFilterStatus(prev => prev === card.status ? '' : card.status)}
              className={`rounded-xl border-2 p-4 transition-all cursor-pointer select-none ${card.bg} ${
                isActive ? card.activeBorder : `${card.defaultBorder} hover:border-gray-300`
              }`}
            >
              <card.Icon size={22} style={{ color: card.iconColor, marginBottom: '6px' }} />
              <div className="text-2xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: card.iconColor }}>{counts[card.status] ?? 0}</div>
              <div className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as MatingStatus | '')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none"
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_LABELS) as MatingStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterSexed}
          onChange={e => setFilterSexed(e.target.value as '' | 'yes' | 'no')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none"
        >
          <option value="">Todos (sêmen)</option>
          <option value="yes">Sexado</option>
          <option value="no">Convencional</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} registros</span>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Carregando…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-[#1B3A5C] text-white text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Fêmea</th>
                <th className="px-4 py-3 text-left">Touro</th>
                <th className="px-4 py-3 text-center">Opção</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-center">Inb.</th>
                <th className="px-4 py-3 text-center">Sêmen</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Data</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(m => (
                <Fragment key={m.id}>
                  <tr
                    onClick={() => handleRowClick(m.id)}
                  className={`hover:bg-gray-50 cursor-pointer select-none transition-all ${
                    expandedRow === m.id ? 'bg-gray-50/80 font-medium' : ''
                  }`}
                >
                  <td className="px-4 py-2 font-medium">
                    <div className="flex items-center gap-1.5">
                      <ChevronRight
                        size={14}
                        className="text-gray-400 transition-transform duration-150"
                        style={{
                          transform: expandedRow === m.id ? 'rotate(90deg)' : 'rotate(0deg)'
                        }}
                      />
                      <span>{m.females?.animal_id ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-blue-dark">{m.bulls?.code ?? '—'}</td>
                  <td className="px-4 py-2 text-center">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '20px', height: '20px', borderRadius: '50%', fontSize: '10px',
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                      background: m.option_rank === 1 ? '#C9A84C' : m.option_rank === 2 ? '#2E6DA4' : 'rgba(30,58,92,0.12)',
                      color: m.option_rank === 1 ? '#fff' : m.option_rank === 2 ? '#fff' : '#1B3A5C',
                    }}>
                      {m.option_rank}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">{m.score?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-2 text-center text-xs">{m.inbreeding_pct != null ? `${m.inbreeding_pct.toFixed(1)}%` : '—'}</td>
                  <td className="px-4 py-2 text-center">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 8px', borderRadius: '3px', fontSize: '10.5px',
                      fontFamily: "'Inter', sans-serif", fontWeight: 600,
                      background: m.is_sexed_semen ? 'rgba(126,34,206,0.10)' : 'rgba(46,109,164,0.10)',
                      color: m.is_sexed_semen ? '#7c3aed' : '#2E6DA4',
                    }}>
                      <Circle size={6} fill="currentColor" strokeWidth={0} />
                      {m.is_sexed_semen ? 'Sexado' : 'Conv.'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={m.status}
                      disabled={updating === m.id}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(m, e.target.value as MatingStatus);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer border border-transparent focus:ring-1 focus:ring-[#1B3A5C] ${STATUS_COLORS[m.status]}`}
                      style={{
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        paddingRight: '18px',
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 4px center',
                        backgroundSize: '10px 10px',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <option value="planned">Planejado</option>
                      <option value="executed">Executado</option>
                      <option value="confirmed_pregnant">Prenha</option>
                      <option value="failed">Falhou</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-gray-500">
                    {new Date(m.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      {m.status === 'planned' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(m, 'executed'); }}
                          disabled={updating === m.id}
                          title="Marcar como executado"
                          className="p-1 text-amber-600 hover:bg-amber-50 rounded flex items-center justify-center"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {m.status === 'executed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(m, 'confirmed_pregnant'); }}
                          disabled={updating === m.id}
                          title="Confirmar prenhez"
                          className="p-1 text-green-600 hover:bg-green-50 rounded flex items-center justify-center"
                        >
                          <Baby size={14} />
                        </button>
                      )}
                      {(m.status === 'planned' || m.status === 'executed') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(m, 'failed'); }}
                          disabled={updating === m.id}
                          title="Marcar como falhou"
                          className="p-1 text-red-500 hover:bg-red-50 rounded flex items-center justify-center"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                      {m.females && m.bulls && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProgenieAberta(calcularIndicesProgenie(m.females as any, m.bulls as any));
                          }}
                          title="Ver Perfil da Progênie"
                          className="p-1 text-blue-mid hover:bg-blue-50 rounded flex items-center justify-center"
                        >
                          <Dna size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMating(m.id); }}
                        disabled={updating === m.id}
                        title="Deletar"
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded flex items-center justify-center ml-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === m.id && (
                  <tr key={`${m.id}-detail`} className="bg-gray-50/40">
                    <td colSpan={9} className="px-4 py-3 border-b border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slideDown">
                        <div className="flex flex-wrap gap-4 text-xs">
                          <div className="bg-white rounded border border-gray-200 px-3 py-1.5 shadow-sm">
                            <span className="text-gray-400 block uppercase text-[10px]">TPI Progênie</span>
                            <span className="font-bold text-gray-700">
                              {(() => {
                                const prog = m.females && m.bulls ? calcularIndicesProgenie(m.females as any, m.bulls as any) : null;
                                return prog?.indices.tpi?.toFixed(0) ?? '—';
                              })()}
                            </span>
                          </div>
                          <div className="bg-white rounded border border-gray-200 px-3 py-1.5 shadow-sm">
                            <span className="text-gray-400 block uppercase text-[10px]">NM$ Progênie</span>
                            <span className="font-bold text-amber-700">
                              {(() => {
                                const prog = m.females && m.bulls ? calcularIndicesProgenie(m.females as any, m.bulls as any) : null;
                                return prog?.indices.netMerit != null ? `$${prog.indices.netMerit.toFixed(0)}` : '—';
                              })()}
                            </span>
                          </div>
                          <div className="bg-white rounded border border-gray-200 px-3 py-1.5 shadow-sm">
                            <span className="text-gray-400 block uppercase text-[10px]">Leite Progênie</span>
                            <span className="font-bold text-gray-700">
                              {(() => {
                                const prog = m.females && m.bulls ? calcularIndicesProgenie(m.females as any, m.bulls as any) : null;
                                return prog?.indices.milk != null ? `${prog.indices.milk.toFixed(0)} lbs` : '—';
                              })()}
                            </span>
                          </div>
                          <div className="bg-white rounded border border-gray-200 px-3 py-1.5 shadow-sm">
                            <span className="text-gray-400 block uppercase text-[10px]">Inb%</span>
                            <span className="font-bold text-blue-mid">
                              {m.inbreeding_pct != null ? `${m.inbreeding_pct.toFixed(1)}%` : '—'}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (m.females && m.bulls) {
                              setProgenieAberta(calcularIndicesProgenie(m.females as any, m.bulls as any));
                            }
                          }}
                          disabled={!m.females || !m.bulls}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A5C] text-white text-xs font-semibold rounded-lg hover:bg-blue-mid shadow-sm transition-all disabled:opacity-50"
                        >
                          <Dna size={14} /> Ver Perfil Completo da Progênie
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Nenhum acasalamento registrado.</div>
          )}
        </div>
      )}
      {progenieAberta && (
        <PerfilProgenieModal
          isOpen={!!progenieAberta}
          onClose={() => setProgenieAberta(null)}
          {...progenieAberta}
        />
      )}
    </div>
  );
}
