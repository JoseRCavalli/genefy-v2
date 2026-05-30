import { useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { PerfilProgenieProps } from '../../types/PerfilProgenie.types';
export type { PerfilProgenieProps } from '../../types/PerfilProgenie.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  darkBlue: '#1B3A5C',
  midBlue: '#2E6DA4',
  green: '#16a34a',
  orange: '#b45309',
  red: '#dc2626',
  gray: '#6B7280',
  lightGray: '#9CA3AF',
  text: '#4B5563',
  bg: '#FAFBFC',
} as const;

const FONT = {
  text: "'Inter', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  header: "'Playfair Display', Georgia, serif",
} as const;

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ─── Bar color (same logic as FemaleProfileModal) ─────────────────────────────

function barColor(pct: number): { fill: string; glow: string; track: string } {
  if (pct >= 75) return { fill: COLORS.green, glow: 'rgba(22,163,74,0.35)', track: 'rgba(22,163,74,0.10)' };
  if (pct >= 50) return { fill: COLORS.midBlue, glow: 'rgba(46,109,164,0.30)', track: 'rgba(46,109,164,0.10)' };
  if (pct >= 25) return { fill: COLORS.orange, glow: 'rgba(180,83,9,0.30)', track: 'rgba(180,83,9,0.10)' };
  return { fill: COLORS.red, glow: 'rgba(220,38,38,0.28)', track: 'rgba(220,38,38,0.10)' };
}

// ─── Index badge color helper ─────────────────────────────────────────────────

function indexBadgeColor(value: number | undefined | null, lowerIsBetter: boolean): { bg: string; text: string } {
  if (value == null) return { bg: '#E5E7EB', text: COLORS.gray };
  if (lowerIsBetter) {
    if (value < 0) return { bg: 'rgba(22,163,74,0.12)', text: '#15803d' };
    if (value > 0) return { bg: 'rgba(180,83,9,0.12)', text: '#92400e' };
    return { bg: '#E5E7EB', text: COLORS.gray };
  }
  // higher is better
  if (value > 0) return { bg: 'rgba(22,163,74,0.12)', text: '#15803d' };
  if (value < 0) return { bg: 'rgba(180,83,9,0.12)', text: '#92400e' };
  return { bg: '#E5E7EB', text: COLORS.gray };
}

// ─── Index definitions ────────────────────────────────────────────────────────

interface IndexDef {
  label: string;
  key: keyof PerfilProgenieProps['indices'];
  lowerIsBetter?: boolean;
  decimals?: number;
  unit?: string;
}

const LEFT_INDICES: IndexDef[] = [
  { label: 'OPI / TPI', key: 'tpi', decimals: 0 },
  { label: 'Mérito Líquido ($)', key: 'netMerit', decimals: 0, unit: '$' },
  { label: 'Mérito Queijo ($)', key: 'cheeseMerit', decimals: 0, unit: '$' },
  { label: 'Cons. futura esperada (%)', key: 'futureInbreeding', lowerIsBetter: true, decimals: 1, unit: '%' },
  { label: 'Leite (lbs)', key: 'milk', decimals: 0, unit: 'lbs' },
  { label: 'Gordura (lbs)', key: 'fat', decimals: 1, unit: 'lbs' },
  { label: 'Gordura (%)', key: 'fatPercent', decimals: 2, unit: '%' },
  { label: 'Proteína (lbs)', key: 'protein', decimals: 1, unit: 'lbs' },
  { label: 'Proteína (%)', key: 'proteinPercent', decimals: 2, unit: '%' },
  { label: 'Eficiência alimentar ($)', key: 'feedEfficiency', decimals: 0, unit: '$' },
  { label: 'Células somáticas', key: 'somaticCellScore', lowerIsBetter: true, decimals: 2 },
  { label: 'Vida produtiva (meses)', key: 'productiveLife', decimals: 1 },
];

