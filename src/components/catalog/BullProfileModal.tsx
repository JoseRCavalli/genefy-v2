import { useEffect } from 'react';
import { X, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Bull } from '../../lib/matching';
import { norm, calcCowRel, getCarrierHaplotypes } from '../../lib/matching';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IndexDef {
  key: string;
  label: string;
  unit?: string;
  hi: boolean;
  decimals?: number;
  prefix?: string;
}

interface Section {
  title: string;
  indices: IndexDef[];
}

interface Props {
  bull: Bull | null;
  inTank?: boolean;
  onClose: () => void;
  onAddToTank?: () => void;
}

// ─── Index definitions ─────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    title: 'Econômico',
    indices: [
      { key: 'gtpi',     label: 'GTPI',           unit: 'pts', hi: true,  decimals: 0 },
      { key: 'net_merit',label: 'Net Merit',       unit: '$',   hi: true,  decimals: 0, prefix: '$' },
    ],
  },
  {
    title: 'Produção',
    indices: [
      { key: 'milk',         label: 'Leite',            unit: 'lbs', hi: true,  decimals: 0 },
      { key: 'fat',          label: 'Gordura',          unit: 'lbs', hi: true,  decimals: 1 },
      { key: 'protein',      label: 'Proteína',         unit: 'lbs', hi: true,  decimals: 1 },
      { key: 'fat_pct',      label: 'Gordura %',        unit: '%',   hi: true,  decimals: 2 },
      { key: 'protein_pct',  label: 'Proteína %',       unit: '%',   hi: true,  decimals: 2 },
    ],
  },
  {
    title: 'Saúde & Longevidade',
    indices: [
      { key: 'productive_life',   label: 'Vida Produtiva',    unit: 'meses', hi: true,  decimals: 1 },
      { key: 'scs',               label: 'SCS (Mastite)',     unit: '',      hi: false, decimals: 2 },
      { key: 'dpr',               label: 'DPR',               unit: '',      hi: true,  decimals: 1 },
      { key: 'hcr',               label: 'HCR',               unit: '%',     hi: true,  decimals: 1 },
      { key: 'ccr',               label: 'CCR',               unit: '%',     hi: true,  decimals: 1 },
      { key: 'fertility_index',   label: 'Fertilidade',       unit: '',      hi: true,  decimals: 1 },
      { key: 'cow_livability',    label: 'Vivabilidade',      unit: '',      hi: true,  decimals: 1 },
    ],
  },
  {
    title: 'Conformação',
    indices: [
      { key: 'ptat', label: 'PTAT',            unit: '', hi: true, decimals: 2 },
      { key: 'udc',  label: 'UDC — Úbere',     unit: '', hi: true, decimals: 2 },
      { key: 'flc',  label: 'FLC — Pernas',    unit: '', hi: true, decimals: 2 },
    ],
  },
  {
    title: 'Eficiência & Parto',
    indices: [
      { key: 'feed_saved',         label: 'Feed Saved',        unit: 'lbs/ano', hi: true,  decimals: 0 },
      { key: 'sire_calving_ease',  label: 'Fac. Parto (SCE)',  unit: '',        hi: false, decimals: 1 },
      { key: 'gfi',                label: 'GFI (Consang.)',    unit: '%',       hi: false, decimals: 2 },
    ],
  },
];

// ─── Bar color ─────────────────────────────────────────────────────────────────

function barColor(pct: number) {
  if (pct >= 75) return { fill: '#16a34a', glow: 'rgba(22,163,74,0.35)',  track: 'rgba(22,163,74,0.10)' };
  if (pct >= 50) return { fill: '#2E6DA4', glow: 'rgba(46,109,164,0.30)', track: 'rgba(46,109,164,0.10)' };
  if (pct >= 25) return { fill: '#b45309', glow: 'rgba(180,83,9,0.30)',   track: 'rgba(180,83,9,0.10)' };
  return             { fill: '#dc2626', glow: 'rgba(220,38,38,0.28)',  track: 'rgba(220,38,38,0.10)' };
}

// ─── Format value ──────────────────────────────────────────────────────────────

