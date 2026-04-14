import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import type { MatchResult, Female } from '../../lib/matching';
import { progenyProfile, inbClass, getCarrierHaplotypes, fmt, fmtPppv, pppvClass } from '../../lib/matching';

interface Props {
  result: MatchResult;
  rank: 1 | 2 | 3;
  female: Female;
  isEconomic?: boolean;
  onSave?: (result: MatchResult, rank: number, isSexed: boolean) => Promise<void>;
}

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function BullOptionCard({ result, rank, female, isEconomic, onSave }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSexed, setIsSexed] = useState(false);
  const { bull } = result;
  // inb() já retorna valor em % (ex: 7.81) — não multiplicar por 100
  const inbPct = result.inbreeding ?? 0;
  const inb = inbClass(inbPct);
  const carriers = getCarrierHaplotypes(bull);
  const progeny = expanded ? progenyProfile(female, bull) : [];

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    await onSave(result, rank, isSexed);
    setSaving(false);
  }

  return (
    <div className={`rounded-xl border-2 bg-white shadow-sm transition-all ${
      rank === 1 ? 'border-[#C9A84C]' : rank === 2 ? 'border-[#2E6DA4]/40' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{MEDAL[rank]}</span>
            <div>
              <div className="font-bold text-blue-dark">{bull.code}</div>
              <div className="text-xs text-gray-500 truncate max-w-[160px]">{bull.name ?? bull.short_name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-mid">{result.score.toFixed(2)}</div>
            <div className="text-xs text-gray-400">score</div>
          </div>
        </div>

        {isEconomic && rank === 3 && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
            <DollarSign size={11} /> Econômica
          </div>
        )}

        {/* Stats grid */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-gray-50 rounded p-1.5 text-center">
            <div className="text-gray-400">GTPI</div>
            <div className="font-semibold">{bull.gtpi ?? '—'}</div>
          </div>
          <div className="bg-gray-50 rounded p-1.5 text-center">
            <div className="text-gray-400">NM$</div>
            <div className="font-semibold">{fmt(bull.net_merit, 0)}</div>
          </div>
          <div className={`rounded p-1.5 text-center ${inb.cls}`}>
            <div className="opacity-70">Inb</div>
            <div className="font-semibold">{inbPct.toFixed(1)}%</div>
          </div>
          <div className="bg-gray-50 rounded p-1.5 text-center">
            <div className="text-gray-400">REL%</div>
            <div className="font-semibold">{bull.reliability != null ? `${bull.reliability}%` : '—'}</div>
          </div>
          <div className="bg-gray-50 rounded p-1.5 text-center">
            <div className="text-gray-400">Leite</div>
            <div className="font-semibold">{fmt(bull.milk, 0)}</div>
          </div>
          <div className="bg-gray-50 rounded p-1.5 text-center">
            <div className="text-gray-400">DPR</div>
            <div className="font-semibold">{fmt(bull.dpr, 1)}</div>
          </div>
        </div>

        {/* HH + Casein badges */}
        <div className="mt-2 flex flex-wrap gap-1">
          {carriers.length === 0 ? (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px]">
              <CheckCircle size={9} /> HH Livre
            </span>
          ) : (
            carriers.map(hh => (
              <span key={hh} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px]">
                <AlertTriangle size={9} /> {hh}
              </span>
            ))
          )}
          {bull.beta_casein && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">{bull.beta_casein}</span>
          )}
          {bull.kappa_casein && (
            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px]">{bull.kappa_casein}</span>
          )}
          {bull.price_per_dose != null && (
            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px]">
              R$ {bull.price_per_dose.toFixed(0)}/dose
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-blue-mid hover:underline"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Ocultar' : 'Ver'} perfil da progênie
          </button>
          {onSave && (
            <div className="ml-auto flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={isSexed} onChange={e => setIsSexed(e.target.checked)} className="accent-purple-600" />
                Sexado
              </label>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 bg-[#1B3A5C] text-white text-xs rounded hover:bg-blue-mid disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progeny Profile */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="text-xs font-semibold text-gray-500 mb-2">Perfil da Progênie (PTA + PPPV)</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {progeny.map(p => (
              <div key={p.label} className="flex justify-between bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-500">{p.label}</span>
                <span className={`font-medium ${pppvClass(p.pppv) === 'hi' ? 'text-green-700' : pppvClass(p.pppv) === 'lo' ? 'text-red-600' : 'text-gray-700'}`}>
                  {fmt(p.pta, p.label.includes('%') ? 2 : 0)} ({fmtPppv(p.pppv)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
