import { useState, useRef, useCallback, useMemo } from 'react';
import { Play, Download, ChevronLeft, ChevronRight, BarChart2, Clock, RefreshCw, Dna } from 'lucide-react';
import type { Bull, Female, WeightMap } from '../../lib/matching';
import type { TankEntry } from '../../hooks/useTank';
import { fmt } from '../../lib/matching';
import { supabase } from '../../lib/supabase';
import type { MatrixPair } from '../../workers/matrixWorker';
import { PerfilProgenieModal } from '../matching/PerfilProgenie';
import { calcularIndicesProgenie } from '../../utils/calcularProgenie';
import type { PerfilProgenieProps } from '../../types/PerfilProgenie.types';

const PAGE_SIZE = 100;

interface CacheInfo {
  createdAt: string;
  totalPairs: number;
  topPairs: MatrixPair[];
}

interface Props {
  females: Female[];
  allBulls: Bull[];
  tankBulls: Bull[];
  tank: TankEntry[];
  weights: WeightMap;
  maxInb: number;
  a2a2Only: boolean;
  useRel: boolean;
  farmId: string;
  bullRows: import('../../lib/supabase').BullRow[];
}

export function FullAnalysisTab({
  females, allBulls, tankBulls, tank, weights, maxInb, a2a2Only, useRel, farmId,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'calculating' | 'done'>('idle');
  const [progress, setProgress] = useState({ count: 0, total: 0 });
  const [results, setResults] = useState<MatrixPair[]>([]);
  const [page, setPage] = useState(0);
  const [minScore, setMinScore] = useState(0);
  const [tankOnlyLocal, setTankOnlyLocal] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState('');
  const [femaleFilter, setFemaleFilter] = useState('');
  const [cache, setCache] = useState<CacheInfo | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const [progenieAberta, setProgenieAberta] = useState<PerfilProgenieProps | null>(null);

  const handleVerProgenie = useCallback((femaleId: string, bullCode: string) => {
    const femaleObj = females.find(f => f.id === femaleId);
    const bullObj = allBulls.find(b => b.code === bullCode);
    if (femaleObj && bullObj) {
      setProgenieAberta(calcularIndicesProgenie(femaleObj, bullObj));
    }
  }, [females, allBulls]);

  // Load cache on mount
  const loadCache = useCallback(async () => {
    if (!farmId || cacheLoaded) return;
    setCacheLoaded(true);
    try {
      const { data } = await supabase
        .from('cached_analysis')
        .select('*')
        .eq('farm_id', farmId)
        .single();
      if (data) {
        setCache({
          createdAt: data.created_at,
          totalPairs: data.total_pairs,
          topPairs: data.top_pairs as MatrixPair[],
        });
      }
    } catch {
      // table may not exist yet — silent
    }
  }, [farmId, cacheLoaded]);

  if (!cacheLoaded) loadCache();

  const tankCodes = useMemo(() => tankBulls.map(b => b.code), [tankBulls]);

  const catalogOptions = useMemo(() => {
    const seen = new Set<string>();
    allBulls.forEach(b => { if (b.catalog) seen.add(b.catalog as string); });
    return Array.from(seen).sort();
  }, [allBulls]);

  function startCalculation() {
    if (typeof window === 'undefined') return; // Worker só existe no client
    if (workerRef.current) workerRef.current.terminate();

    const worker = new Worker(new URL('../../workers/matrixWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    setStatus('calculating');
    setProgress({ count: 0, total: 0 });
    setResults([]);
    setPage(0);

    worker.onmessage = async (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress({ count: msg.count, total: msg.total });
      } else if (msg.type === 'done') {
        const pairs = msg.results as MatrixPair[];
        setResults(pairs);
        setStatus('done');
        worker.terminate();
        workerRef.current = null;

        // Save top 50 to Supabase cache
        if (farmId) {
          try {
            await supabase.from('cached_analysis').upsert({
              farm_id: farmId,
              weights,
              max_inb: maxInb,
              a2a2_only: a2a2Only,
              total_pairs: msg.total,
              top_pairs: pairs.slice(0, 50),
            }, { onConflict: 'farm_id' });
            setCache({
              createdAt: new Date().toISOString(),
              totalPairs: msg.total,
              topPairs: pairs.slice(0, 50),
            });
          } catch {
            // table may not exist
          }
        }
      }
    };

    worker.onerror = (err) => {
      console.error('Worker error:', err);
      setStatus('idle');
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({
      type: 'start',
      females,
      bulls: allBulls,
      weights,
      maxInb,
      minScore,
      a2a2Only,
      tankOnly: tankOnlyLocal,
      tankCodes,
      useRel,
    });
  }

  function useCache() {
    if (!cache) return;
    setResults(cache.topPairs);
    setStatus('done');
  }

  function exportCSV() {
    const headers = ['Fêmea', 'Touro', 'Nome Touro', 'Score', 'Inb%', 'GTPI', 'NM$', 'Leite', 'GFI', 'Beta', 'HH', 'Catálogo'];
    const rows = filteredResults.map(r => [
      r.femaleId, r.bullCode, r.bullName,
      r.score.toFixed(1), r.inbreeding.toFixed(2),
      r.gtpi ?? '', r.net_merit ?? '', r.milk ?? '', r.gfi ?? '',
      r.beta_casein ?? '', r.hhCarriers.join(';') || 'Livre',
      r.catalog ?? '',
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-completa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (femaleFilter && !r.femaleId.toLowerCase().includes(femaleFilter.toLowerCase())) return false;
      if (catalogFilter && r.catalog !== catalogFilter) return false;
      return true;
    });
  }, [results, femaleFilter, catalogFilter]);

  const totalPages = Math.ceil(filteredResults.length / PAGE_SIZE);
  const pageData = filteredResults.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const progressPct = progress.total > 0 ? Math.round((progress.count / progress.total) * 100) : 0;

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-blue-dark flex items-center gap-2">
            <BarChart2 size={20} /> Análise Completa — Matriz Fêmea × Touro
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {females.length} fêmeas × {allBulls.length} touros = {(females.length * allBulls.length).toLocaleString('pt-BR')} combinações possíveis
          </p>
        </div>
        <div className="flex gap-2">
          {status === 'done' && (
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={14} /> Exportar CSV
            </button>
          )}
          <button
            onClick={startCalculation}
            disabled={status === 'calculating'}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A5C] text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {status === 'calculating' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {status === 'calculating' ? 'Calculando…' : 'Calcular'}
          </button>
        </div>
      </div>

      {/* Cache banner */}
      {cache && status === 'idle' && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <span className="flex items-center gap-2 text-amber-800">
            <Clock size={14} />
            Última análise: {fmtDate(cache.createdAt)} · {cache.totalPairs.toLocaleString('pt-BR')} combinações calculadas
          </span>
          <button
            onClick={useCache}
            className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:opacity-90"
          >
            Usar resultado salvo
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-200 rounded-xl p-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Consanguinidade máx.</label>
          <div className="text-xs font-semibold text-blue-mid">{maxInb.toFixed(1)}% (do filtro global)</div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Score mínimo</label>
          <input
            type="number" min={0} max={100} step={1} value={minScore}
            onChange={e => { setMinScore(+e.target.value); setPage(0); }}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Filtrar fêmea</label>
          <input
            value={femaleFilter}
            onChange={e => { setFemaleFilter(e.target.value); setPage(0); }}
            placeholder="ID da vaca…"
            className="px-2 py-1 text-sm border border-gray-300 rounded w-36"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Catálogo</label>
          <select
            value={catalogFilter}
            onChange={e => { setCatalogFilter(e.target.value); setPage(0); }}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="">Todos</option>
            {catalogOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={tankOnlyLocal} onChange={e => setTankOnlyLocal(e.target.checked)} className="accent-blue-mid" />
          Apenas botijão
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={a2a2Only} readOnly className="accent-blue-mid opacity-60" />
          <span className="text-gray-500">A2A2 (do filtro global)</span>
        </label>
      </div>

      {/* Progress bar */}
      {status === 'calculating' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Calculando…</span>
            <span>{progress.count.toLocaleString('pt-BR')} / {progress.total.toLocaleString('pt-BR')} pares ({progressPct}%)</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-full bg-blue-mid transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {status === 'done' && (
        <>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {filteredResults.length.toLocaleString('pt-BR')} pares encontrados
              {results.length !== filteredResults.length && ` (de ${results.length.toLocaleString('pt-BR')} calculados)`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                <span>Pág. {page + 1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-[#1B3A5C] text-white text-xs">
                <tr>
                  <th className="px-3 py-2.5 text-left">Fêmea</th>
                  <th className="px-3 py-2.5 text-left">Touro</th>
                  <th className="px-3 py-2.5 text-center">Score</th>
                  <th className="px-3 py-2.5 text-center">GTPI</th>
                  <th className="px-3 py-2.5 text-center">NM$</th>
                  <th className="px-3 py-2.5 text-center">Leite prog.</th>
                  <th className="px-3 py-2.5 text-center">Inb%</th>
                  <th className="px-3 py-2.5 text-center">HH</th>
                  <th className="px-3 py-2.5 text-center">Beta</th>
                  <th className="px-3 py-2.5 text-left">Catálogo</th>
                  <th className="px-3 py-2.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageData.map((r, i) => (
                  <tr key={`${r.femaleId}-${r.bullCode}-${i}`} className="hover:bg-gray-50 text-xs">
                    <td className="px-3 py-2 font-medium text-blue-dark">{r.femaleId}</td>
                    <td className="px-3 py-2">
                      <div className="font-mono font-semibold">{r.bullCode}</div>
                      <div className="text-gray-500 truncate max-w-[140px]">{r.bullName}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-bold text-blue-mid">{r.score.toFixed(1)}</span>
                    </td>
                    <td className="px-3 py-2 text-center">{r.gtpi ?? '—'}</td>
                    <td className="px-3 py-2 text-center">{fmt(r.net_merit, 0)}</td>
                    <td className="px-3 py-2 text-center">{fmt(r.milk, 0)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-medium ${r.inbreeding >= 8 ? 'text-red-500' : r.inbreeding >= 6.25 ? 'text-amber-500' : 'text-green-600'}`}>
                        {r.inbreeding.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.hhCarriers.length === 0
                        ? <span className="text-green-600">✓</span>
                        : <span className="text-red-500" title={r.hhCarriers.join(', ')}>⚠</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.beta_casein && <span className="px-1 bg-blue-50 text-blue-700 rounded">{r.beta_casein}</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{r.catalog ?? '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleVerProgenie(r.femaleId, r.bullCode)}
                        title="Ver Perfil da Progênie"
                        className="p-1 text-blue-mid hover:bg-blue-50 rounded inline-flex items-center justify-center"
                      >
                        <Dna size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageData.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                Nenhum par encontrado com os filtros atuais.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <button onClick={() => setPage(0)} disabled={page === 0} className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">Início</button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="text-gray-500">Pág. {page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-40"><ChevronRight size={16} /></button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">Fim</button>
            </div>
          )}
        </>
      )}

      {status === 'idle' && !cache && (
        <div className="text-center py-16 text-gray-400">
          <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>Configure os filtros e clique em <strong>Calcular</strong> para iniciar a análise completa.</p>
          <p className="text-xs mt-1">Com {females.length} fêmeas e {allBulls.length} touros, serão avaliados ~{(females.length * allBulls.length).toLocaleString('pt-BR')} cruzamentos.</p>
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
