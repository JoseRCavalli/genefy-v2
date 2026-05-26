import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  UserPlus, Dna, X, Check, Clock, Beef, ArrowRight,
  Search, Trash2, Upload, FileText, AlertCircle, Zap,
} from 'lucide-react';
import type { Bull, Female } from '../../lib/matching';
import {
  estimateCowPtas, calcCowRel, monthsToBreeding, fmt,
} from '../../lib/matching';
import type { FemaleRow } from '../../lib/supabase';
import { useClickOutside } from '../../hooks/useClickOutside';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

// ── Tipos internos ────────────────────────────────────────────────────────────

interface Props {
  females: Female[];
  femaleRows: FemaleRow[];
  allBulls: Bull[];
  farmId: string;
  onUpsert: (farmId: string, female: Partial<FemaleRow> & { animal_id: string }) => Promise<unknown>;
  onDelete: (dbId: string) => Promise<unknown>;
  onSelectFemale: (f: Female) => void;
  onTabChange: (tab: string) => void;
}

interface FormState {
  id: string;
  name: string;
  breed: string;
  bdate: string;
  sire: string;
  dam: string;
  mgs: string;
  mmgs: string;
  ginb: string;
  lact: string;
  milk_kg: string;
  genomic: boolean;
}

const EMPTY_FORM: FormState = {
  id: '', name: '', breed: 'HO', bdate: '',
  sire: '', dam: '', mgs: '', mmgs: '',
  ginb: '', lact: '', milk_kg: '', genomic: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function iaBadge(bdate: string | null | undefined): { label: string; cls: string; icon: string } | null {
  if (!bdate) return null;
  const months = monthsToBreeding(bdate);
  if (months === null) return null;
  if (months <= 0)  return { label: 'Pronta para IA', cls: 'bg-green-100 text-green-700', icon: '🟢' };
  if (months <= 6)  return { label: `IA em ${months}m`, cls: 'bg-yellow-100 text-yellow-700', icon: '🟡' };
  return              { label: `IA em ${months}m`, cls: 'bg-gray-100 text-gray-500', icon: '⏰' };
}

// Parser de CSV genômico
function parseGenomicCSV(raw: string): Partial<Female>[] {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  if (!lines.length) return [];
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/[^a-z_]/g, ''));
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/[+]/g, ''));
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const v = parseFloat(cols[i]);
      obj[h] = isNaN(v) ? (cols[i] || null) : v;
    });
    return obj;
  }).filter(o => o['id'] != null) as Partial<Female>[];
}

// ── Autocomplete dropdown genérico para touros ────────────────────────────────

interface BullDropProps {
  value: string;
  onChange: (v: string) => void;
  onSelect: (b: Bull) => void;
  allBulls: Bull[];
  placeholder?: string;
  id?: string;
}

