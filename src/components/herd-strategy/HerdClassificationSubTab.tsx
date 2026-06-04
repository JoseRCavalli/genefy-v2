import { useState, useMemo } from 'react';
import type { HerdStrategy, FemaleAssignment, SemenType } from '../../types/herd-strategy.types';
import { GROUP_LABELS, GROUP_COLORS, SEMEN_TYPE_LABELS } from '../../types/herd-strategy.types';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface Props {
  strategy: HerdStrategy;
  assignments: FemaleAssignment[];
  groupCounts: Record<string, number>;
  onUpdate: (newStrategy: Partial<HerdStrategy>) => Promise<unknown>;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  onSave?: () => Promise<void>;
}

export function HerdClassificationSubTab({ strategy, assignments, groupCounts, onUpdate, hasUnsavedChanges, isSaving, onSave }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const handleSliderChange = (field: 'elite_percentile' | 'mid_percentile', value: number) => {
    // Manter integridade: elite_percentile não deve ser maior que mid_percentile
    if (field === 'elite_percentile') {
      const elite = Math.min(value, strategy.mid_percentile);
      onUpdate({ elite_percentile: elite });
    } else {
      const mid = Math.max(value, strategy.elite_percentile);
      onUpdate({ mid_percentile: mid });
    }
  };

  // Filtragem
  const filteredAssignments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return assignments;
    return assignments.filter((a) => a.female_id.toLowerCase().includes(term));
  }, [assignments, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredAssignments.length / pageSize);
  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  // Formatar moeda brasileira
  const formatBRL = (val: number | null) => {
    if (val === null) return '—';
    const sign = val >= 0 ? '+' : '';
    return `${sign}R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* 4 Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50/50 p-4 rounded-xl border border-green-200/50">
          <div className="text-xs font-semibold text-green-700">{GROUP_LABELS.elite_replacement}</div>
          <div className="text-3xl font-bold text-green-900 mt-2">{groupCounts.elite_replacement}</div>
          <div className="text-[10px] text-green-600 mt-1">Sêmen Sexado Premium</div>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/50">
          <div className="text-xs font-semibold text-blue-700">{GROUP_LABELS.sale_heifer}</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">{groupCounts.sale_heifer}</div>
          <div className="text-[10px] text-blue-600 mt-1">Sêmen Sexado Budget</div>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/50">
          <div className="text-xs font-semibold text-amber-700">{GROUP_LABELS.conventional}</div>
          <div className="text-3xl font-bold text-amber-900 mt-2">{groupCounts.conventional}</div>
          <div className="text-[10px] text-amber-600 mt-1">Sêmen Convencional</div>
        </div>

        <div className="bg-red-50/50 p-4 rounded-xl border border-red-200/50">
          <div className="text-xs font-semibold text-red-700">{GROUP_LABELS.beef_cross}</div>
          <div className="text-3xl font-bold text-red-900 mt-2">{groupCounts.beef_cross}</div>
          <div className="text-[10px] text-red-600 mt-1">Sêmen de Corte</div>
        </div>
      </div>

      {/* Sliders de Configuração */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/50 space-y-4">
        <h4 className="text-xs font-bold text-blue-dark uppercase tracking-wider">Limiares de Corte da Classificação</h4>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between text-xs text-gray-700 font-semibold mb-1">
              <span>Limiar de Reposição Elite (Top %)</span>
              <span className="text-blue-mid">{strategy.elite_percentile}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={strategy.elite_percentile}
              onChange={(e) => handleSliderChange('elite_percentile', parseInt(e.target.value))}
              className="w-full accent-blue-dark"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
              <span>0% (Desativar)</span>
              <span>100% (Todos)</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              As fêmeas com percentil de mérito genético superior a {100 - strategy.elite_percentile}% serão selecionadas para reposição.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-700 font-semibold mb-1">
              <span>Limiar de Cruzamento Corte (Bottom %)</span>
              <span className="text-blue-mid">{100 - strategy.mid_percentile}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={strategy.mid_percentile}
              onChange={(e) => handleSliderChange('mid_percentile', parseInt(e.target.value))}
              className="w-full accent-blue-dark"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
              <span>0% (Desativar)</span>
              <span>100% (Todos)</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              As fêmeas com percentil de mérito genético inferior a {100 - strategy.mid_percentile}% serão direcionadas ao cruzamento com sêmen de corte.
            </p>
          </div>
        </div>

        {/* Botão de Salvar Alterações */}
        {onSave && (
          <div className="pt-4 border-t border-gray-200/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {hasUnsavedChanges ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-[11px] font-medium text-gray-600">Você tem alterações não salvas</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-[11px] font-medium text-gray-600">Alterações salvas com sucesso</span>
                </>
              )}
            </div>
            <button
              onClick={onSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-blue-dark text-white border-blue-dark hover:bg-blue-mid shadow-md active:scale-95'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
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

      {/* Tabela de Fêmeas Classificadas */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-blue-dark uppercase tracking-wider">Tabela de Classificação do Rebanho</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por animal..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-mid"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-4 py-3 text-center w-12">Rank</th>
                <th className="px-4 py-3 text-left">Animal ID</th>
                <th className="px-4 py-3 text-center">Lact</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-center">Percentil</th>
                <th className="px-4 py-3 text-center">Grupo</th>
                <th className="px-4 py-3 text-center">Sêmen Recom.</th>
                <th className="px-4 py-3 text-center">Insem.</th>
                <th className="px-4 py-3 text-right">Valor Econômico</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-xs">
              {paginated.map((row) => {
                const colors = GROUP_COLORS[row.assignment_group] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                const label = GROUP_LABELS[row.assignment_group] || 'Indefinido';
                const isPositive = (row.economic_value_brl || 0) >= 0;

                return (
                  <tr key={row.female_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-center font-semibold text-gray-400">{row.merit_rank}</td>
                    <td className="px-4 py-2 font-bold text-blue-dark">{row.female_id}</td>
                    <td className="px-4 py-2 text-center font-medium text-gray-600">{row.insemination_order > 1 ? `Lact ${row.insemination_order - 1}` : 'Novilha'}</td>
                    <td className="px-4 py-2 text-center font-bold text-blue-mid">{row.composite_merit_score}</td>
                    <td className="px-4 py-2 text-center font-medium text-gray-500">{(row.merit_percentile ?? 0).toFixed(1)}%</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center font-semibold text-gray-700">
                      {SEMEN_TYPE_LABELS[row.recommended_semen_type as SemenType] || '—'}
                    </td>
                    <td className="px-4 py-2 text-center font-medium text-gray-500">
                      {row.insemination_order}ª dose
                    </td>
                    <td className={`px-4 py-2 text-right font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {formatBRL(row.economic_value_brl)}
                    </td>
                  </tr>
                );
              })}
              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Nenhuma fêmea encontrada para a pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
            <div>
              Mostrando página <span className="font-semibold">{page + 1}</span> de <span className="font-semibold">{totalPages}</span> ({filteredAssignments.length} animais)
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 hover:bg-gray-100 border rounded disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 hover:bg-gray-100 border rounded disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
