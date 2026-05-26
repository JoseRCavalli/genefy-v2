import { useEffect } from 'react';
import { X, ArrowRight, Dna, Star } from 'lucide-react';
import type { Female } from '../../lib/matching';
import { norm, calcCowRel } from '../../lib/matching';
import type { FemaleRow } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IndexDef {
  key: string;
  label: string;
  unit?: string;
  hi: boolean;          // true = higher is better
  decimals?: number;
  prefix?: string;
}

interface Section {
  title: string;
  indices: IndexDef[];
}

interface Props {
  female: Female | null;
  femaleRow: FemaleRow | undefined;
  onClose: () => void;
  onGoToMatching: () => void;
}

// ─── Index definitions ────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    title: 'Econômico',
    indices: [
      { key: 'net_merit', label: 'Net Merit', unit: '$', hi: true, decimals: 0, prefix: '$' },
      { key: 'tpi',       label: 'TPI',       unit: 'pts', hi: true, decimals: 0 },
      { key: 'cheese_merit', label: 'Mérito Queijo', unit: '$', hi: true, decimals: 0, prefix: '$' },
      { key: 'fluid_merit',  label: 'Mérito Fluido', unit: '$', hi: true, decimals: 0, prefix: '$' },
      { key: 'gefi',      label: 'GEFI',      unit: '%', hi: false, decimals: 1 },
    ],
  },
  {
    title: 'Produção',
    indices: [
      { key: 'milk',    label: 'Leite',     unit: 'lbs', hi: true, decimals: 0 },
      { key: 'fat',     label: 'Gordura',   unit: 'lbs', hi: true, decimals: 1 },
      { key: 'fat_pct', label: 'Gordura %', unit: '%',   hi: true, decimals: 2 },
      { key: 'protein', label: 'Proteína',  unit: 'lbs', hi: true, decimals: 1 },
      { key: 'protein_pct', label: 'Proteína %', unit: '%', hi: true, decimals: 2 },
      { key: 'feed_efficiency', label: 'Efic. Alimentar', unit: '$', hi: true, decimals: 0 },
    ],
  },
  {
    title: 'Saúde & Longevidade',
    indices: [
      { key: 'productive_life',  label: 'Vida Produtiva',  unit: 'meses', hi: true,  decimals: 1 },
      { key: 'scs',              label: 'SCS (Mastite)',    unit: '',      hi: false, decimals: 2 },
      { key: 'mastitis',         label: 'Resist. Mastite',  unit: '',      hi: true,  decimals: 2 },
      { key: 'health_index',     label: 'Índice de Saúde',  unit: '',      hi: true,  decimals: 1 },
      { key: 'livability',       label: 'Sobrev. Vacas',    unit: '%',     hi: true,  decimals: 2 },
      { key: 'heifer_livability', label: 'Sobrev. Novilhas', unit: '%',    hi: true,  decimals: 2 },
    ],
  },
  {
    title: 'Fertilidade',
    indices: [
      { key: 'dpr',              label: 'DPR',              unit: '',      hi: true,  decimals: 1 },
      { key: 'hcr',              label: 'HCR',              unit: '%',     hi: true,  decimals: 1 },
      { key: 'ccr',              label: 'CCR',              unit: '%',     hi: true,  decimals: 1 },
      { key: 'fertility_index',  label: 'Fertilidade',      unit: '',      hi: true,  decimals: 1 },
      { key: 'early_first_calving', label: 'Idade 1º Parto', unit: '',    hi: true,  decimals: 2 },
    ],
  },
  {
    title: 'Parto',
    indices: [
      { key: 'sire_calving_ease',     label: 'Fac. Parto — Touro', unit: '%', hi: false, decimals: 2 },
      { key: 'daughter_calving_ease',  label: 'Fac. Parto — Filha', unit: '%', hi: false, decimals: 2 },
      { key: 'sire_stillbirth',        label: 'Natimorto — Touro',  unit: '%', hi: false, decimals: 2 },
      { key: 'daughter_stillbirth',    label: 'Natimorto — Filha',  unit: '%', hi: false, decimals: 2 },
    ],
  },
  {
    title: 'Conformação — Compostos',
    indices: [
      { key: 'ptat', label: 'PTAT — Tipo',       unit: '', hi: true, decimals: 2 },
      { key: 'udc',  label: 'UDC — Úbere',       unit: '', hi: true, decimals: 2 },
      { key: 'flc',  label: 'FLC — Pernas',      unit: '', hi: true, decimals: 2 },
      { key: 'bde',  label: 'BDE — Corporal',    unit: '', hi: true, decimals: 2 },
      { key: 'dfm',  label: 'DFM — Leiteiro',    unit: '', hi: true, decimals: 2 },
    ],
  },
  {
    title: 'Conformação — Traits',
    indices: [
      { key: 'sta',     label: 'Estatura',               unit: '', hi: true, decimals: 2 },
      { key: 'str_val', label: 'Força',                   unit: '', hi: true, decimals: 2 },
      { key: 'fua',     label: 'Ins. Úbere Anterior',    unit: '', hi: true, decimals: 2 },
      { key: 'ruh',     label: 'Alt. Úbere Posterior',   unit: '', hi: true, decimals: 2 },
      { key: 'ruw',     label: 'Larg. Úbere Posterior',  unit: '', hi: true, decimals: 2 },
      { key: 'ucl',     label: 'Ligamento Central',       unit: '', hi: true, decimals: 2 },
      { key: 'udp',     label: 'Prof. Úbere',            unit: '', hi: true, decimals: 2 },
      { key: 'fls',     label: 'Pernas Vista Lateral',    unit: '', hi: true, decimals: 2 },
      { key: 'rls',     label: 'Pernas Vista Posterior',   unit: '', hi: true, decimals: 2 },
      { key: 'fta',     label: 'Ângulo de Casco',        unit: '', hi: true, decimals: 2 },
      { key: 'rpa',     label: 'Ângulo de Garupa',       unit: '', hi: true, decimals: 2 },
      { key: 'tlg',     label: 'Tetos Anteriores',        unit: '', hi: true, decimals: 2 },
      { key: 'trw',     label: 'Tetos Posteriores',       unit: '', hi: true, decimals: 2 },
      { key: 'rlr',     label: 'Compr. de Tetos',        unit: '', hi: true, decimals: 2 },
    ],
  },
  {
    title: 'Genética',
    indices: [
      { key: 'ginb', label: 'Consanguinidade (gINB)', unit: '%', hi: false, decimals: 1 },
    ],
  },
];