function fmtVal(v: number | null | undefined, def: IndexDef): string {
  if (v == null) return '—';
  const n = parseFloat(String(v));
  const formatted = def.decimals === 0 ? Math.round(n).toString() : n.toFixed(def.decimals ?? 1);
  const sign = def.hi && n > 0 ? '+' : '';
  const prefix = def.prefix ?? '';
  return `${prefix}${sign}${formatted}`;
}

// ─── Single index row ──────────────────────────────────────────────────────────

function IndexRow({ bull, def }: { bull: Bull; def: IndexDef }) {
  const raw = (bull as Record<string, unknown>)[def.key] as number | null | undefined;
  const pct = raw != null ? norm(raw, def.key) : null;
  const colors = pct != null ? barColor(pct) : null;
  const label = fmtVal(raw, def);

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(30,58,92,0.06)' }}>
      {/* Label */}
      <div style={{
        width: '160px', flexShrink: 0,
        fontFamily: "'Inter', sans-serif", fontSize: '11.5px',
        color: '#4B5563', letterSpacing: '0.01em', lineHeight: 1.3, paddingRight: '12px',
      }}>
        {def.label}
      </div>

      {/* Value */}
      <div style={{
        width: '72px', flexShrink: 0, textAlign: 'right', paddingRight: '14px',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        fontSize: '11.5px', fontWeight: 600, letterSpacing: '-0.01em',
        color: pct == null ? '#9CA3AF'
          : pct >= 75 ? '#15803d'
          : pct >= 50 ? '#1B3A5C'
          : pct >= 25 ? '#92400e'
          : '#b91c1c',
      }}>
        {label}
        {def.unit && raw != null && (
          <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '9.5px', marginLeft: '2px' }}>
            {def.unit}
          </span>
        )}
      </div>

      {/* Bar */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: '20px' }}>
        {pct != null && colors ? (
          <div style={{
            width: '100%', height: '6px', borderRadius: '3px',
            backgroundColor: colors.track, overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.max(2, pct)}%`, height: '100%', borderRadius: '3px',
              backgroundColor: colors.fill, boxShadow: `0 0 6px 0 ${colors.glow}`,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        ) : (
          <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(30,58,92,0.07)' }} />
        )}
      </div>

      {/* Percentile */}
      <div style={{
        width: '32px', flexShrink: 0, textAlign: 'right', paddingLeft: '8px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#9CA3AF',
      }}>
        {pct != null ? `${Math.round(pct)}%` : ''}
      </div>
    </div>
  );
}

// ─── Genetic info row ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: '10px',
      padding: '5px 0', borderBottom: '1px solid rgba(30,58,92,0.06)',
    }}>
      <span style={{ width: '160px', flexShrink: 0, fontFamily: "'Inter', sans-serif", fontSize: '11.5px', color: '#4B5563' }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: '11.5px', fontWeight: 600,
        color: value ? '#1B3A5C' : '#9CA3AF', letterSpacing: '0.04em',
      }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', marginTop: '20px' }}>
      <span style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#6B7280',
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(30,58,92,0.12)' }} />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function BullProfileModal({ bull, inTank = false, onClose, onAddToTank }: Props) {
  const isOpen = bull != null;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const rel = bull?.reliability ?? null;
  const carriers = bull ? getCarrierHaplotypes(bull) : [];
  const name = bull?.short_name ?? bull?.name ?? null;
  const fullName = bull?.full_name ?? null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;600&display=swap');

        .bpm-overlay {
          position: fixed; inset: 0;
          background: rgba(10, 20, 35, 0.48);
          backdrop-filter: blur(2px);
          z-index: 1000; opacity: 0; pointer-events: none;
          transition: opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bpm-overlay.open { opacity: 1; pointer-events: all; }

        .bpm-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: 500px; max-width: 100vw;
          background: #FAFBFC;
          border-left: 1px solid rgba(30,58,92,0.13);
          box-shadow: -4px 0 32px rgba(10,20,35,0.12), -1px 0 4px rgba(10,20,35,0.06);
          z-index: 1001; display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .bpm-drawer.open { transform: translateX(0); }

        .bpm-body {
          flex: 1; overflow-y: auto; padding: 0 24px 24px;
          scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent;
        }

        @media (max-width: 540px) { .bpm-drawer { width: 100vw; } }

        .bpm-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 3px;
          font-family: 'Inter', sans-serif; font-size: 10.5px;
          font-weight: 600; letter-spacing: 0.03em;
        }

        .bpm-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; background: #1B3A5C; color: #fff;
          border: none; border-radius: 4px;
          font-family: 'Inter', sans-serif; font-size: 12.5px;
          font-weight: 600; letter-spacing: 0.03em;
          cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease;
        }
        .bpm-btn-primary:hover { background: #2E6DA4; box-shadow: 0 2px 10px rgba(46,109,164,0.35); }
        .bpm-btn-primary:disabled { opacity: 0.5; cursor: default; }

        .bpm-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; background: transparent; color: #6B7280;
          border: 1px solid rgba(30,58,92,0.18); border-radius: 4px;
          font-family: 'Inter', sans-serif; font-size: 12.5px;
          cursor: pointer; transition: background 0.15s ease, color 0.15s ease;
        }
        .bpm-btn-ghost:hover { background: rgba(30,58,92,0.05); color: #1B3A5C; }

        .bpm-close-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 3px;
          border: 1px solid rgba(30,58,92,0.15);
          background: transparent; color: #6B7280; cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease; flex-shrink: 0;
        }
        .bpm-close-btn:hover { background: rgba(30,58,92,0.07); color: #1B3A5C; }

        .bpm-rel-track {
          width: 100%; height: 3px; background: rgba(30,58,92,0.10);
          border-radius: 2px; margin-top: 4px; overflow: hidden;
        }
        .bpm-rel-fill {
          height: 100%; border-radius: 2px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bpm-hh-chip {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 2px 7px; border-radius: 3px; font-size: 10px;
          font-family: 'JetBrains Mono', monospace; font-weight: 600; letter-spacing: 0.03em;
        }
      `}</style>

      {/* Overlay */}
      <div className={`bpm-overlay${isOpen ? ' open' : ''}`} onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div
        className={`bpm-drawer${isOpen ? ' open' : ''}`}
        role="dialog" aria-modal="true"
        aria-label={bull ? `Perfil genético — Touro ${bull.code}` : 'Perfil genético'}
      >
        {bull && (
          <>
            {/* ── Header ── */}
            <div style={{
              padding: '18px 24px 16px',
              borderBottom: '1px solid rgba(30,58,92,0.10)',
              background: '#fff', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Code + name */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '17px', fontWeight: 700, color: '#1B3A5C', letterSpacing: '-0.02em',
                    }}>
                      {bull.code}
                    </span>
                    {name && (
                      <span style={{
                        fontFamily: "'Inter', sans-serif", fontSize: '12.5px',
                        color: '#6B7280', fontStyle: 'italic', letterSpacing: '0.01em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px',
                      }}>
                        {name}
                      </span>
                    )}
                  </div>
                  {fullName && fullName !== name && (
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontSize: '10.5px',
                      color: '#9CA3AF', marginTop: '2px', letterSpacing: '0.01em',
                    }}>
                      {fullName}
                    </div>
                  )}

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {bull.catalog && (
                      <span className="bpm-badge" style={{ background: 'rgba(30,58,92,0.08)', color: '#1B3A5C' }}>
                        {bull.catalog}
                      </span>
                    )}
                    {bull._custom && (
                      <span className="bpm-badge" style={{ background: 'rgba(201,168,76,0.12)', color: '#92400e' }}>
                        Manual
                      </span>
                    )}
                    {inTank && (
                      <span className="bpm-badge" style={{ background: 'rgba(22,163,74,0.10)', color: '#15803d' }}>
                        No botijão
                      </span>
                    )}
                    {bull.beta_casein && (
                      <span className="bpm-badge" style={{ background: 'rgba(59,130,246,0.08)', color: '#1d4ed8' }}>
                        {bull.beta_casein}
                      </span>
                    )}
                    {bull.kappa_casein && (
                      <span className="bpm-badge" style={{ background: 'rgba(126,34,206,0.08)', color: '#7c3aed' }}>
                        {bull.kappa_casein}
                      </span>
                    )}
                  </div>

                  {/* REL% bar */}
                  {rel != null && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: "'Inter', sans-serif", fontSize: '10px',
                          letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF',
                        }}>
                          Confiabilidade
                        </span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
                          fontWeight: 600, color: rel >= 70 ? '#2E6DA4' : '#6B7280',
                        }}>
                          {rel}%
                        </span>
                      </div>
                      <div className="bpm-rel-track">
                        <div className="bpm-rel-fill" style={{
                          width: `${rel}%`,
                          background: rel >= 90 ? '#7c3aed' : rel >= 70 ? '#2E6DA4' : '#6B7280',
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                <button className="bpm-close-btn" onClick={onClose} aria-label="Fechar">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="bpm-body">

              {SECTIONS.map(section => (
                <div key={section.title}>
                  <SectionHeader title={section.title} />
                  {section.indices.map(def => (
                    <IndexRow key={def.key} bull={bull} def={def} />
                  ))}
                </div>
              ))}

              {/* Genetics */}
              <div>
                <SectionHeader title="Genética & Haplótipos" />
                <InfoRow label="Beta-Caseína" value={bull.beta_casein as string | null} />
                <InfoRow label="Kappa-Caseína" value={bull.kappa_casein as string | null} />

                {/* HH chips */}
                <div style={{
                  display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '8px 0',
                  borderBottom: '1px solid rgba(30,58,92,0.06)',
                }}>
                  <span style={{
                    width: '160px', flexShrink: 0,
                    fontFamily: "'Inter', sans-serif", fontSize: '11.5px', color: '#4B5563',
                    alignSelf: 'center',
                  }}>
                    Haplótipos Letais
                  </span>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {(['HH1','HH2','HH3','HH4','HH5','HH6'] as const).map(hh => {
                      const val = (bull as Record<string, unknown>)[hh] as string | undefined;
                      const isCarrier = val === 'Carrier';
                      return (
                        <span key={hh} className="bpm-hh-chip" style={{
                          background: isCarrier ? 'rgba(220,38,38,0.10)' : 'rgba(22,163,74,0.10)',
                          color: isCarrier ? '#b91c1c' : '#15803d',
                        }}>
                          {isCarrier
                            ? <AlertTriangle size={9} style={{ flexShrink: 0 }} />
                            : <CheckCircle size={9} style={{ flexShrink: 0 }} />
                          }
                          {hh}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {carriers.length > 0 && (
                  <div style={{
                    marginTop: '10px', padding: '8px 12px',
                    background: 'rgba(220,38,38,0.05)',
                    border: '1px solid rgba(220,38,38,0.15)',
                    borderRadius: '4px',
                    fontFamily: "'Inter', sans-serif", fontSize: '11.5px', color: '#b91c1c',
                  }}>
                    Portador de: <strong>{carriers.join(', ')}</strong> — Evitar acasalamento com fêmeas portadoras.
                  </div>
                )}
              </div>

              {/* Legend */}
              <div style={{
                marginTop: '24px', padding: '12px 14px',
                background: 'rgba(30,58,92,0.04)',
                border: '1px solid rgba(30,58,92,0.08)', borderRadius: '4px',
              }}>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '10px',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#9CA3AF', marginBottom: '8px',
                }}>
                  Legenda — Posição relativa à raça
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Top quartil',      fill: '#16a34a' },
                    { label: 'Acima da média',   fill: '#2E6DA4' },
                    { label: 'Abaixo da média',  fill: '#b45309' },
                    { label: 'Quartil inferior', fill: '#dc2626' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '22px', height: '5px', borderRadius: '3px',
                        backgroundColor: item.fill, boxShadow: `0 0 5px ${item.fill}66`,
                      }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10.5px', color: '#6B7280' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div style={{
              padding: '14px 24px', borderTop: '1px solid rgba(30,58,92,0.10)',
              background: '#fff', display: 'flex', gap: '10px',
              justifyContent: 'flex-end', flexShrink: 0,
            }}>
              <button className="bpm-btn-ghost" onClick={onClose}>
                Fechar
              </button>
              {onAddToTank && (
                <button
                  className="bpm-btn-primary"
                  onClick={() => { onAddToTank(); onClose(); }}
                  disabled={inTank}
                  title={inTank ? 'Já está no botijão' : 'Adicionar ao botijão'}
                >
                  {inTank ? 'No botijão' : 'Adicionar ao botijão'}
                  {!inTank && <ArrowRight size={13} />}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