const RIGHT_INDICES: IndexDef[] = [
  { label: 'Trato economizado (lbs)', key: 'feedEfficiency', decimals: 0, unit: 'lbs' },
  { label: 'Taxa de sobrevivência de vacas (%)', key: 'livability', decimals: 1, unit: '%' },
  { label: 'Taxa de sobrevivência de novilhas (%)', key: 'heiferLivability', decimals: 1, unit: '%' },
  { label: 'DPR — taxa de prenhez (%)', key: 'dpr', decimals: 1, unit: '%' },
  { label: 'HCR — taxa de concepção de novilhas (%)', key: 'hcr', decimals: 1, unit: '%' },
  { label: 'CCR — taxa de concepção de vacas (%)', key: 'ccr', decimals: 1, unit: '%' },
  { label: 'Idade ao primeiro parto (dias)', key: 'earlyFirstCalving', decimals: 1 },
  { label: 'Índice de fertilidade (%)', key: 'fertilityIndex', decimals: 1, unit: '%' },
  { label: 'Resistência a mastite (%)', key: 'mastitisResistance', decimals: 1, unit: '%' },
  { label: 'Índice de saúde', key: 'healthIndex', decimals: 1 },
  { label: 'Natimorto — touro (%)', key: 'sireStillbirth', lowerIsBetter: true, decimals: 1, unit: '%' },
  { label: 'Facilidade de parto — touro (%)', key: 'sireCalvingEase', lowerIsBetter: true, decimals: 1, unit: '%' },
];

// ─── Composite & conformation definitions ─────────────────────────────────────

interface BarDef {
  label: string;
  key: keyof PerfilProgenieProps['indices'];
}

const COMPOSITES: BarDef[] = [
  { label: 'PTAT — Tipo', key: 'ptat' },
  { label: 'Composto de Úbere (UDC)', key: 'udc' },
  { label: 'Composto de Pernas e Pés (FLC)', key: 'flc' },
  { label: 'Composto Corporal (BDE)', key: 'bde' },
  { label: 'Composto Leiteiro (DFM)', key: 'dfm' },
];

const CONFORMATION: BarDef[] = [
  { label: 'Estatura (STA)', key: 'sta' },
  { label: 'Força (STR)', key: 'str' },
  { label: 'Profundidade Corporal (BDE)', key: 'bde' },
  { label: 'Forma Leiteira (DFM)', key: 'dfm' },
  { label: 'Ângulo de Garupa (RPA)', key: 'rpa' },
  { label: 'Largura de Garupa (RUW)', key: 'ruw' },
  { label: 'Pernas Vista Lateral (FLS)', key: 'fls' },
  { label: 'Pernas Vista Posterior (RLS)', key: 'rls' },
  { label: 'Ângulo de Casco (FTA)', key: 'fta' },
  { label: 'Escore de Pernas e Pés (FLC)', key: 'flc' },
  { label: 'Inserção de Úbere Anterior (FUA)', key: 'fua' },
  { label: 'Altura de Úbere Posterior (RUH)', key: 'ruh' },
  { label: 'Largura de Úbere Posterior (RUW)', key: 'ruw' },
  { label: 'Ligamento Central (UCL)', key: 'ucl' },
  { label: 'Profundidade de Úbere (UDP)', key: 'udp' },
  { label: 'Colocação de Tetos Anteriores (TLG)', key: 'tlg' },
  { label: 'Colocação de Tetos Posteriores (TRW)', key: 'trw' },
  { label: 'Comprimento de Tetos (RLR)', key: 'rlr' },
];

// ─── Format index value ───────────────────────────────────────────────────────

function fmtIdx(v: number | undefined | null, decimals: number = 1): string {
  if (v == null) return '—';
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (isNaN(n)) return '—';
  return decimals === 0 ? Math.round(n).toLocaleString('pt-BR') : n.toFixed(decimals);
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '6px',
      marginTop: '24px',
    }}>
      <span style={{
        fontFamily: FONT.header,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: COLORS.gray,
        whiteSpace: 'nowrap',
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(30,58,92,0.12)' }} />
    </div>
  );
}

// ─── Single index row (for the 2-column table) ───────────────────────────────

function IndexItem({ def, value }: { def: IndexDef; value: number | undefined | null }) {
  const colors = indexBadgeColor(value, !!def.lowerIsBetter);
  const formatted = fmtIdx(value, def.decimals);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '5px 0',
      borderBottom: '1px solid rgba(30,58,92,0.06)',
      gap: '8px',
    }}>
      <span style={{
        fontFamily: FONT.text,
        fontSize: '11px',
        color: COLORS.text,
        lineHeight: 1.3,
        flex: 1,
      }}>
        {def.label}
      </span>
      <span style={{
        fontFamily: FONT.mono,
        fontSize: '11px',
        fontWeight: 600,
        color: colors.text,
        backgroundColor: colors.bg,
        padding: '2px 8px',
        borderRadius: '3px',
        whiteSpace: 'nowrap',
        minWidth: '52px',
        textAlign: 'center',
      }}>
        {formatted}
      </span>
    </div>
  );
}

