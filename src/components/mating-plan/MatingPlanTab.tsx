import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Calculator, Save, Printer, CheckCircle, Dna } from 'lucide-react';
import type { Bull, Female, WeightMap, PlanResult } from '../../lib/matching';
import { inb, fmt, inbClass } from '../../lib/matching';
import { calcMatingPlan, calcProgeny } from '../../lib/calc-client';
import type { BullRow, FemaleRow } from '../../lib/supabase';
import type { TankEntry } from '../../hooks/useTank';
import { PerfilProgenieModal } from '../matching/PerfilProgenie';
import type { PerfilProgenieProps } from '../../types/PerfilProgenie.types';
import { useAuth } from '../../contexts/AuthContext';
import { insertDemoMating } from '../../lib/demo-matings';

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
  farmName?: string;
  bullRows: BullRow[];
  femaleRows: FemaleRow[];
  onUpdateTank: (tankId: string, doses: number | null, price: number | null) => Promise<unknown>;
  onNavigate?: (tab: string) => void;
}

// ── Gerador do relatório de impressão ─────────────────────────────────────────
function generatePrintReport(
  results: PlanResult[],
  tank: TankEntry[],
  farmName: string,
  maxInb: number,
  weights: WeightMap
) {
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const withBull = results.filter(r => r.bull);
  const totalCost = withBull.reduce((sum, r) => {
    const entry = tank.find(e => e.bull.code === r.bull!.code);
    return sum + (entry?.pricePerDose ?? 0);
  }, 0);

  const rows = results.map((r, i) => {
    const entry = tank.find(e => e.bull.code === r.bull?.code);
    const price = entry?.pricePerDose ?? null;
    const bullName = r.bull ? (r.bull.name ?? r.bull.short_name ?? '') : '';
    const inbPct = r.bull ? r.inbreeding.toFixed(1) : '—';
    const progenyNM = r.progeny.find(p => p.label === 'NM$');
    const progenyMilk = r.progeny.find(p => p.label === 'Leite (lbs)');
    const progenyDpr = r.progeny.find(p => p.label === 'DPR');

    return `
      <tr class="${!r.bull ? 'no-option' : i % 2 === 0 ? 'even' : ''}">
        <td class="num">${i + 1}</td>
        <td class="animal-id">${r.female.id}</td>
        <td class="lact">${r.female.lact ?? 0}</td>
        <td class="bull-cell">
          ${r.bull
            ? `<span class="bull-code">${r.bull.code}</span><br><span class="bull-name">${bullName}</span>`
            : `<span class="no-opt">⚠️ Sem opção — inb. elevada<br>Aumente limite máx. (atual: ${maxInb.toFixed(1)}%)</span>`
          }
        </td>
        <td class="inb ${r.bull && r.inbreeding >= maxInb * 0.9 ? 'inb-warn' : ''}">${inbPct}%</td>
        <td>${progenyNM ? fmt(progenyNM.pta, 0) : '—'}</td>
        <td>${progenyMilk ? fmt(progenyMilk.pta, 0) : '—'}</td>
        <td>${progenyDpr ? fmt(progenyDpr.pta, 1) : '—'}</td>
        <td class="price">${price != null ? `R$ ${price.toFixed(0)}` : '—'}</td>
        <td class="status-col"><span class="checkbox"></span></td>
        <td class="obs-col"></td>
      </tr>`;
  }).join('');

  // Resumo do botijão
  const tankSummary = tank.map(e => `
    <tr>
      <td>${e.bull.code}</td>
      <td>${e.bull.name ?? ''}</td>
      <td>${results.filter(r => r.bull?.code === e.bull.code).length} alocações</td>
      <td>${e.doses != null ? `${e.doses} doses` : 'Ilimitado'}</td>
      <td>${e.pricePerDose != null ? `R$ ${e.pricePerDose.toFixed(0)}/dose` : '—'}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano de Acasalamento — ${farmName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; background: white; }

    .page { padding: 15mm 12mm; }

    /* Cabeçalho */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1B3A5C; padding-bottom: 8px; margin-bottom: 10px; }
    .header-left h1 { font-size: 16pt; color: #1B3A5C; font-weight: bold; }
    .header-left h2 { font-size: 11pt; color: #2E6DA4; margin-top: 2px; }
    .header-right { text-align: right; font-size: 9pt; color: #555; }
    .header-right p { margin-top: 2px; }

    /* Resumo */
    .summary { display: flex; gap: 16px; margin: 10px 0; }
    .summary-card { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 6px 10px; }
    .summary-card .label { font-size: 8pt; color: #888; text-transform: uppercase; }
    .summary-card .value { font-size: 13pt; font-weight: bold; color: #1B3A5C; }

    /* Tabela principal */
    .section-title { font-size: 10pt; font-weight: bold; color: #1B3A5C; text-transform: uppercase; letter-spacing: 0.5px; margin: 12px 0 5px; border-left: 4px solid #C9A84C; padding-left: 8px; }

    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    thead tr { background-color: #1B3A5C; color: white; }
    thead th { padding: 5px 6px; text-align: center; font-weight: 600; }
    thead th:first-child, thead th:nth-child(2), thead th:nth-child(4) { text-align: left; }
    tbody tr { border-bottom: 1px solid #e5e7eb; }
    tbody tr.even { background-color: #f8fafc; }
    tbody tr.no-option { background-color: #fff7ed; }
    tbody td { padding: 5px 6px; vertical-align: middle; }
    td.num { color: #999; text-align: center; width: 24px; }
    td.animal-id { font-weight: bold; font-size: 10pt; }
    td.lact { text-align: center; color: #666; }
    td.bull-cell { min-width: 110px; }
    .bull-code { font-weight: bold; font-size: 10pt; color: #1B3A5C; font-family: monospace; }
    .bull-name { font-size: 8pt; color: #666; }
    td.inb { text-align: center; }
    td.inb-warn { color: #d97706; font-weight: bold; }
    td.price { text-align: center; color: #92400e; }
    td.status-col { text-align: center; width: 60px; }
    .checkbox { display: inline-block; width: 14px; height: 14px; border: 1.5px solid #666; border-radius: 3px; }
    td.obs-col { min-width: 80px; border-bottom: 1px solid #ccc; }
    .no-opt { color: #c2410c; font-size: 8pt; font-weight: 600; }

    /* Botijão */
    .tank-table th { background: #f1f5f9; color: #374151; }
    .tank-table td { padding: 4px 6px; }

    /* Filtros usados */
    .filters { font-size: 8pt; color: #666; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; margin: 8px 0; }
    .filters strong { color: #374151; }

    /* Rodapé */
    .footer { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
    .signatures { display: flex; gap: 40px; margin-top: 16px; }
    .sig-line { flex: 1; }
    .sig-line .line { border-bottom: 1px solid #999; height: 28px; margin-bottom: 4px; }
    .sig-line .label { font-size: 8pt; color: #777; text-align: center; }

    .legend { margin-top: 8px; font-size: 8pt; color: #777; }
    .legend span { margin-right: 12px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Cabeçalho -->
  <div class="header" style="align-items: center;">
    <div class="header-left" style="display: flex; align-items: center; gap: 12px;">
      <img src="/images/genefy-logo-white.png" alt="Genefy" style="height: 96px; width: auto; object-fit: contain;" />
      <div style="border-left: 1px solid #1B3A5C; padding-left: 12px;">
        <h1 style="font-size: 14pt; color: #1B3A5C; font-weight: bold; margin: 0; line-height: 1.2;">Plano de Acasalamento</h1>
        <h2 style="font-size: 10pt; color: #2E6DA4; margin-top: 2px; line-height: 1.2;">${farmName}</h2>
      </div>
    </div>
    <div class="header-right">
      <p><strong>Data:</strong> ${date}</p>
      <p><strong>Fêmeas no plano:</strong> ${results.length}</p>
      <p><strong>Inb. máx. permitida:</strong> ${maxInb.toFixed(1)}%</p>
    </div>
  </div>

  <!-- Resumo executivo -->
  <div class="summary">
    <div class="summary-card">
      <div class="label">Fêmeas alocadas</div>
      <div class="value" style="color:#1E7E34">${withBull.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Sem touro elegível</div>
      <div class="value" style="color:${results.length - withBull.length > 0 ? '#C0392B' : '#1E7E34'}">${results.length - withBull.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Touros no botijão</div>
      <div class="value">${tank.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Custo estimado (doses)</div>
      <div class="value" style="color:#92400e">R$ ${totalCost.toFixed(0)}</div>
    </div>
  </div>

  <!-- Filtros usados -->
  <div class="filters">
    <strong>Parâmetros usados:</strong>
    Consanguinidade máx. ${maxInb.toFixed(1)}% &nbsp;|&nbsp;
    Score: GTPI×${weights.gtpi ?? 0} / NM$×${weights.net_merit ?? 0} / Leite×${weights.milk ?? 0} / PL×${weights.productive_life ?? 0} / SCS×${weights.scs ?? 0} / DPR×${weights.dpr ?? 0}
  </div>

  <!-- Tabela de acasalamentos -->
  <div class="section-title">Acasalamentos Planejados</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Animal ID</th>
        <th>L.</th>
        <th>Touro Recomendado</th>
        <th>Inb.%</th>
        <th>NM$ prog.</th>
        <th>Leite prog.</th>
        <th>DPR prog.</th>
        <th>R$/dose</th>
        <th>✓ Feito</th>
        <th>Observações</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="legend">
    <span>L. = Lactação</span>
    <span>Inb.% = Consanguinidade esperada progênie</span>
    <span>prog. = valor esperado na progênie (bezerra)</span>
    <span>NM$ = Net Merit em dólares</span>
  </div>

  <!-- Resumo do botijão -->
  <div class="section-title" style="margin-top:16px">Touros Utilizados (Botijão)</div>
  <table class="tank-table">
    <thead>
      <tr><th style="text-align:left">Código</th><th style="text-align:left">Nome</th><th>Alocações</th><th>Doses Disponíveis</th><th>Preço/Dose</th></tr>
    </thead>
    <tbody>${tankSummary}</tbody>
  </table>

  <!-- Rodapé / Assinaturas -->
  <div class="footer">
    <div class="signatures">
      <div class="sig-line">
        <div class="line"></div>
        <div class="label">Técnico Responsável / Inseminador</div>
      </div>
      <div class="sig-line">
        <div class="line"></div>
        <div class="label">Produtor / Responsável pela Fazenda</div>
      </div>
      <div class="sig-line">
        <div class="line"></div>
        <div class="label">Data de Execução</div>
      </div>
    </div>
    <p style="margin-top:10px; font-size:8pt; color:#aaa; text-align:center">
      Gerado por Genefy v2 — Sistema de Matching Genético Bovino &nbsp;|&nbsp; ${date}
    </p>
  </div>

</div>
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;
}

// ── Componente ────────────────────────────────────────────────────────────────
export function MatingPlanTab({
  females, allBulls, tankBulls, tank, weights,
  maxInb, useRel,
  farmId, farmName = 'Granja Demo', bullRows, femaleRows, onUpdateTank, onNavigate,
}: Props) {
  const { user } = useAuth();
  const isDemoUser = user?.email === 'demo@gmail.com';
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Female[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [rawResults, setResults] = useState<PlanResult[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [progenieAberta, setProgenieAberta] = useState<PerfilProgenieProps | null>(null);

  async function handleVerProgenie(female: Female, bull: Bull) {
    try {
      setProgenieAberta(await calcProgeny({ local: isDemoUser, farmId, female, bull }));
    } catch (err) {
      console.error('[MatingPlanTab] calcProgeny:', err);
    }
  }

  const results = useMemo(() => {
    return rawResults.map(r => {
      const overrideCode = overrides[r.female.id];
      if (overrideCode && overrideCode !== r.bull?.code) {
        const selectedOpt = r.allOptions.find(o => o.bull.code === overrideCode);
        if (selectedOpt) {
          return {
            ...r,
            bull: selectedOpt.bull,
            score: selectedOpt.score,
            inbreeding: selectedOpt.inbreeding,
          };
        }
      }
      return r;
    });
  }, [rawResults, overrides]);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() =>
    females.filter(f =>
      f.id.toLowerCase().includes(search.toLowerCase()) &&
      !selected.some(s => s.id === f.id)
    ).slice(0, 30),
    [females, search, selected]
  );

  function addFemale(f: Female) { setSelected(v => [...v, f]); setSearch(''); setShowDropdown(false); setResults([]); setSaveMsg(''); }
  function removeFemale(id: string) { setSelected(v => v.filter(f => f.id !== id)); setResults([]); setSaveMsg(''); }

  // Plano roda no servidor (genetics.ts via /api/calc/mating-plan); local em demo
  async function runPlan(femalesToPlan: Female[]) {
    try {
      const planResults = await calcMatingPlan({
        local: isDemoUser,
        farmId,
        females: femalesToPlan,
        tank: tank.map(e => [e.bull.code, e.doses]),
        allBulls,
        weights,
        maxInb,
      });
      setResults(planResults);
      setSaveMsg('');
    } catch (err) {
      console.error('[MatingPlanTab] calcMatingPlan:', err);
    }
  }

  function calculate() {
    if (selected.length === 0) return;
    setOverrides({});
    runPlan(selected);
  }

  // Auto-recalcular quando maxInb, pesos ou botijão mudam (só se já há resultados)
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const hasResultsRef = useRef(false);
  hasResultsRef.current = rawResults.length > 0;

  useEffect(() => {
    if (!hasResultsRef.current || selectedRef.current.length === 0) return;
    runPlan(selectedRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxInb, weights, tank]);

  /** Debita do botijão as doses usadas no plano atual */
  async function deductDosesFromTank() {
    // Contar quantas doses cada touro foi usado
    const usedMap = new Map<string, number>();
    for (const r of results) {
      if (!r.bull) continue;
      usedMap.set(r.bull.code, (usedMap.get(r.bull.code) ?? 0) + 1);
    }
    // Atualizar cada entrada do botijão
    for (const entry of tank) {
      const used = usedMap.get(entry.bull.code) ?? 0;
      if (used === 0 || entry.doses === null) continue;
      const remaining = Math.max(0, entry.doses - used);
      await onUpdateTank(entry.tankId, remaining, entry.pricePerDose);
    }
  }

  async function saveAll() {
    setSaving(true);

    // Conta demo: histórico local por browser, sem tocar no banco
    let count = 0;
    if (isDemoUser) {
      for (const r of results) {
        if (!r.bull) continue;
        const femaleRow = femaleRows.find(fr => fr.animal_id === r.female.id);
        if (!femaleRow) continue;
        insertDemoMating({
          farm_id: farmId,
          femaleRow,
          bullRow: bullRows.find(b => b.code === r.bull!.code) ?? null,
          bullCode: r.bull.code,
          option_rank: 1,
          score: r.score,
          inbreeding_pct: r.inbreeding,
        });
        count++;
      }
    } else {
      // Modo Supabase: salvar em lote via API (resolução touro code->uuid no servidor)
      const payload = results
        .filter(r => r.bull)
        .flatMap(r => {
          const femaleRow = femaleRows.find(fr => fr.animal_id === r.female.id);
          if (!femaleRow) return [];
          return [{
            female_id: femaleRow.id,
            bull: r.bull!.code,
            option_rank: 1,
            score: r.score,
            inbreeding_pct: r.inbreeding,
            status: 'planned',
          }];
        });

      if (payload.length > 0) {
        const res = await fetch('/api/matings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ farmId, matings: payload }),
        }).catch(() => null);
        if (res?.ok) count = (await res.json()).saved ?? 0;
      }
    }

    // Debitar doses usadas do botijão
    await deductDosesFromTank();

    setSaving(false);
    setSaveMsg(`✅ ${count} acasalamentos salvos no banco. Acesse a aba Histórico para acompanhar.`);
    if (onNavigate) onNavigate('history');
  }

  function openPrintReport() {
    const html = generatePrintReport(results, tank, farmName, maxInb, weights);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  // ── Custo: buscar preço do tank, não do bull em si ──
  const { totalCost, costBreakdown } = useMemo(() => {
    let total = 0;
    const breakdown: { code: string; qty: number; price: number }[] = [];
    for (const r of results) {
      if (!r.bull) continue;
      const entry = tank.find(e => e.bull.code === r.bull!.code);
      const price = entry?.pricePerDose ?? r.bull.price_per_dose ?? 0;
      total += price;
      const existing = breakdown.find(b => b.code === r.bull!.code);
      if (existing) { existing.qty++; existing.price = price; }
      else breakdown.push({ code: r.bull.code, qty: 1, price });
    }
    return { totalCost: total, costBreakdown: breakdown };
  }, [results, tank]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <h2 className="text-lg font-bold text-blue-dark">Plano de Acasalamento</h2>

      {/* Seleção */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Selecionar Fêmeas</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map(f => (
            <span key={f.id} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-dark rounded-full text-xs">
              {f.id}<button onClick={() => removeFemale(f.id)}><X size={10} /></button>
            </span>
          ))}
          {selected.length > 0 && (
            <button
              onClick={() => { setSelected([]); setResults([]); setSaveMsg(''); }}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
            >
              ✕ Remover todas ({selected.length})
            </button>
          )}
        </div>
        <div className="relative" ref={dropRef}>
          <input value={search} onChange={e => { setSearch(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)}
            placeholder={`Buscar fêmea… (${females.length} disponíveis)`}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-mid" />
          {showDropdown && (
            <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto text-sm">
              <li className="px-3 py-2 text-blue-mid cursor-pointer hover:bg-blue-50 border-b font-medium text-xs"
                onClick={() => { setSelected(females); setShowDropdown(false); }}>
                + Adicionar todas ({females.length})
              </li>
              {filtered.map(f => (
                <li key={f.id} onClick={() => addFemale(f)} className="px-3 py-1.5 cursor-pointer hover:bg-blue-50">
                  {f.id} <span className="text-gray-400 text-xs">L{f.lact ?? 0}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {tankBulls.length === 0 && (
          <p className="mt-2 text-xs text-amber-600">⚠️ Adicione touros ao botijão na barra lateral para calcular o plano.</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={calculate} disabled={selected.length === 0 || tankBulls.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-mid text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-40">
            <Calculator size={14} /> Calcular ({selected.length} fêmeas)
          </button>
          {results.length > 0 && !saveMsg && (
            <button onClick={saveAll} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-farm text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
              <Save size={14} /> {saving ? 'Salvando…' : 'Salvar plano'}
            </button>
          )}
          {results.length > 0 && (
            <button onClick={openPrintReport}
              className="flex items-center gap-2 px-3 py-2 bg-[#1B3A5C] text-white text-sm rounded-lg hover:opacity-90 ml-auto">
              <Printer size={14} /> Imprimir / PDF
            </button>
          )}
        </div>
        {saveMsg && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs">
            <CheckCircle size={14} className="shrink-0 mt-0.5" />
            <div>
              <div>{saveMsg}</div>
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="text-xs text-gray-400 uppercase">Alocadas</div>
              <div className="text-2xl font-bold text-green-farm">{results.filter(r => r.bull).length}</div>
              <div className="text-xs text-gray-400">de {results.length} fêmeas</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="text-xs text-gray-400 uppercase">Sem touro</div>
              <div className={`text-2xl font-bold ${results.filter(r => !r.bull).length > 0 ? 'text-orange-500' : 'text-green-farm'}`}>
                {results.filter(r => !r.bull).length}
              </div>
              <div className="text-xs text-gray-400">inb. elevada</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="text-xs text-gray-400 uppercase">Custo total</div>
              <div className="text-2xl font-bold text-amber-700">
                R$ {totalCost.toFixed(0)}
              </div>
              <div className="text-xs text-gray-400">{results.filter(r => r.bull).length} doses</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="text-xs text-gray-400 uppercase">Custo médio/vaca</div>
              <div className="text-2xl font-bold text-amber-700">
                R$ {results.filter(r => r.bull).length > 0
                  ? (totalCost / results.filter(r => r.bull).length).toFixed(0)
                  : '0'}
              </div>
              <div className="text-xs text-gray-400">por inseminação</div>
            </div>
          </div>

          {/* Detalhamento de custo por touro */}
          {costBreakdown.some(b => b.price > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <strong>Detalhamento de custo:</strong>{' '}
              {costBreakdown.filter(b => b.price > 0).map(b =>
                `${b.code} — ${b.qty}× R$ ${b.price.toFixed(0)} = R$ ${(b.qty * b.price).toFixed(0)}`
              ).join('  |  ')}
            </div>
          )}

          {/* Aviso sem opção */}
          {results.some(r => !r.bull) && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-xs">
              <strong>⚠️ Fêmeas sem opção:</strong> consanguinidade calculada (GFI touro ÷ 2 + gINB vaca ÷ 4) excede o
              limite configurado ({maxInb.toFixed(1)}%) para todos os touros do botijão.
              <span className="font-medium ml-1">Aumente o slider "Consanguinidade máx." ou adicione mais touros ao botijão.</span>
            </div>
          )}

          {/* Tabela */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#1B3A5C] text-white text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Fêmea</th>
                  <th className="px-4 py-3 text-center">Touro Alocado</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">Inb.</th>
                  <th className="px-4 py-3 text-center">R$/dose</th>
                  <th className="px-4 py-3 text-center">2ª Opção</th>
                  <th className="px-4 py-3 text-center">3ª Opção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map(r => {
                  const entry = tank.find(e => e.bull.code === r.bull?.code);
                  const price = entry?.pricePerDose ?? r.bull?.price_per_dose ?? null;
                  const opt2 = r.allOptions[1];
                  const opt3 = r.allOptions[2];

                  let noOptionReason = '';
                  let rejectedBull: Bull | null = null;
                  let rejectedInb = 0;
                  if (!r.bull) {
                    if (r.allOptions.length === 0) {
                      const best = tankBulls
                        .map(b => ({ bull: b, inbreeding: inb(r.female, b) }))
                        .sort((a, b2) => a.inbreeding - b2.inbreeding)[0];
                      if (best) {
                        rejectedBull = best.bull;
                        rejectedInb = best.inbreeding;
                        noOptionReason = `Inb. ${rejectedInb.toFixed(1)}% > limite ${maxInb.toFixed(1)}%`;
                      } else {
                        noOptionReason = 'Botijão vazio';
                      }
                    } else {
                      noOptionReason = 'Doses esgotadas';
                    }
                  }

                  return (
                    <tr key={r.female.id} className={`hover:bg-gray-50 ${!r.bull ? 'bg-orange-50/60' : ''}`}>
                      <td className="px-4 py-2 font-medium">{r.female.id}</td>
                      <td className="px-4 py-2 text-center">
                        {r.allOptions.length > 0 ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-1.5 justify-center">
                              <select
                                value={r.bull?.code ?? ''}
                                onChange={e => setOverrides(prev => ({ ...prev, [r.female.id]: e.target.value }))}
                                className="text-xs font-semibold text-blue-dark bg-white border border-gray-200 rounded px-1 py-0.5 outline-none focus:border-blue-400 max-w-[120px] cursor-pointer"
                              >
                                {r.allOptions.map((opt, i) => (
                                  <option key={opt.bull.code} value={opt.bull.code}>
                                    {opt.bull.code} {i === 0 ? '(Rec)' : i === 1 ? '(2ª)' : '(3ª)'}
                                  </option>
                                ))}
                              </select>
                              {r.bull && (
                                <button
                                  onClick={() => handleVerProgenie(r.female, r.bull!)}
                                  title="Ver Perfil da Progênie"
                                  className="p-1 text-blue-mid hover:bg-blue-50 rounded flex items-center justify-center"
                                >
                                  <Dna size={13} />
                                </button>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400">{r.bull?.name ?? r.bull?.short_name}</div>
                          </div>
                        ) : (
                          <div className="text-xs">
                            <div className="text-orange-600 font-medium">{rejectedBull ? `⚠️ ${rejectedBull.code}` : '⚠️ Sem opção'}</div>
                            <div className="text-gray-400 mt-0.5">{noOptionReason}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">{r.bull ? fmt(r.score, 2) : '—'}</td>
                      <td className={`px-4 py-2 text-center text-xs font-medium ${r.bull ? inbClass(r.inbreeding).cls : 'text-orange-500'}`}>
                        {r.bull ? `${r.inbreeding.toFixed(1)}%` : rejectedBull ? `${rejectedInb.toFixed(1)}% ⚠️` : '—'}
                      </td>
                      <td className="px-4 py-2 text-center text-xs font-medium text-amber-700">
                        {price != null && price > 0 ? `R$ ${price.toFixed(0)}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-gray-500">
                        {opt2 ? (
                          <div className="flex items-center justify-center gap-1">
                            <span>{opt2.bull.code}</span>
                            <button
                              onClick={() => handleVerProgenie(r.female, opt2.bull)}
                              title="Ver Perfil da Progênie (2ª Opção)"
                              className="p-0.5 text-blue-mid hover:bg-blue-50 rounded flex items-center justify-center"
                            >
                              <Dna size={12} />
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-gray-500">
                        {opt3 ? (
                          <div className="flex items-center justify-center gap-1">
                            <span>{opt3.bull.code}</span>
                            <button
                              onClick={() => handleVerProgenie(r.female, opt3.bull)}
                              title="Ver Perfil da Progênie (3ª Opção)"
                              className="p-0.5 text-blue-mid hover:bg-blue-50 rounded flex items-center justify-center"
                            >
                              <Dna size={12} />
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
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
