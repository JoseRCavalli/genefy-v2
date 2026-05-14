import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Baby, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MatingRow } from '../../lib/supabase';

type MatingStatus = MatingRow['status'];

interface Props {
  farmId: string;
  demoMode?: boolean;
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

export function HistoryTab({ farmId, demoMode }: Props) {
  if (demoMode) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-lg font-bold text-blue-dark">Histórico de Acasalamentos</h2>
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          🧪 O histórico requer Supabase configurado. Em modo demo, os acasalamentos planejados ficam apenas na sessão.
        </div>
      </div>
    );
  }
  const [matings, setMatings] = useState<(MatingRow & { females?: { animal_id: string }; bulls?: { code: string; short_name: string | null } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<MatingStatus | ''>('');
  const [filterSexed, setFilterSexed] = useState<'' | 'yes' | 'no'>('');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('matings')
      .select('*, females(animal_id), bulls(code, short_name)')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false })
      .limit(200);
    setMatings((data ?? []) as typeof matings);
    setLoading(false);
  }, [farmId]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: MatingStatus) {
    setUpdating(id);
    await supabase.from('matings').update({ status }).eq('id', id);
    setUpdating(null);
    load();
  }

  async function deleteMating(id: string) {
    if (!confirm('Tem certeza que deseja deletar este acasalamento?')) return;
    setUpdating(id);
    await supabase.from('matings').delete().eq('id', id);
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
          { status: 'planned', icon: '📋', label: 'Planejados', color: 'border-blue-200 bg-blue-50' },
          { status: 'executed', icon: '💉', label: 'Executados', color: 'border-amber-200 bg-amber-50' },
          { status: 'confirmed_pregnant', icon: '🐄', label: 'Prenhes', color: 'border-green-200 bg-green-50' },
          { status: 'failed', icon: '❌', label: 'Falharam', color: 'border-red-200 bg-red-50' },
        ] as const).map(card => (
          <div key={card.status} className={`rounded-xl border p-4 ${card.color}`}>
            <div className="text-2xl">{card.icon}</div>
            <div className="text-2xl font-bold">{counts[card.status] ?? 0}</div>
            <div className="text-sm text-gray-600">{card.label}</div>
          </div>
        ))}
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
          <option value="yes">🟣 Sexado</option>
          <option value="no">🔵 Convencional</option>
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
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{m.females?.animal_id ?? '—'}</td>
                  <td className="px-4 py-2 font-mono text-blue-dark">{m.bulls?.code ?? '—'}</td>
                  <td className="px-4 py-2 text-center">
                    {m.option_rank === 1 ? '🥇' : m.option_rank === 2 ? '🥈' : '💰'}
                  </td>
                  <td className="px-4 py-2 text-center">{m.score?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-2 text-center text-xs">{m.inbreeding_pct != null ? `${m.inbreeding_pct.toFixed(1)}%` : '—'}</td>
                  <td className="px-4 py-2 text-center">{m.is_sexed_semen ? '🟣' : '🔵'}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                      {STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-gray-500">
                    {new Date(m.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1">
                      {m.status === 'planned' && (
                        <button
                          onClick={() => updateStatus(m.id, 'executed')}
                          disabled={updating === m.id}
                          title="Marcar como executado"
                          className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {m.status === 'executed' && (
                        <button
                          onClick={() => updateStatus(m.id, 'confirmed_pregnant')}
                          disabled={updating === m.id}
                          title="Confirmar prenhez"
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Baby size={14} />
                        </button>
                      )}
                      {(m.status === 'planned' || m.status === 'executed') && (
                        <button
                          onClick={() => updateStatus(m.id, 'failed')}
                          disabled={updating === m.id}
                          title="Marcar como falhou"
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMating(m.id)}
                        disabled={updating === m.id}
                        title="Deletar"
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded ml-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Nenhum acasalamento registrado.</div>
          )}
        </div>
      )}
    </div>
  );
}