// ─── Centered-on-zero bar (for composites & conformation) ─────────────────────

function CenteredBar({ label, value }: { label: string; value: number | undefined | null }) {
  const MIN = -3;
  const MAX = 3;
  const RANGE = MAX - MIN; // 6

  const clampedValue = value != null ? Math.max(MIN, Math.min(MAX, value)) : null;
  // Percentile: map from [-3, +3] → [0, 100]
  const pct = clampedValue != null ? ((clampedValue - MIN) / RANGE) * 100 : null;
  const colors = pct != null ? barColor(pct) : null;

  // Center is at 50% of the track
  const centerPct = 50;
  const valuePct = pct ?? 50;

  // Bar fill: from center to value position
  const barLeft = Math.min(centerPct, valuePct);
  const barWidth = Math.abs(valuePct - centerPct);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      padding: '4px 0',
      borderBottom: '1px solid rgba(30,58,92,0.05)',
    }}>
      {/* Label */}
      <div style={{
        width: '210px',
        flexShrink: 0,
        fontFamily: FONT.text,
        fontSize: '10.5px',
        color: COLORS.text,
        lineHeight: 1.3,
        paddingRight: '10px',
      }}>
        {label}
      </div>

      {/* Bar track */}
      <div style={{
        flex: 1,
        height: '20px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          width: '100%',
          height: '7px',
          borderRadius: '3.5px',
          backgroundColor: 'rgba(30,58,92,0.07)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Center line */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'rgba(30,58,92,0.25)',
            zIndex: 2,
          }} />

          {/* Fill bar */}
          {clampedValue != null && colors && (
            <div style={{
              position: 'absolute',
              left: `${barLeft}%`,
              width: `${Math.max(0.5, barWidth)}%`,
              height: '100%',
              borderRadius: '3.5px',
              backgroundColor: colors.fill,
              boxShadow: `0 0 6px 0 ${colors.glow}`,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1,
            }} />
          )}
        </div>
      </div>

      {/* Numeric value */}
      <div style={{
        width: '48px',
        flexShrink: 0,
        textAlign: 'right',
        fontFamily: FONT.mono,
        fontSize: '11px',
        fontWeight: 600,
        color: clampedValue != null && colors ? colors.fill : COLORS.lightGray,
        paddingLeft: '8px',
      }}>
        {clampedValue != null ? (clampedValue >= 0 ? `+${clampedValue.toFixed(2)}` : clampedValue.toFixed(2)) : '—'}
      </div>
    </div>
  );
}

// ─── Scale labels for bar sections ────────────────────────────────────────────

function BarScaleLabels() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      paddingBottom: '2px',
      marginBottom: '2px',
    }}>
      <div style={{ width: '210px', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {[-3, -2, -1, 0, 1, 2, 3].map(n => (
          <span key={n} style={{
            fontFamily: FONT.mono,
            fontSize: '8px',
            color: COLORS.lightGray,
            width: n === 0 ? 'auto' : 'auto',
            textAlign: 'center',
          }}>
            {n > 0 ? `+${n}` : n}
          </span>
        ))}
      </div>
      <div style={{ width: '48px', flexShrink: 0 }} />
    </div>
  );
}

// ─── Pedigree row ─────────────────────────────────────────────────────────────

function PedigreeRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '10px',
      padding: '5px 0',
      borderBottom: '1px solid rgba(30,58,92,0.06)',
    }}>
      <span style={{
        width: '140px',
        flexShrink: 0,
        fontFamily: FONT.text,
        fontSize: '11.5px',
        color: COLORS.text,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: FONT.mono,
        fontSize: '11.5px',
        fontWeight: 600,
        color: value ? COLORS.darkBlue : COLORS.lightGray,
        letterSpacing: '0.03em',
      }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ─── Print styles ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap');

  .ppg-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 20, 35, 0.52);
    backdrop-filter: blur(3px);
    z-index: 9998;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ppg-overlay.ppg-open {
    opacity: 1;
    pointer-events: all;
  }

  .ppg-modal-container {
    position: fixed;
    inset: 0;
    z-index: 9999;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    padding: 24px 16px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ppg-modal-container.ppg-open {
    opacity: 1;
    pointer-events: all;
  }

  .ppg-print-btn {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 10000;
    padding: 12px 24px;
    background: #1B3A5C;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(27,58,92,0.35);
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ppg-print-btn:hover {
    background: #2E6DA4;
    box-shadow: 0 6px 28px rgba(46,109,164,0.45);
    transform: translateY(-1px);
  }

  .ppg-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(30,58,92,0.15);
    background: #fff;
    color: #6B7280;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: background 0.15s, color 0.15s;
    z-index: 10;
  }
  .ppg-close-btn:hover {
    background: rgba(30,58,92,0.06);
    color: #1B3A5C;
  }

  @media print {
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .ppg-overlay,
    .ppg-print-btn,
    .ppg-close-btn {
      display: none !important;
    }

    .ppg-modal-container {
      position: static !important;
      padding: 0 !important;
      opacity: 1 !important;
      pointer-events: all !important;
      overflow: visible !important;
      display: block !important;
    }

    .ppg-page {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 20px 28px !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      border: none !important;
      page-break-inside: avoid;
    }

    .ppg-section-compostos,
    .ppg-section-conformacao {
      page-break-inside: avoid;
    }

    @page {
      size: A4;
      margin: 12mm 10mm;
    }
  }
`;

// ─── Main Profile Content ─────────────────────────────────────────────────────

function PerfilProgenieContent({ touro, indices, pedigree }: PerfilProgenieProps) {
  const today = formatDate(new Date());

  return (
    <div
      className="ppg-page"
      style={{
        width: '100%',
        maxWidth: '820px',
        margin: '0 auto',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 40px rgba(10,20,35,0.12), 0 1px 4px rgba(10,20,35,0.06)',
        padding: '32px 36px',
        fontFamily: FONT.text,
        color: COLORS.text,
        position: 'relative',
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        {/* Logo + Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <img
              src="/images/genefy-logo-white.png"
              alt="Genefy"
              style={{ height: '84px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h1 style={{
            fontFamily: FONT.header,
            fontSize: '20px',
            fontWeight: 700,
            color: COLORS.darkBlue,
            margin: '0 0 4px',
            letterSpacing: '0.02em',
          }}>
            Perfil Genético da Progênie
          </h1>
          <p style={{
            fontFamily: FONT.text,
            fontSize: '11px',
            color: COLORS.lightGray,
            margin: 0,
          }}>
            Dados gerados em {today}
          </p>
        </div>

        {/* Bull ID Box */}
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(30,58,92,0.04)',
          border: '1px solid rgba(30,58,92,0.10)',
          borderRadius: '6px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: FONT.text, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: COLORS.lightGray }}>Código</span>
            <span style={{ fontFamily: FONT.mono, fontSize: '14px', fontWeight: 700, color: COLORS.darkBlue }}>{touro.codigo}</span>
          </div>
          <div style={{ width: '1px', height: '28px', background: 'rgba(30,58,92,0.12)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: FONT.text, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: COLORS.lightGray }}>Nome</span>
            <span style={{ fontFamily: FONT.text, fontSize: '13px', fontWeight: 600, color: COLORS.darkBlue }}>{touro.nome}</span>
          </div>
          <div style={{ width: '1px', height: '28px', background: 'rgba(30,58,92,0.12)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: FONT.text, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: COLORS.lightGray }}>NAAB</span>
            <span style={{ fontFamily: FONT.mono, fontSize: '13px', fontWeight: 600, color: COLORS.midBlue }}>{touro.naab}</span>
          </div>
          <div style={{ width: '1px', height: '28px', background: 'rgba(30,58,92,0.12)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: '180px' }}>
            <span style={{ fontFamily: FONT.text, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: COLORS.lightGray }}>Pedigree</span>
            <span style={{ fontFamily: FONT.text, fontSize: '12px', fontWeight: 500, color: COLORS.text }}>{touro.pedigree}</span>
          </div>
          {touro.brinco && (
            <>
              <div style={{ width: '1px', height: '28px', background: 'rgba(30,58,92,0.12)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontFamily: FONT.text, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: COLORS.lightGray }}>Brinco</span>
                <span style={{ fontFamily: FONT.mono, fontSize: '13px', fontWeight: 600, color: COLORS.text }}>{touro.brinco}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Índices (2-column grid) ── */}
      <SectionHeader title="Índices Genéticos" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0 24px',
      }}>
        {/* Left column */}
        <div>
          {LEFT_INDICES.map((def, i) => (
            <IndexItem key={`l-${i}`} def={def} value={indices[def.key]} />
          ))}
        </div>
        {/* Right column */}
        <div>
          {RIGHT_INDICES.map((def, i) => (
            <IndexItem key={`r-${i}`} def={def} value={indices[def.key]} />
          ))}
        </div>
      </div>

      {/* ── Compostos (centered bars) ── */}
      <div className="ppg-section-compostos">
        <SectionHeader title="Compostos" />
        <BarScaleLabels />
        {COMPOSITES.map((def, i) => (
          <CenteredBar key={`c-${i}`} label={def.label} value={indices[def.key]} />
        ))}
      </div>

      {/* ── Conformação (centered bars) ── */}
      <div className="ppg-section-conformacao">
        <SectionHeader title="Conformação Linear" />
        <BarScaleLabels />
        {CONFORMATION.map((def, i) => (
          <CenteredBar key={`cf-${i}`} label={def.label} value={indices[def.key]} />
        ))}
      </div>

      {/* ── Legend ── */}
      <div style={{
        marginTop: '20px',
        padding: '12px 14px',
        background: 'rgba(30,58,92,0.04)',
        border: '1px solid rgba(30,58,92,0.08)',
        borderRadius: '4px',
      }}>
        <p style={{
          fontFamily: FONT.text,
          fontSize: '10px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: COLORS.lightGray,
          marginBottom: '8px',
          marginTop: 0,
        }}>
          Legenda — Posição relativa à raça
        </p>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[
            { emoji: '🟢', label: 'Top quartil', fill: COLORS.green },
            { emoji: '🔵', label: 'Acima da média', fill: COLORS.midBlue },
            { emoji: '🟠', label: 'Abaixo da média', fill: COLORS.orange },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '24px',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: item.fill,
                boxShadow: `0 0 5px ${item.fill}66`,
              }} />
              <span style={{
                fontFamily: FONT.text,
                fontSize: '10.5px',
                color: COLORS.gray,
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pedigree Footer ── */}
      <SectionHeader title="Pedigree" />
      <PedigreeRow label="Pai (Sire)" value={
        pedigree.sireNome || pedigree.sireNaab
          ? [pedigree.sireNome, pedigree.sireNaab].filter(Boolean).join(' — ')
          : null
      } />
      <PedigreeRow label="Avô Materno" value={
        pedigree.mgsNome || pedigree.mgsNaab
          ? [pedigree.mgsNome, pedigree.mgsNaab].filter(Boolean).join(' — ')
          : null
      } />
      <PedigreeRow label="Mãe" value={pedigree.damId} />

      {/* ── Branding footer ── */}
      <div style={{
        marginTop: '28px',
        paddingTop: '14px',
        borderTop: '1px solid rgba(30,58,92,0.10)',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: FONT.text,
          fontSize: '10px',
          color: COLORS.lightGray,
          letterSpacing: '0.04em',
          margin: 0,
        }}>
          Gerado por <strong style={{ color: COLORS.darkBlue }}>Genefy</strong> · {today} · Dados CDCB USA
        </p>
      </div>
    </div>
  );
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────

interface PerfilProgenieModalProps extends PerfilProgenieProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerfilProgenieModal({
  isOpen,
  onClose,
  touro,
  indices,
  pedigree,
}: PerfilProgenieModalProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Injected styles */}
      <style>{PRINT_STYLES}</style>

      {/* Overlay */}
      <div
        className={`ppg-overlay${isOpen ? ' ppg-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        className={`ppg-modal-container${isOpen ? ' ppg-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil genético — ${touro.nome}`}
      >
        {isOpen && (
          <div style={{ width: '100%', maxWidth: '860px', position: 'relative' }}>
            {/* Close button */}
            <button
              className="ppg-close-btn"
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>

            {/* Profile content */}
            <div id="perfil-progenie-print-root" ref={componentRef}>
              <PerfilProgenieContent
                touro={touro}
                indices={indices}
                pedigree={pedigree}
              />
            </div>
          </div>
        )}
      </div>

      {/* Print button */}
      {isOpen && (
        <button
          className="ppg-print-btn"
          onClick={() => handlePrint()}
        >
          🖨️ Imprimir / Exportar PDF
        </button>
      )}
    </>
  );
}

export default PerfilProgenieModal;