function BullAutocomplete({ value, onChange, onSelect, allBulls, placeholder = 'Código NAAB ou nome', id }: BullDropProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, useCallback(() => setOpen(false), []));

  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return allBulls.filter(b =>
      b.code.toLowerCase().includes(q) ||
      (b.name ?? '').toLowerCase().includes(q) ||
      (b.short_name ?? '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [value, allBulls]);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id={id}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-30 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-0.5 max-h-48 overflow-y-auto text-xs">
          {filtered.map(b => (
            <li key={b.code} onMouseDown={() => { onSelect(b); setOpen(false); }}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0">
              <span className="font-bold font-mono text-blue-900">{b.code}</span>
              {' — '}
              <span className="text-gray-600">{b.name ?? b.short_name ?? ''}</span>
              <div className="text-gray-400 mt-0.5">
                GTPI {b.gtpi ?? '—'} · NM$ {b.net_merit != null ? `$${b.net_merit}` : '—'} · REL {b.reliability != null ? `${b.reliability}%` : '—'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Card de animal cadastrado ─────────────────────────────────────────────────

interface FemaleCardProps {
  female: Female;
  row: FemaleRow;
  allBulls: Bull[];
  onViewMatching: () => void;
  onRemove: () => void;
}

function FemaleCard({ female, row, allBulls, onViewMatching, onRemove }: FemaleCardProps) {
  const sire = female.sire_naab ? allBulls.find(b => b.code === female.sire_naab) : null;
  const badge = iaBadge(row.bdate ?? female.bdate);
  const rel = Math.round((female._rel ?? calcCowRel(female)) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-bold text-blue-900 text-sm">{female.id}</span>
          {row.name && <span className="text-gray-500 text-xs">{row.name}</span>}
          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-mono">REL {rel}%</span>
          {female.genomic && <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">🧬 Genoma</span>}
          {badge && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badge.cls}`}>
              {badge.icon} {badge.label}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-0.5">
          {sire && (
            <div>
              <span className="text-gray-400">Pai:</span>{' '}
              <span className="font-mono font-semibold text-blue-800">{sire.code}</span>{' '}
              {sire.name ?? sire.short_name ?? ''}
            </div>
          )}
          {female.mgs_naab && (
            <div>
              <span className="text-gray-400">MGS:</span>{' '}
              <span className="font-mono">{female.mgs_naab}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-1">
            {female.milk != null && (
              <span>
                Leite: <b>{fmt(female.milk, 0)}</b> lbs{female._est_milk && <i className="text-gray-400"> (est.)</i>}
              </span>
            )}
            {female.net_merit != null && (
              <span>
                NM$: <b>${fmt(female.net_merit, 0)}</b>{female._est_net_merit && <i className="text-gray-400"> (est.)</i>}
              </span>
            )}
            {female.dpr != null && <span>DPR: <b>{fmt(female.dpr, 1)}</b></span>}
            {female.ginb != null && <span>gINB: <b>{female.ginb.toFixed(1)}%</b></span>}
            {row.lact > 0 && <span>Lact: <b>{row.lact}</b></span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          onClick={onViewMatching}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Ver matching <ArrowRight size={10} />
        </button>
        <button
          onClick={onRemove}
          className="flex items-center justify-center gap-1 px-2 py-1 text-xs border border-red-200 text-red-500 rounded hover:bg-red-50"
        >
          <Trash2 size={10} /> Remover
        </button>
      </div>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────

export function HerdTab({ females, femaleRows, allBulls, farmId, onUpsert, onDelete, onSelectFemale, onTabChange }: Props) {
  const [subTab, setSubTab] = useState<'manual' | 'import'>('manual');

  // ── Form state ──
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState<string | null>(null);

  // ── Info boxes abaixo dos campos ──
  const [sireInfo, setSireInfo] = useState('');
  const [damInfo, setDamInfo] = useState('');

  // ── CSV Import ──
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<Array<{ id: string; isNew: boolean; summary: string }>>([]);
  const [importMsg, setImportMsg] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Fêmeas custom (apenas as adicionadas pelo usuário) ──
  const customFemaleRows = useMemo(() => {
    if (IS_DEMO) {
      // Em demo mode, as linhas base têm id='female-{número}', as novas têm 'female-new-{timestamp}'
      return femaleRows.filter(r => r.id.startsWith('female-new-') || !r.id.match(/^female-\d+$/));
    }
    // Em Supabase mode, todas as femaleRows vêm do banco = custom
    return femaleRows;
  }, [femaleRows]);

  // Mapear rows para Female enriquecidos
  const customFemales: Female[] = useMemo(() =>
    customFemaleRows.map(r => {
      const base: Female = {
        id: r.animal_id,
        reg_id: r.animal_id,
        breed: r.breed || 'HO',
        lact: r.lact ?? 0,
        ginb: r.ginb ?? undefined,
        net_merit: r.net_merit ?? undefined,
        milk: r.milk ?? undefined,
        productive_life: r.productive_life ?? undefined,
        dpr: r.dpr ?? undefined,
        fertility_index: r.fertility_index ?? undefined,
        udc: r.udc ?? undefined,
        flc: r.flc ?? undefined,
        scs: r.scs ?? undefined,
        sire_naab: r.sire_naab ?? undefined,
        mgs_naab: r.mgs_naab ?? undefined,
        mmgs_naab: r.mmgs_naab ?? undefined,
        bdate: r.bdate ?? undefined,
        genomic: r.genomic || false,
        _custom: true,
        _rel: r.genomic ? 0.80 : undefined,
      };
      return estimateCowPtas(base, allBulls, females);
    }),
  [customFemaleRows, allBulls, females]);

  // ── Preview Parent Average (debounce 200ms) ──
  const [preview, setPreview] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      if (!form.sire) { setPreview(''); return; }
      const sire = allBulls.find(b => b.code === form.sire);
      if (!sire) { setPreview(''); return; }
      const mgs  = allBulls.find(b => b.code === form.mgs);
      const mmgs = allBulls.find(b => b.code === form.mmgs);
      const dam  = females.find(f => f.id === form.dam);

      function pa(key: keyof Bull): number | null {
        let v = 0, w = 0;
        if (dam && dam[key as string] != null) {
          v += (dam[key as string] as number) * 0.5; w += 0.5;
        } else {
          if (mgs  && mgs[key] != null)  { v += (mgs[key] as number) * 0.25; w += 0.25; }
          if (mmgs && mmgs[key] != null) { v += (mmgs[key] as number) * 0.125; w += 0.125; }
        }
        if (sire && sire[key] != null) { v += (sire[key] as number) * 0.5; w += 0.5; }
        return w > 0 ? v : null;
      }

      const milk = pa('milk');
      const nm   = pa('net_merit');
      const dpr  = pa('dpr');
      const rel  = form.genomic ? 80 : (mgs && mmgs) ? 72 : mgs ? 70 : 65;
      const months = monthsToBreeding(form.bdate || null);

      const parts = [];
      if (milk != null) parts.push(`Leite: ${milk >= 0 ? '+' : ''}${Math.round(milk)} lbs PTA`);
      if (nm   != null) parts.push(`NM$: $${Math.round(nm)}`);
      if (dpr  != null) parts.push(`DPR: ${dpr >= 0 ? '+' : ''}${dpr.toFixed(1)}`);

      const monthsStr = months != null && months > 0 ? ` · Primeira IA em ${months} meses` : months === 0 ? ' · Pronta para IA' : '';
      setPreview(parts.length ? `${parts.join(' · ')} · Confiabilidade estimada: ${rel}%${monthsStr}` : '');
    }, 200);
    return () => clearTimeout(t);
  }, [form.sire, form.mgs, form.mmgs, form.dam, form.genomic, form.bdate, allBulls, females]);

  // ── CSV preview (debounce 300ms) ──
  useEffect(() => {
    const t = setTimeout(() => {
      if (!csvText.trim()) { setCsvPreview([]); return; }
      const rows = parseGenomicCSV(csvText);
      const existingIds = new Set(females.map(f => String(f.id)));
      const preview = rows.slice(0, 10).map(r => {
        const id = String(r['id']);
        const isNew = !existingIds.has(id);
        const parts = [];
        if (r['milk'] != null)      parts.push(`Leite: ${r['milk'] as number >= 0 ? '+' : ''}${r['milk']} lbs`);
        if (r['net_merit'] != null) parts.push(`NM$: $${r['net_merit']}`);
        if (r['ginb'] != null)      parts.push(`gINB: ${r['ginb']}%`);
        return { id, isNew, summary: parts.join(' · ') };
      });
      setCsvPreview(preview);
    }, 300);
    return () => clearTimeout(t);
  }, [csvText, females]);

  // ── Handlers do formulário ──

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setError('');
  }

  function handleSireSelect(b: Bull) {
    setField('sire', b.code);
    setSireInfo(`${b.code} · GTPI ${b.gtpi ?? '—'} · NM$ ${b.net_merit != null ? `$${b.net_merit}` : '—'} · Leite ${b.milk != null ? `${b.milk >= 0 ? '+' : ''}${b.milk} lbs` : '—'}`);
  }

  function handleDamSelect(f: Female) {
    setField('dam', f.id);
    setDamInfo(`Mãe: ${f.id}${(f as { name?: string }).name ? ` — ${(f as { name?: string }).name}` : ''} · Lact ${f.lact ?? 0} · Leite ${f.milk != null ? `${f.milk >= 0 ? '+' : ''}${f.milk} lbs PTA` : '—'}`);
    // auto-preencher MGS com o pai da mãe
    if (f.sire_naab && !form.mgs) {
      setField('mgs', f.sire_naab);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const idTrimmed = form.id.trim();
    if (!idTrimmed) { setError('Informe o número/ID do animal!'); return; }
    if (females.some(f => f.id === idTrimmed)) {
      setError(`Animal ${idTrimmed} já existe no sistema!`);
      return;
    }
    const sireData = form.sire ? allBulls.find(b => b.code === form.sire) : null;
    if (form.sire && !sireData) {
      if (!window.confirm(`Touro "${form.sire}" não está no catálogo. Cadastrar assim mesmo?`)) return;
    }

    setSaving(true);
    await onUpsert(farmId, {
      animal_id: idTrimmed,
      name: form.name || null,
      breed: form.breed || 'HO',
      lact: parseInt(form.lact) || 0,
      bdate: form.bdate || null,
      sire_naab: sireData?.code ?? (form.sire || null),
      mgs_naab: form.mgs || null,
      mmgs_naab: form.mmgs || null,
      dam_id: form.dam || null,
      ginb: form.ginb ? parseFloat(form.ginb) : null,
      milk: form.milk_kg ? Math.round(parseFloat(form.milk_kg) * 2.205) : null,
      genomic: form.genomic,
      is_primiparous: (parseInt(form.lact) || 0) === 0,
    });
    setSaving(false);
    setSuccessId(idTrimmed);
    setForm({ ...EMPTY_FORM });
    setSireInfo('');
    setDamInfo('');
    setTimeout(() => setSuccessId(null), 2500);
  }

  async function handleRemove(row: FemaleRow) {
    if (!window.confirm(`Remover animal ${row.animal_id}?`)) return;
    await onDelete(row.id);
  }

  async function handleImportCSV() {
    setImporting(true);
    const rows = parseGenomicCSV(csvText);
    if (!rows.length) {
      setImportMsg('⚠️ Nenhum dado válido encontrado no CSV.');
      setImporting(false);
      return;
    }
    const existingIds = new Set(females.map(f => String(f.id)));
    let added = 0, skipped = 0;
    for (const r of rows) {
      const id = String(r['id']);
      if (existingIds.has(id)) { skipped++; continue; }
      await onUpsert(farmId, {
        animal_id: id,
        breed: 'HO',
        lact: 0,
        genomic: true,
        ginb: r['ginb'] as number ?? null,
        milk: r['milk'] as number ?? null,
        protein: r['protein'] as number ?? null,
        fat: r['fat'] as number ?? null,
        net_merit: r['net_merit'] as number ?? null,
        productive_life: r['productive_life'] as number ?? null,
        dpr: r['dpr'] as number ?? null,
        fertility_index: r['fertility_index'] as number ?? null,
        udc: r['udc'] as number ?? null,
        flc: r['flc'] as number ?? null,
        scs: r['scs'] as number ?? null,
      });
      existingIds.add(id);
      added++;
    }
    setImporting(false);
    setImportMsg(`✅ ${added} animal${added !== 1 ? 'is' : ''} importado${added !== 1 ? 's' : ''}${skipped ? ` · ${skipped} ignorado(s) (já existiam)` : ''}`);
    setTimeout(() => setImportMsg(''), 5000);
    setCsvText('');
    setCsvPreview([]);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvText(await file.text());
    e.target.value = '';
  }

  // ── Dam autocomplete ──
  const [damSearch, setDamSearch] = useState('');
  const [damOpen, setDamOpen] = useState(false);
  const damRef = useRef<HTMLDivElement>(null);
  useClickOutside(damRef, useCallback(() => setDamOpen(false), []));
  const damFiltered = useMemo(() => {
    if (!damSearch.trim()) return [];
    const q = damSearch.toLowerCase();
    return females.filter(f =>
      f.id.toLowerCase().includes(q) ||
      ((f as { name?: string }).name ?? '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [damSearch, females]);

  const CSV_PLACEHOLDER = `id,milk,protein,fat,net_merit,productive_life,dpr,udc,flc,ginb
1477,+1250,+42,+52,820,2.8,1.2,0.9,0.7,10.5
1478,+980,+38,+44,710,1.9,0.8,1.1,0.6,9.2`;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Beef size={20} className="text-blue-600" />
        <h2 className="text-lg font-bold text-blue-900">Rebanho Personalizado</h2>
        <span className="text-sm text-gray-400">
          {customFemales.length} animal{customFemales.length !== 1 ? 'is' : ''} cadastrado{customFemales.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-sm text-gray-500 -mt-2">
        Cadastre bezerras recém-nascidas ou vacas de qualquer fazenda — o sistema calcula a predição
        genética pelo pedigree na hora. Com genoma importado a confiabilidade sobe de 65% para 80%.
      </p>

      {/* Sub-abas */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setSubTab('manual')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-md border border-b-0 -mb-px
            ${subTab === 'manual'
              ? 'bg-white text-blue-900 border-gray-200'
              : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          <UserPlus size={13} className="inline mr-1" />
          Cadastrar Animal
        </button>
        <button
          onClick={() => setSubTab('import')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-md border border-b-0 -mb-px
            ${subTab === 'import'
              ? 'bg-white text-blue-900 border-gray-200'
              : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          <Dna size={13} className="inline mr-1" />
          Importar Genoma (CSV)
        </button>
      </div>

      {/* ── Sub-aba: Cadastrar Animal ── */}
      {subTab === 'manual' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
            <AlertCircle size={15} className="text-blue-400" />
            Registrar Animal / Nascimento
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identificação */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Identificação</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nº / ID da Bezerra *</label>
                  <input
                    value={form.id}
                    onChange={e => setField('id', e.target.value)}
                    placeholder="Ex: 1500"
                    className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:border-blue-500
                      ${error && !form.id ? 'border-red-400' : 'border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nome (opcional)</label>
                  <input
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="Ex: Estrela"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Data de Nascimento</label>
                  <input
                    type="date"
                    value={form.bdate}
                    onChange={e => setField('bdate', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Raça</label>
                  <select
                    value={form.breed}
                    onChange={e => setField('breed', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="HO">Holandês (HO)</option>
                    <option value="JE">Jersey (JE)</option>
                    <option value="MX">Misto</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pedigree */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pedigree</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Pai */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                    <Zap size={10} className="text-blue-400" /> Pai (touro) *
                  </label>
                  <BullAutocomplete
                    value={form.sire}
                    onChange={v => { setField('sire', v); setSireInfo(''); }}
                    onSelect={handleSireSelect}
                    allBulls={allBulls}
                  />
                  {sireInfo && <div className="mt-1 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">{sireInfo}</div>}
                </div>

                {/* Mãe */}
                <div ref={damRef}>
                  <label className="text-xs text-gray-500 mb-1 block">Mãe (nº da vaca)</label>
                  <div className="relative">
                    <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={damSearch || form.dam}
                      onChange={e => {
                        setDamSearch(e.target.value);
                        setField('dam', e.target.value);
                        setDamOpen(true);
                      }}
                      onFocus={() => setDamOpen(true)}
                      placeholder="Nº da mãe no rebanho"
                      className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    />
                    {damOpen && damFiltered.length > 0 && (
                      <ul className="absolute z-30 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-0.5 max-h-40 overflow-y-auto text-xs">
                        {damFiltered.map(f => (
                          <li key={f.id}
                            onMouseDown={() => {
                              handleDamSelect(f);
                              setDamSearch('');
                              setDamOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                          >
                            <span className="font-bold">{f.id}</span>
                            {(f as { name?: string }).name && ` — ${(f as { name?: string }).name}`}
                            <span className="text-gray-400 ml-1">Lact {f.lact ?? 0} · REL {Math.round((f._rel ?? calcCowRel(f)) * 100)}%</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {damInfo && <div className="mt-1 text-xs text-green-700 bg-green-50 rounded px-2 py-1">{damInfo}</div>}
                </div>

                {/* MGS */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Avô Materno (MGS)</label>
                  <BullAutocomplete
                    value={form.mgs}
                    onChange={v => setField('mgs', v)}
                    onSelect={b => setField('mgs', b.code)}
                    allBulls={allBulls}
                    placeholder="Código NAAB ou nome"
                  />
                </div>

                {/* MMGS */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Bisavô Materno (MMGS)</label>
                  <BullAutocomplete
                    value={form.mmgs}
                    onChange={v => setField('mmgs', v)}
                    onSelect={b => setField('mmgs', b.code)}
                    allBulls={allBulls}
                    placeholder="Código NAAB ou nome"
                  />
                </div>
              </div>
            </div>

            {/* Dados produtivos */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Dados Produtivos{' '}
                <span className="font-normal normal-case">(para vacas adultas — deixe em branco para bezerras)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Lactações completas</label>
                  <input
                    type="number" min={0} max={15}
                    value={form.lact}
                    onChange={e => setField('lact', e.target.value)}
                    placeholder="Ex: 2"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Produção média (kg/lact)</label>
                  <input
                    type="number"
                    value={form.milk_kg}
                    onChange={e => setField('milk_kg', e.target.value)}
                    placeholder="Ex: 11500"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">gINB % conhecido</label>
                  <input
                    type="number" step="0.01"
                    value={form.ginb}
                    onChange={e => setField('ginb', e.target.value)}
                    placeholder="Ou deixar calcular"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Genoma */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="genomic-check"
                checked={form.genomic}
                onChange={e => setField('genomic', e.target.checked)}
                className="accent-purple-600 w-4 h-4"
              />
              <label htmlFor="genomic-check" className="text-sm text-gray-600 cursor-pointer">
                Possui genoma (REL 80%)
              </label>
            </div>

            {/* Preview PA */}
            {preview && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                <span className="font-semibold">📊 Predição genética estimada (Parent Average):</span>{' '}
                {preview}
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                <AlertCircle size={13} /> {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors
                ${successId
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {successId
                ? <><Check size={14} /> ✅ {successId} cadastrada!</>
                : saving
                  ? <><Clock size={14} /> Salvando…</>
                  : <><UserPlus size={14} /> Registrar Animal</>
              }
            </button>
          </form>
        </div>
      )}

      {/* ── Sub-aba: Importar CSV ── */}
      {subTab === 'import' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-900">Importar Relatório Genômico (CSV)</h3>
          </div>
          <p className="text-xs text-gray-500">
            Cole os dados do relatório da <strong>Zoetis (GeneMax/Clarifide)</strong> ou <strong>Neogen</strong>.
            O sistema importa os índices prontos — sem precisar calcular pelo pedigree.
            Confiabilidade sobe automaticamente para <strong>80%</strong>.
          </p>

          {/* Formato esperado */}
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">Formato esperado (CSV com cabeçalho):</div>
            <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-3 overflow-x-auto">{CSV_PLACEHOLDER}</pre>
          </div>

          {/* Input e botões */}
          <div>
            <div className="text-xs text-gray-500 mb-2">Cole o CSV aqui ou carregue o arquivo:</div>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs rounded-lg hover:bg-gray-50"
              >
                <Upload size={12} /> Carregar CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              {csvText && (
                <button
                  onClick={() => { setCsvText(''); setCsvPreview([]); }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-xs rounded-lg hover:bg-gray-50"
                >
                  <X size={12} /> Limpar
                </button>
              )}
            </div>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={6}
              placeholder={CSV_PLACEHOLDER}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500 resize-y"
            />
          </div>

          {/* Preview */}
          {csvPreview.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">
                Preview ({csvPreview.length} animal{csvPreview.length !== 1 ? 'is' : ''}):
              </div>
              <div className="space-y-1 text-xs">
                {csvPreview.map((p, i) => (
                  <div key={i}
                    className={`px-2 py-1.5 rounded border text-xs ${p.isNew ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}
                  >
                    {i === 0 ? '┌─' : i === csvPreview.length - 1 ? '└─' : '├─'}
                    {' '}
                    <strong>{p.id}</strong>
                    {p.summary ? ` · ${p.summary}` : ''}
                    {' '}
                    <span className="font-semibold">{p.isNew ? '✅ nova' : '⚠️ já existe'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importMsg && (
            <div className={`p-3 rounded-lg text-sm ${importMsg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-orange-50 border border-orange-200 text-orange-700'}`}>
              {importMsg}
            </div>
          )}

          <button
            onClick={handleImportCSV}
            disabled={importing || !csvText.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-40"
          >
            <Upload size={14} />
            {importing ? 'Importando…' : '⬆️ Importar Animais'}
          </button>
        </div>
      )}

      {/* ── Lista de Animais Cadastrados ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Check size={14} className="text-green-600" />
            Animais Cadastrados
          </h3>
          {customFemales.length > 0 && (
            <span className="text-xs text-gray-400">{customFemales.length} animal{customFemales.length !== 1 ? 'is' : ''}</span>
          )}
        </div>

        {customFemales.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
            Nenhum animal cadastrado ainda.<br />
            <span className="text-xs mt-1 block">Use o formulário acima para registrar nascimentos ou cadastrar vacas.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {[...customFemales]
              .sort((a, b) => {
                // Ordenar por bdate desc (mais recentes primeiro), nulls por último
                const ba = (customFemaleRows.find(r => r.animal_id === a.id)?.bdate) ?? '';
                const bb = (customFemaleRows.find(r => r.animal_id === b.id)?.bdate) ?? '';
                if (!ba && !bb) return 0;
                if (!ba) return 1;
                if (!bb) return -1;
                return bb.localeCompare(ba);
              })
              .map(f => {
                const row = customFemaleRows.find(r => r.animal_id === f.id);
                if (!row) return null;
                return (
                  <FemaleCard
                    key={f.id}
                    female={f}
                    row={row}
                    allBulls={allBulls}
                    onViewMatching={() => { onSelectFemale(f); onTabChange('matching'); }}
                    onRemove={() => handleRemove(row)}
                  />
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
