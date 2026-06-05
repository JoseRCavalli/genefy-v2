import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  UserPlus, Dna, X, Check, Clock, Beef, ArrowRight,
  Search, Trash2, Upload, FileText, AlertCircle, Zap, Sliders, Edit3
} from 'lucide-react';
import type { Bull, Female } from '../../lib/matching';
import {
  estimateCowPtas, calcCowRel, monthsToBreeding, fmt,
} from '../../lib/matching';
import type { FemaleRow } from '../../lib/supabase';
import { useClickOutside } from '../../hooks/useClickOutside';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

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
  onUpdateCategories: (dbId: string, categories: string[]) => Promise<unknown>;
  onUpdateNotes: (dbId: string, notes: string) => Promise<unknown>;
  viewMode?: 'register' | 'manage' | 'all';
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

function iaBadge(bdate: string | null | undefined): { label: string; cls: string; dotColor: string } | null {
  if (!bdate) return null;
  const months = monthsToBreeding(bdate);
  if (months === null) return null;
  if (months <= 0)  return { label: 'Pronta para IA', cls: 'bg-green-100 text-green-700 border-green-200', dotColor: 'bg-green-500' };
  if (months <= 6)  return { label: `IA em ${months}m`, cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', dotColor: 'bg-yellow-500' };
  return              { label: `IA em ${months}m`, cls: 'bg-gray-100 text-gray-500 border-gray-200', dotColor: 'bg-gray-400' };
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
  onUpdateCategories: (dbId: string, categories: string[]) => Promise<unknown>;
  onUpdateNotes: (dbId: string, notes: string) => Promise<unknown>;
  onEditIndices: () => void;
  onUpdateLactation: (lact: number) => Promise<unknown>;
}

function FemaleCard({ female, row, allBulls, onViewMatching, onRemove, onUpdateCategories, onUpdateNotes, onEditIndices, onUpdateLactation }: FemaleCardProps) {
  const sire = female.sire_naab ? allBulls.find(b => b.code === female.sire_naab) : null;
  const badge = iaBadge(row.bdate ?? female.bdate);
  const rel = Math.round((female._rel ?? calcCowRel(female)) * 100);

  const [localNotes, setLocalNotes] = useState(row.notes ?? '');
  const [showNotesEdit, setShowNotesEdit] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setLocalNotes(row.notes ?? '');
    setHasError(false);
  }, [row.notes]);

  async function handleSaveNotes() {
    setSavingNotes(true);
    setHasError(false);
    try {
      const err = await onUpdateNotes(row.id, localNotes);
      if (err) {
        setHasError(true);
      } else {
        setShowNotesEdit(false);
      }
    } catch {
      setHasError(true);
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-bold text-blue-900 text-sm">{female.id}</span>
          {row.name && <span className="text-gray-500 text-xs">{row.name}</span>}
          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-mono">REL {rel}%</span>
          {female.genomic && <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">🧬 Genoma</span>}
          {badge && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-1 border ${badge.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
              {badge.label}
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

        {/* Categorias Manual multi-select */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Destino:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'sexed_premium', label: 'Sexado Premium', dotColor: 'bg-green-500', activeCls: 'bg-green-100 text-green-800 border-green-300 font-semibold', inactiveCls: 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200' },
              { id: 'sexed_budget', label: 'Sexado Econômico', dotColor: 'bg-blue-500', activeCls: 'bg-blue-100 text-blue-800 border-blue-300 font-semibold', inactiveCls: 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200' },
              { id: 'conventional', label: 'Convencional', dotColor: 'bg-amber-500', activeCls: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold', inactiveCls: 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200' },
              { id: 'beef', label: 'Corte', dotColor: 'bg-red-500', activeCls: 'bg-red-100 text-red-800 border-red-300 font-semibold', inactiveCls: 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' },
            ].map(c => {
              const currentCats = female.categories ?? [];
              const isActive = currentCats.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={async () => {
                    const nextCats = isActive
                      ? currentCats.filter(x => x !== c.id)
                      : [...currentCats, c.id];
                    const err = await onUpdateCategories(row.id, nextCats);
                    if (err) {
                      alert(`Erro ao atualizar categorias: ${(err as any).message || err}\n\nPor favor, execute o seguinte comando SQL no editor do Supabase para criar a coluna:\n\nALTER TABLE females ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';`);
                    }
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer font-medium select-none flex items-center gap-1.5 ${isActive ? c.activeCls : c.inactiveCls}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dotColor}`} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lactação selector */}
        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Lactação:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 0, label: 'Novilha' },
              { id: 1, label: '1ª Lact' },
              { id: 2, label: '2ª Lact' },
              { id: 3, label: '3ª Lact+' },
            ].map(l => {
              const currentLact = row.lact ?? 0;
              const isActive = (l.id === 3 && currentLact >= 3) || (l.id < 3 && currentLact === l.id);
              return (
                <button
                  key={l.id}
                  onClick={async () => {
                    const err = await onUpdateLactation(l.id);
                    if (err) {
                      alert(`Erro ao atualizar lactação: ${(err as any).message || err}`);
                    }
                  }}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer font-medium select-none ${
                    isActive
                      ? 'bg-blue-100 text-blue-800 border-blue-300 font-semibold'
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Observações com fluxo de botões */}
        {showNotesEdit ? (
          <div className="mt-2.5 space-y-2">
            <div className="relative">
              <textarea
                value={localNotes}
                onChange={e => setLocalNotes(e.target.value)}
                placeholder="Adicionar observação..."
                rows={2}
                className={`w-full text-xs p-2.5 ${
                  hasError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/10'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50/30'
                } border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition-all`}
              />
              {hasError && (
                <div className="absolute right-2.5 top-2.5 text-red-500 flex items-center" title="Erro ao salvar observação">
                  <AlertCircle size={14} className="animate-pulse" />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setLocalNotes(row.notes ?? '');
                  setHasError(false);
                  setShowNotesEdit(false);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold border border-gray-200 text-gray-500 rounded-md hover:bg-gray-50 transition-colors cursor-pointer select-none"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1 cursor-pointer select-none disabled:opacity-50"
              >
                {savingNotes ? 'Salvando...' : 'Salvar anotações'}
              </button>
            </div>
          </div>
        ) : row.notes && row.notes.trim() !== '' ? (
          <div
            onClick={() => setShowNotesEdit(true)}
            className="mt-2.5 p-2 bg-blue-50/40 hover:bg-blue-50/75 border border-blue-100/50 rounded-lg text-xs text-gray-700 cursor-pointer flex items-start gap-2 group transition-colors"
            title="Clique para editar a observação"
          >
            <FileText size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 break-words">{row.notes}</div>
            <Edit3 size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 transition-opacity" />
          </div>
        ) : (
          <button
            onClick={() => setShowNotesEdit(true)}
            className="mt-2 text-xs text-gray-400 hover:text-blue-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <FileText size={13} />
            <span>Adicionar observação...</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          onClick={onViewMatching}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold cursor-pointer"
        >
          Ver matching <ArrowRight size={10} />
        </button>
        <button
          onClick={onEditIndices}
          className="flex items-center justify-center gap-1 px-2 py-1 text-xs border border-amber-200 text-amber-700 bg-amber-50/20 rounded hover:bg-amber-50 font-semibold cursor-pointer"
        >
          <Sliders size={10} /> Editar Índices
        </button>
        <button
          onClick={onRemove}
          className="flex items-center justify-center gap-1 px-2 py-1 text-xs border border-red-200 text-red-500 rounded hover:bg-red-50 font-semibold cursor-pointer"
        >
          <Trash2 size={10} /> Remover
        </button>
      </div>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────

export function HerdTab({
  females,
  femaleRows,
  allBulls,
  farmId,
  onUpsert,
  onDelete,
  onSelectFemale,
  onTabChange,
  onUpdateCategories,
  onUpdateNotes,
  viewMode = 'all'
}: Props) {
  const isRegister = viewMode === 'register' || viewMode === 'all';
  const isManage = viewMode === 'manage' || viewMode === 'all';

  const [subTab, setSubTab] = useState<'manual' | 'import'>('manual');

  // Filtro de categorias na aba Rebanho
  const [catFilter, setCatFilter] = useState<string[]>([
    'sexed_premium', 'sexed_budget', 'conventional', 'beef', 'none'
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [lactFilter, setLactFilter] = useState<string[]>(['0', '1', '2', '3+']);
  const [ginbFilter, setGinbFilter] = useState<string>('all');
  const [editingFemale, setEditingFemale] = useState<{ female: Female; row: FemaleRow } | null>(null);

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

  // Fêmeas custom (apenas as adicionadas pelo usuário)
  const customFemaleRows = useMemo(() => {
    if (IS_DEMO) {
      // Em demo mode, as linhas base têm id='female-{número}', as novas têm 'female-new-{timestamp}'
      return femaleRows.filter(r => r.id.startsWith('female-new-') || !r.id.match(/^female-\d+$/));
    }
    // Em Supabase mode, todas as femaleRows vêm do banco = custom
    return femaleRows;
  }, [femaleRows]);

  // Contagem de fêmeas customizadas por categoria
  const counts = useMemo(() => {
    const res = { sexed_premium: 0, sexed_budget: 0, conventional: 0, beef: 0, none: 0 };
    customFemaleRows.forEach(row => {
      const cats = row.categories ?? [];
      if (cats.length === 0) {
        res.none++;
      } else {
        cats.forEach(c => {
          if (c in res) {
            res[c as keyof typeof res]++;
          }
        });
      }
    });
    return res;
  }, [customFemaleRows]);

  // Fêmeas customizadas filtradas por categoria, busca, lactação e gINB
  const filteredCustomFemales = useMemo(() => {
    return customFemaleRows.filter(row => {
      // 1. Filtro de categoria
      const cats = row.categories ?? [];
      const matchesCategory = cats.length === 0
        ? catFilter.includes('none')
        : cats.some(c => catFilter.includes(c));

      if (!matchesCategory) return false;

      // 2. Filtro por Lactação
      const lactVal = row.lact ?? 0;
      let matchesLact = false;
      if (lactVal === 0) {
        matchesLact = lactFilter.includes('0');
      } else if (lactVal === 1) {
        matchesLact = lactFilter.includes('1');
      } else if (lactVal === 2) {
        matchesLact = lactFilter.includes('2');
      } else if (lactVal >= 3) {
        matchesLact = lactFilter.includes('3+');
      }
      if (!matchesLact) return false;

      // 3. Filtro por gINB
      const ginbVal = row.ginb;
      if (ginbFilter !== 'all') {
        if (ginbVal == null) {
          return false;
        }
        if (ginbFilter === 'low') {
          if (ginbVal >= 6.25) return false;
        } else if (ginbFilter === 'mid') {
          if (ginbVal < 6.25 || ginbVal > 8.0) return false;
        } else if (ginbFilter === 'high') {
          if (ginbVal <= 8.0) return false;
        }
      }

      // 4. Filtro de busca (por ID do animal ou nome)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatches = row.animal_id.toLowerCase().includes(q);
        const nameMatches = (row.name ?? '').toLowerCase().includes(q);
        return idMatches || nameMatches;
      }

      return true;
    });
  }, [customFemaleRows, catFilter, lactFilter, ginbFilter, searchQuery]);

  // Mapear rows para Female enriquecidos
  const customFemales: Female[] = useMemo(() =>
    filteredCustomFemales.map(r => {
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
        categories: r.categories ?? [],
        notes: r.notes ?? '',
        _custom: true,
        _rel: r.genomic ? 0.80 : undefined,
      };
      return estimateCowPtas(base, allBulls, females);
    }),
  [filteredCustomFemales, allBulls, females]);

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
      setImportMsg('Nenhum dado válido encontrado no CSV.');
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
    setImportMsg(`Sucesso: ${added} fêmea(s) importada(s)${skipped ? ` · ${skipped} ignorada(s) (já existiam)` : ''}`);
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
        <h2 className="text-lg font-bold text-blue-900">
          {viewMode === 'register' ? 'Cadastrar Rebanho' : 'Gerenciar Rebanho'}
        </h2>
        {isManage && (
          <span className="text-sm text-gray-400">
            {customFemaleRows.length} animal{customFemaleRows.length !== 1 ? 'is' : ''} cadastrado{customFemaleRows.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 -mt-2">
        {viewMode === 'register'
          ? 'Cadastre bezerras recém-nascidas ou vacas de qualquer fazenda — o sistema calcula a predição genética pelo pedigree na hora. Com genoma importado a confiabilidade sobe de 65% para 80%.'
          : 'Gerencie o destino das fêmeas do seu rebanho (Premium, Econômico, Convencional, Corte) e consulte seus índices genéticos.'}
      </p>

      {isRegister && (
        <>
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
                    <span className="font-semibold">Predição genética estimada (Parent Average):</span>{' '}
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
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors cursor-pointer
                    ${successId
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {successId
                    ? <><Check size={14} /> {successId} cadastrada!</>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload size={12} /> Carregar CSV
                  </button>
                  <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                  {csvText && (
                    <button
                      onClick={() => { setCsvText(''); setCsvPreview([]); }}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-xs rounded-lg hover:bg-gray-50 cursor-pointer"
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
                        <span className="font-semibold">{p.isNew ? 'nova' : 'já existe'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importMsg && (
                <div className={`p-3 rounded-lg text-sm bg-green-50 border border-green-200 text-green-800`}>
                  {importMsg}
                </div>
              )}

              <button
                onClick={handleImportCSV}
                disabled={importing || !csvText.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <Upload size={14} />
                {importing ? 'Importando…' : 'Importar Animais'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Lista de Animais Cadastrados ── */}
      {isManage && (
        <div className="space-y-4">
          {/* Resumo de Categorias (Cards) */}
          {customFemaleRows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'sexed_premium', label: 'Sexado Premium', count: counts.sexed_premium, color: 'text-green-700 border-green-100 bg-green-50/30', dotColor: 'bg-green-500' },
                { id: 'sexed_budget', label: 'Sexado Econômico', count: counts.sexed_budget, color: 'text-blue-700 border-blue-100 bg-blue-50/30', dotColor: 'bg-blue-500' },
                { id: 'conventional', label: 'Convencional', count: counts.conventional, color: 'text-amber-700 border-amber-100 bg-amber-50/30', dotColor: 'bg-amber-500' },
                { id: 'beef', label: 'Corte', count: counts.beef, color: 'text-red-700 border-red-100 bg-red-50/30', dotColor: 'bg-red-500' },
                { id: 'none', label: 'Sem Categoria', count: counts.none, color: 'text-gray-500 border-gray-100 bg-gray-50/30', dotColor: 'bg-gray-400' },
              ].map(card => (
                <div key={card.id} className={`p-3 border rounded-xl flex flex-col justify-between ${card.color}`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${card.dotColor}`} />
                    {card.label}
                  </span>
                  <span className="text-lg font-extrabold mt-1">{card.count} fêmea{card.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Barra de Filtros e Busca */}
          {customFemaleRows.length > 0 && (
            <div className="flex flex-col gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Mostrar apenas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'sexed_premium', label: 'Sexado Premium', count: counts.sexed_premium, dotColor: 'bg-green-500', activeCls: 'bg-green-600 text-white border-green-600', inactiveCls: 'bg-white text-green-700 border-green-200 hover:bg-green-50' },
                      { id: 'sexed_budget', label: 'Sexado Econômico', count: counts.sexed_budget, dotColor: 'bg-blue-500', activeCls: 'bg-blue-600 text-white border-blue-600', inactiveCls: 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50' },
                      { id: 'conventional', label: 'Convencional', count: counts.conventional, dotColor: 'bg-amber-500', activeCls: 'bg-amber-500 text-white border-[#d97706]', inactiveCls: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50' },
                      { id: 'beef', label: 'Corte', count: counts.beef, dotColor: 'bg-red-500', activeCls: 'bg-red-600 text-white border-red-600', inactiveCls: 'bg-white text-red-700 border-red-200 hover:bg-red-50' },
                      { id: 'none', label: 'Sem categoria', count: counts.none, dotColor: 'bg-gray-400', activeCls: 'bg-gray-600 text-white border-gray-600', inactiveCls: 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50' },
                    ].map(f => {
                      const isSelected = catFilter.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            if (isSelected) {
                              setCatFilter(catFilter.filter(x => x !== f.id));
                            } else {
                              setCatFilter([...catFilter, f.id]);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all flex items-center gap-1.5 ${isSelected ? f.activeCls : f.inactiveCls}`}
                        >
                          {!isSelected && <span className={`w-1.5 h-1.5 rounded-full ${f.dotColor}`} />}
                          {f.label} ({f.count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Barra de Busca de Fêmea por Número/ID ou Nome */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar fêmea por número/ID..."
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-gray-50/50"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setCatFilter(['sexed_premium', 'sexed_budget', 'conventional', 'beef', 'none']);
                      setLactFilter(['0', '1', '2', '3+']);
                      setGinbFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer shrink-0"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>

              {/* Linha 2: Filtros adicionais */}
              <div className="flex flex-wrap items-center gap-6 pt-2.5 border-t border-gray-100">
                {/* Filtro por Lactação */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Lactação:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: '0', label: 'Novilha' },
                      { id: '1', label: '1ª Lact' },
                      { id: '2', label: '2ª Lact' },
                      { id: '3+', label: '3ª Lact+' }
                    ].map(item => {
                      const isSelected = lactFilter.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (isSelected) {
                              setLactFilter(lactFilter.filter(x => x !== item.id));
                            } else {
                              setLactFilter([...lactFilter, item.id]);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtro por gINB */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">gINB:</span>
                  <select
                    value={ginbFilter}
                    onChange={e => setGinbFilter(e.target.value)}
                    className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 text-gray-700 font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <option value="all">Todos</option>
                    <option value="low">&lt; 6.25%</option>
                    <option value="mid">6.25–8%</option>
                    <option value="high">&gt; 8%</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Check size={14} className="text-green-600" />
              Animais Cadastrados
            </h3>
            {customFemaleRows.length > 0 && (
              <span className="text-xs text-gray-400">
                Exibindo {customFemales.length} de {customFemaleRows.length} fêmeas
              </span>
            )}
          </div>

          {customFemales.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
              {customFemaleRows.length === 0 ? (
                <>
                  Nenhum animal cadastrado ainda.<br />
                  <span className="text-xs mt-1 block">Vá na aba "Cadastrar Rebanho" para registrar nascimentos ou cadastrar vacas.</span>
                </>
              ) : (
                <>
                  Nenhum animal corresponde aos filtros de categoria ou busca selecionados.<br />
                  <span className="text-xs mt-1 block">Clique em "Limpar Filtros" para mostrar todos.</span>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {[...customFemales]
                .sort((a, b) => {
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
                      onUpdateCategories={onUpdateCategories}
                      onUpdateNotes={onUpdateNotes}
                      onEditIndices={() => setEditingFemale({ female: f, row })}
                      onUpdateLactation={(lact) => onUpsert(farmId, { ...row, lact, is_primiparous: lact === 0 })}
                    />
                  );
                })}
            </div>
          )}
        </div>
      )}

      {editingFemale && (
        <EditFemaleModal
          female={editingFemale.female}
          row={editingFemale.row}
          allBulls={allBulls}
          onClose={() => setEditingFemale(null)}
          onSave={async (updated) => {
            const err = await onUpsert(farmId, {
              ...editingFemale.row,
              ...updated,
              animal_id: editingFemale.female.id,
            });
            return err;
          }}
        />
      )}
    </div>
  );
}

// ── Modal de Edição de Índices da Fêmea ────────────────────────────────────────

interface EditFemaleModalProps {
  female: Female;
  row: FemaleRow;
  allBulls: Bull[];
  onClose: () => void;
  onSave: (updated: Partial<FemaleRow>) => Promise<unknown>;
}

function EditFemaleModal({ female, row, allBulls, onClose, onSave }: EditFemaleModalProps) {
  const [form, setForm] = useState({
    name: row.name ?? '',
    breed: row.breed ?? 'HO',
    lact: String(row.lact ?? 0),
    bdate: row.bdate ?? '',
    genomic: row.genomic ?? false,
    sire_naab: row.sire_naab ?? '',
    mgs_naab: row.mgs_naab ?? '',
    mmgs_naab: row.mmgs_naab ?? '',
    dam_animal_id: row.dam_animal_id ?? '',
    net_merit: row.net_merit != null ? String(row.net_merit) : '',
    tpi: row.tpi != null ? String(row.tpi) : '',
    milk: row.milk != null ? String(row.milk) : '',
    fat: row.fat != null ? String(row.fat) : '',
    protein: row.protein != null ? String(row.protein) : '',
    productive_life: row.productive_life != null ? String(row.productive_life) : '',
    scs: row.scs != null ? String(row.scs) : '',
    dpr: row.dpr != null ? String(row.dpr) : '',
    ginb: row.ginb != null ? String(row.ginb) : '',
    udc: row.udc != null ? String(row.udc) : '',
    flc: row.flc != null ? String(row.flc) : '',
    ptat: row.ptat != null ? String(row.ptat) : '',
    beta_casein: row.beta_casein ?? '',
    kappa_casein: row.kappa_casein ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const numOrNull = (v: string) => v.trim() === '' ? null : parseFloat(v);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const updatedData: Partial<FemaleRow> = {
      name: form.name.trim() || null,
      breed: form.breed,
      lact: parseInt(form.lact) || 0,
      bdate: form.bdate || null,
      genomic: form.genomic,
      sire_naab: form.sire_naab.trim() || null,
      mgs_naab: form.mgs_naab.trim() || null,
      mmgs_naab: form.mmgs_naab.trim() || null,
      dam_animal_id: form.dam_animal_id.trim() || null,
      net_merit: numOrNull(form.net_merit),
      tpi: numOrNull(form.tpi),
      milk: numOrNull(form.milk),
      fat: numOrNull(form.fat),
      protein: numOrNull(form.protein),
      productive_life: numOrNull(form.productive_life),
      scs: numOrNull(form.scs),
      dpr: numOrNull(form.dpr),
      ginb: numOrNull(form.ginb),
      udc: numOrNull(form.udc),
      flc: numOrNull(form.flc),
      ptat: numOrNull(form.ptat),
      beta_casein: form.beta_casein.trim() || null,
      kappa_casein: form.kappa_casein.trim() || null,
    };

    try {
      const err = await onSave(updatedData);
      if (err) {
        setError(typeof err === 'object' && 'message' in (err as any) ? (err as any).message : String(err));
      } else {
        onClose();
      }
    } catch (ex) {
      setError(String(ex));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-blue-900">
              Editar Índices da Fêmea: <span className="font-mono text-blue-600">{female.id}</span>
            </h3>
            {row.name && <p className="text-xs text-gray-400 mt-0.5">{row.name}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Seção 1: Identificação */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-gray-100 pb-1">Identificação & Lactação</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Número / ID</label>
                <input
                  type="text"
                  value={female.id}
                  disabled
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-50 text-gray-400 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Estrela"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Raça</label>
                <select
                  value={form.breed}
                  onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="HO">Holandês (HO)</option>
                  <option value="JE">Jersey (JE)</option>
                  <option value="MX">Misto</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Lactação</label>
                <input
                  type="number"
                  min="0"
                  value={form.lact}
                  onChange={e => setForm(f => ({ ...f, lact: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Data de Nascimento</label>
                <input
                  type="date"
                  value={form.bdate}
                  onChange={e => setForm(f => ({ ...f, bdate: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={form.genomic}
                    onChange={e => setForm(f => ({ ...f, genomic: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  Possui Teste Genômico (🧬 Genoma)
                </label>
              </div>
            </div>
          </div>

          {/* Seção 2: Pedigree */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-gray-100 pb-1">Pedigree</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Pai (NAAB)</label>
                <BullAutocomplete
                  value={form.sire_naab}
                  onChange={v => setForm(f => ({ ...f, sire_naab: v }))}
                  onSelect={b => setForm(f => ({ ...f, sire_naab: b.code }))}
                  allBulls={allBulls}
                  placeholder="Código NAAB"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Mãe (ID)</label>
                <input
                  type="text"
                  value={form.dam_animal_id}
                  onChange={e => setForm(f => ({ ...f, dam_animal_id: e.target.value }))}
                  placeholder="Ex: 1200"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">MGS (NAAB)</label>
                <input
                  type="text"
                  value={form.mgs_naab}
                  onChange={e => setForm(f => ({ ...f, mgs_naab: e.target.value }))}
                  placeholder="Ex: 7HO12111"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">MMGS (NAAB)</label>
                <input
                  type="text"
                  value={form.mmgs_naab}
                  onChange={e => setForm(f => ({ ...f, mmgs_naab: e.target.value }))}
                  placeholder="Ex: 11HO11222"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Índices Genéticos */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-gray-100 pb-1">Índices Genéticos</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Leite (lbs)</label>
                <input
                  type="number"
                  value={form.milk}
                  onChange={e => setForm(f => ({ ...f, milk: e.target.value }))}
                  placeholder="Ex: 664"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Net Merit (NM$)</label>
                <input
                  type="number"
                  value={form.net_merit}
                  onChange={e => setForm(f => ({ ...f, net_merit: e.target.value }))}
                  placeholder="Ex: 462"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">TPI / GTPI</label>
                <input
                  type="number"
                  value={form.tpi}
                  onChange={e => setForm(f => ({ ...f, tpi: e.target.value }))}
                  placeholder="Ex: 2750"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">gINB (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.ginb}
                  onChange={e => setForm(f => ({ ...f, ginb: e.target.value }))}
                  placeholder="Ex: 11.2"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">DPR</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.dpr}
                  onChange={e => setForm(f => ({ ...f, dpr: e.target.value }))}
                  placeholder="Ex: 0.8"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Vida Produtiva (PL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.productive_life}
                  onChange={e => setForm(f => ({ ...f, productive_life: e.target.value }))}
                  placeholder="Ex: 3.5"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Cél. Somáticas (SCS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.scs}
                  onChange={e => setForm(f => ({ ...f, scs: e.target.value }))}
                  placeholder="Ex: 2.85"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Gordura (lbs)</label>
                <input
                  type="number"
                  value={form.fat}
                  onChange={e => setForm(f => ({ ...f, fat: e.target.value }))}
                  placeholder="Ex: 50"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Proteína (lbs)</label>
                <input
                  type="number"
                  value={form.protein}
                  onChange={e => setForm(f => ({ ...f, protein: e.target.value }))}
                  placeholder="Ex: 40"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Úbere (UDC)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.udc}
                  onChange={e => setForm(f => ({ ...f, udc: e.target.value }))}
                  placeholder="Ex: 1.25"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Pernas e Pés (FLC)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.flc}
                  onChange={e => setForm(f => ({ ...f, flc: e.target.value }))}
                  placeholder="Ex: 0.85"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">PTAT</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.ptat}
                  onChange={e => setForm(f => ({ ...f, ptat: e.target.value }))}
                  placeholder="Ex: 1.50"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Caseínas */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-gray-100 pb-1">Caseínas</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Beta-Caseína</label>
                <input
                  type="text"
                  value={form.beta_casein}
                  onChange={e => setForm(f => ({ ...f, beta_casein: e.target.value }))}
                  placeholder="Ex: A2A2, A1A2"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Kappa-Caseína</label>
                <input
                  type="text"
                  value={form.kappa_casein}
                  onChange={e => setForm(f => ({ ...f, kappa_casein: e.target.value }))}
                  placeholder="Ex: BB, AB"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer select-none"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors cursor-pointer select-none flex items-center gap-1.5"
          >
            {saving ? (
              <><Clock size={14} /> Salvando...</>
            ) : (
              <><Check size={14} /> Salvar Índices</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