// ─── Bar color ────────────────────────────────────────────────────────────────

function barColor(pct: number): {
  fill: string;
  glow: string;
  track: string;
} {
  if (pct >= 75) return {
    fill: '#16a34a',
    glow: 'rgba(22,163,74,0.35)',
    track: 'rgba(22,163,74,0.10)',
  };
  if (pct >= 50) return {
    fill: '#2E6DA4',
    glow: 'rgba(46,109,164,0.30)',
    track: 'rgba(46,109,164,0.10)',
  };
  if (pct >= 25) return {
    fill: '#b45309',
    glow: 'rgba(180,83,9,0.30)',
    track: 'rgba(180,83,9,0.10)',
  };
  return {
    fill: '#dc2626',
    glow: 'rgba(220,38,38,0.28)',
    track: 'rgba(220,38,38,0.10)',
  };
}

// ─── Format value ─────────────────────────────────────────────────────────────

function fmtVal(
  v: number | null | undefined,
  def: IndexDef,
): string {
  if (v == null) return '—';
  const n = parseFloat(String(v));
  const formatted = def.decimals === 0 ? Math.round(n).toString() : n.toFixed(def.decimals ?? 1);
  const sign = def.hi && n > 0 ? '+' : (!def.hi ? '' : '');
  const prefix = def.prefix ?? '';
  return `${prefix}${sign}${formatted}`;
}

// ─── Single index row ─────────────────────────────────────────────────────────

function IndexRow({ female, def }: { female: Female; def: IndexDef }) {
  const raw = (female as Record<string, unknown>)[def.key] as number | null | undefined;
  const pct = raw != null ? norm(raw, def.key) : null;

  const colors = pct != null ? barColor(pct) : null;
  const label = fmtVal(raw, def);
  const isEstimated = !!(female as Record<string, unknown>)[`_est_${def.key}`];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', padding: '6px 0', borderBottom: '1px solid rgba(30,58,92,0.06)' }}>
      {/* Label */}
      <div style={{
        width: '148px',
        flexShrink: 0,
        fontFamily: "'Inter', sans-serif",
        fontSize: '11.5px',
        color: '#4B5563',
        letterSpacing: '0.01em',
        lineHeight: 1.3,
        paddingRight: '12px',
      }}>
        {def.label}
        {isEstimated && (
          <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '10px', marginLeft: '3px' }}>est.</span>
        )}
      </div>

      {/* Value */}
      <div style={{
        width: '72px',
        flexShrink: 0,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        fontSize: '11.5px',
        fontWeight: 600,
        color: pct == null
          ? '#9CA3AF'
          : pct >= 75 ? '#15803d'
          : pct >= 50 ? '#1B3A5C'
          : pct >= 25 ? '#92400e'
          : '#b91c1c',
        textAlign: 'right',
        paddingRight: '14px',
        letterSpacing: '-0.01em',
      }}>
        {label}
        {def.unit && raw != null && (
          <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '9.5px', marginLeft: '2px' }}>
            {def.unit}
          </span>
        )}
      </div>

      {/* Bar track + fill */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: '20px' }}>
        {pct != null && colors ? (
          <div style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: colors.track,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              width: `${Math.max(2, pct)}%`,
              height: '100%',
              borderRadius: '3px',
              backgroundColor: colors.fill,
              boxShadow: `0 0 6px 0 ${colors.glow}`,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        ) : (
          <div style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: 'rgba(30,58,92,0.07)',
          }} />
        )}
      </div>

      {/* Percentile label */}
      <div style={{
        width: '32px',
        flexShrink: 0,
        textAlign: 'right',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9.5px',
        color: '#9CA3AF',
        paddingLeft: '8px',
      }}>
        {pct != null ? `${Math.round(pct)}%` : ''}
      </div>
    </div>
  );
}

// ─── Pedigree item ────────────────────────────────────────────────────────────

function PedigreeRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '10px',
      padding: '5px 0',
      borderBottom: '1px solid rgba(30,58,92,0.06)',
    }}>
      <span style={{
        width: '148px',
        flexShrink: 0,
        fontFamily: "'Inter', sans-serif",
        fontSize: '11.5px',
        color: '#4B5563',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: '11.5px',
        fontWeight: 600,
        color: value ? '#1B3A5C' : '#9CA3AF',
        letterSpacing: '0.04em',
      }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '4px',
      marginTop: '20px',
    }}>
      <span style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: '#6B7280',
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(30,58,92,0.12)' }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FemaleProfileModal({ female, femaleRow, onClose, onGoToMatching }: Props) {
  const isOpen = female != null;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const rel = female ? Math.round((female._rel ?? calcCowRel(female)) * 100) : 0;
  const name = femaleRow?.name ?? null;
  const bdate = femaleRow?.bdate ?? female?.bdate ?? null;
  const bdateFormatted = bdate
    ? (() => {
        try { return new Date(bdate).toLocaleDateString('pt-BR'); } catch { return bdate; }
      })()
    : null;

  return (
    <>
      {/* Styles injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;600&display=swap');

        .fpm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 20, 35, 0.48);
          backdrop-filter: blur(2px);
          z-index: 1000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .fpm-overlay.open {
          opacity: 1;
          pointer-events: all;
        }

        .fpm-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 480px;
          max-width: 100vw;
          background: #FAFBFC;
          border-left: 1px solid rgba(30,58,92,0.13);
          box-shadow:
            -4px 0 32px rgba(10,20,35,0.12),
            -1px 0 4px rgba(10,20,35,0.06);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .fpm-drawer.open {
          transform: translateX(0);
        }

        .fpm-body {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px 24px;
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }

        @media (max-width: 520px) {
          .fpm-drawer { width: 100vw; }
        }

        .fpm-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 3px;
          font-family: 'Inter', sans-serif;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.03em;
        }

        .fpm-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          background: #1B3A5C;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: background 0.15s ease, box-shadow 0.15s ease;
        }
        .fpm-btn-primary:hover {
          background: #2E6DA4;
          box-shadow: 0 2px 10px rgba(46,109,164,0.35);
        }

        .fpm-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: transparent;
          color: #6B7280;
          border: 1px solid rgba(30,58,92,0.18);
          border-radius: 4px;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .fpm-btn-ghost:hover {
          background: rgba(30,58,92,0.05);
          color: #1B3A5C;
        }

        .fpm-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 3px;
          border: 1px solid rgba(30,58,92,0.15);
          background: transparent;
          color: #6B7280;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          flex-shrink: 0;
        }
        .fpm-close-btn:hover {
          background: rgba(30,58,92,0.07);
          color: #1B3A5C;
        }

        .fpm-rel-bar-track {
          width: 100%;
          height: 3px;
          background: rgba(30,58,92,0.10);
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        }
        .fpm-rel-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: #2E6DA4;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Overlay */}
      <div
        className={`fpm-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fpm-drawer${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={female ? `Perfil genético — Animal ${female.id}` : 'Perfil genético'}
      >
        {female && (
          <>
            {/* ── Header ── */}
            <div style={{
              padding: '18px 24px 16px',
              borderBottom: '1px solid rgba(30,58,92,0.10)',
              background: '#fff',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* ID + Name */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#1B3A5C',
                      letterSpacing: '-0.02em',
                    }}>
                      {female.id}
                    </span>
                    {name && (
                      <span style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '12.5px',
                        color: '#6B7280',
                        letterSpacing: '0.01em',
                        fontStyle: 'italic',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                      }}>
                        {name}
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <span className="fpm-badge" style={{ background: 'rgba(30,58,92,0.08)', color: '#1B3A5C' }}>
                      {female.breed ?? 'HO'}
                    </span>
                    {female.lact != null && (
                      <span className="fpm-badge" style={{ background: 'rgba(30,58,92,0.06)', color: '#374151' }}>
                        Lact. {female.lact}
                      </span>
                    )}
                    {female.genomic && (
                      <span className="fpm-badge" style={{ background: 'rgba(126,34,206,0.09)', color: '#7c3aed' }}>
                        <Dna size={10} /> Genoma
                      </span>
                    )}
                    {female.is_primiparous && (
                      <span className="fpm-badge" style={{ background: 'rgba(236,72,153,0.09)', color: '#be185d' }}>
                        Primipara
                      </span>
                    )}
                    {Boolean((female as Record<string, unknown>)._est_milk) && (
                      <span className="fpm-badge" style={{ background: 'rgba(107,114,128,0.09)', color: '#6B7280' }}>
                        <Star size={9} /> Parent Avg.
                      </span>
                    )}
                    {bdateFormatted && (
                      <span className="fpm-badge" style={{ background: 'rgba(30,58,92,0.05)', color: '#6B7280' }}>
                        Nasc. {bdateFormatted}
                      </span>
                    )}
                  </div>

                  {/* REL bar */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '10px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#9CA3AF',
                      }}>
                        Confiabilidade
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        fontWeight: 600,
                        color: rel >= 70 ? '#2E6DA4' : '#6B7280',
                      }}>
                        {rel}%
                      </span>
                    </div>
                    <div className="fpm-rel-bar-track">
                      <div
                        className="fpm-rel-bar-fill"
                        style={{
                          width: `${rel}%`,
                          background: rel >= 80 ? '#7c3aed' : rel >= 70 ? '#2E6DA4' : '#6B7280',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Close button */}
                <button className="fpm-close-btn" onClick={onClose} aria-label="Fechar">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ── Body: sections ── */}
            <div className="fpm-body">

              {SECTIONS.map(section => {
                // Check if section has any non-null value
                const hasData = section.indices.some(idx => {
                  const v = (female as Record<string, unknown>)[idx.key];
                  return v != null;
                });

                return (
                  <div key={section.title}>
                    <SectionHeader title={section.title} />
                    {section.indices.map(def => (
                      <IndexRow key={def.key} female={female} def={def} />
                    ))}
                    {!hasData && (
                      <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '11.5px',
                        color: '#9CA3AF',
                        fontStyle: 'italic',
                        padding: '4px 0 8px',
                      }}>
                        Sem dados disponíveis para esta seção.
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Pedigree section */}
              <div>
                <SectionHeader title="Pedigree" />
                <PedigreeRow label="Pai (Sire)" value={female.sire_naab} />
                <PedigreeRow label="Avô Materno" value={female.mgs_naab} />
                <PedigreeRow label="Bisavô Materno" value={female.mmgs_naab} />
                <PedigreeRow label="Mãe" value={femaleRow?.dam_id ?? (female.dam_id as string | null | undefined)} />
              </div>

              {/* Notes */}
              {femaleRow?.notes && (
                <div style={{ marginTop: '20px' }}>
                  <SectionHeader title="Observações" />
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11.5px',
                    color: '#4B5563',
                    lineHeight: 1.6,
                    padding: '4px 0',
                  }}>
                    {femaleRow.notes}
                  </p>
                </div>
              )}

              {/* Color legend */}
              <div style={{
                marginTop: '24px',
                padding: '12px 14px',
                background: 'rgba(30,58,92,0.04)',
                border: '1px solid rgba(30,58,92,0.08)',
                borderRadius: '4px',
              }}>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#9CA3AF',
                  marginBottom: '8px',
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
                        width: '22px',
                        height: '5px',
                        borderRadius: '3px',
                        backgroundColor: item.fill,
                        boxShadow: `0 0 5px ${item.fill}66`,
                      }} />
                      <span style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '10.5px',
                        color: '#6B7280',
                      }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid rgba(30,58,92,0.10)',
              background: '#fff',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              flexShrink: 0,
            }}>
              <button className="fpm-btn-ghost" onClick={onClose}>
                Fechar
              </button>
              <button
                className="fpm-btn-primary"
                onClick={() => { onGoToMatching(); onClose(); }}
              >
                Fazer Matching
                <ArrowRight size={13} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
