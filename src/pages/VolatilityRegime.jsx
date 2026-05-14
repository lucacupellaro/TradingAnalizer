import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, AlertTriangle, RefreshCw, ShieldCheck, Layers, TrendingUp, TrendingDown, Zap, Target, Compass, AlertCircle, CheckCircle2, Bell } from 'lucide-react';
import { useVolatilityRegime, INDICATORS_CONFIG } from '../hooks/useVolatilityRegime';

const REGIME_COLORS = {
  'very-low':  { c: '#00e676', label: 'MOLTO BASSA' },
  'low':       { c: '#66bb6a', label: 'BASSA' },
  'medium':    { c: '#ffd740', label: 'MEDIA' },
  'high':      { c: '#ff8c00', label: 'ALTA' },
  'very-high': { c: '#ff1744', label: 'MOLTO ALTA' },
};

const CATEGORIES = {
  equity:    { label: 'Equity Volatility',    icon: TrendingUp, color: '#ff8c00' },
  bond:      { label: 'Bond Volatility',      icon: ShieldCheck, color: '#64b5f6' },
  credit:    { label: 'Credit Risk',          icon: AlertTriangle, color: '#ec407a' },
  cross:     { label: 'Cross-Asset',          icon: Layers, color: '#a78bfa' },
  funding:   { label: 'Funding & Liquidity',  icon: Activity, color: '#26c6da' },
  commodity: { label: 'Commodity Volatility', icon: Zap, color: '#ffa726' },
};

const fmtNum = (v, dec = 2) => v == null || isNaN(v) ? '—' : Number(v).toFixed(dec);
const fmtSigned = (v, dec = 2) => v == null || isNaN(v) ? '—' : (v >= 0 ? '+' : '') + Number(v).toFixed(dec);
const fmtPct = (v, dec = 2) => v == null || isNaN(v) ? '—' : (v >= 0 ? '+' : '') + Number(v).toFixed(dec) + '%';

// Big circular gauge for composite score
function CompositeGauge({ score, color }) {
  const pct = Math.max(0, Math.min(100, score));
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const dashoff = circumference * (1 - pct / 100);
  return (
    <div className="relative w-56 h-56">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r={radius} stroke="#1a1a1a" strokeWidth="14" fill="none" />
        {/* Color zones */}
        <motion.circle
          cx="100" cy="100" r={radius}
          stroke={color} strokeWidth="14" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashoff }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 12px ${color}aa)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black font-mono" style={{ color }}>{Math.round(pct)}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">/ 100</span>
      </div>
    </div>
  );
}

// 5-segment regime scale strip
function RegimeScale({ score, theme }) {
  const segs = [
    { key: 'very-low',  c: '#00e676', label: 'MOLTO\nBASSA',  range: [0, 20] },
    { key: 'low',       c: '#66bb6a', label: 'BASSA',         range: [20, 40] },
    { key: 'medium',    c: '#ffd740', label: 'MEDIA',         range: [40, 60] },
    { key: 'high',      c: '#ff8c00', label: 'ALTA',          range: [60, 80] },
    { key: 'very-high', c: '#ff1744', label: 'STRESS',        range: [80, 100] },
  ];
  return (
    <div className="w-full">
      <div className="relative flex w-full rounded-md overflow-hidden">
        {segs.map(s => {
          const inSeg = score >= s.range[0] && score <= s.range[1];
          return (
            <div key={s.key} className={`flex-1 px-2 py-14 text-center transition-all ${inSeg ? 'ring-2 ring-white/40 scale-y-110 z-10' : ''}`}
              style={{ background: s.c, opacity: inSeg ? 1 : 0.4 }}>
              <span className="text-[8px] font-mono font-black uppercase tracking-widest text-black whitespace-pre-line leading-tight">
                {s.label}
              </span>
            </div>
          );
        })}
        {/* Position marker */}
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${Math.max(0, Math.min(100, score))}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        />
      </div>
      <div className={`flex justify-between mt-1 text-[9px] font-mono ${theme.textMuted}`}>
        <span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100</span>
      </div>
    </div>
  );
}

// Inline sparkline (SVG)
function Sparkline({ data, color, width = 140, height = 40 }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.v);
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const stepX = width / (data.length - 1);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(height - ((d.v - min) / range) * height).toFixed(1)}`).join(' ');
  const area = path + ` L ${width} ${height} L 0 ${height} Z`;
  const id = `spark-${color.slice(1)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Threshold bar showing position vs regime thresholds
function ThresholdBar({ value, thresholds, higherIsRiskier, regimeColor }) {
  if (!thresholds || thresholds.length !== 4) return null;
  const min = thresholds[0] - (thresholds[1] - thresholds[0]);
  const max = thresholds[3] + (thresholds[3] - thresholds[2]);
  const range = max - min || 1;
  const pct = Math.max(0, Math.min(100, ((value - min) / range) * 100));
  const segs = higherIsRiskier
    ? [{ to: thresholds[0], c: '#00e676' }, { to: thresholds[1], c: '#66bb6a' }, { to: thresholds[2], c: '#ffd740' }, { to: thresholds[3], c: '#ff8c00' }, { to: max, c: '#ff1744' }]
    : [{ to: thresholds[0], c: '#ff1744' }, { to: thresholds[1], c: '#ff8c00' }, { to: thresholds[2], c: '#ffd740' }, { to: thresholds[3], c: '#66bb6a' }, { to: max, c: '#00e676' }];
  let prev = min;
  return (
    <div className="w-full">
      <div className="relative h-2 rounded-full overflow-hidden flex">
        {segs.map((s, i) => {
          const w = ((s.to - prev) / range) * 100;
          prev = s.to;
          return <div key={i} style={{ width: `${w}%`, background: s.c, opacity: 0.55 }} />;
        })}
      </div>
      <div className="relative h-3">
        <div className="absolute -top-2 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[7px] border-l-transparent border-r-transparent"
          style={{ left: `calc(${pct}% - 5px)`, borderBottomColor: regimeColor }} />
      </div>
    </div>
  );
}

// Per-indicator card
function IndicatorCard({ cfg, m, theme }) {
  const regimeInfo = REGIME_COLORS[m.regime] || REGIME_COLORS.medium;
  const Icon = (CATEGORIES[cfg.cat] || {}).icon || Activity;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel flex flex-col`}
      style={{ borderColor: m.alertActive ? `${regimeInfo.c}66` : undefined }}
    >
      <div className="flex items-start justify-between mb-12">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: regimeInfo.c }} />
          <div className="min-w-0">
            <h3 className={`text-sm font-bold font-mono uppercase tracking-widest text-[#ff8c00] truncate`}>{cfg.name}</h3>
            <p className={`text-[10px] font-mono ${theme.textMuted}`}>{cfg.subCat}</p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded border"
          style={{ background: `${regimeInfo.c}15`, color: regimeInfo.c, borderColor: `${regimeInfo.c}55` }}>
          {regimeInfo.label}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3 mb-12">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono" style={{ color: regimeInfo.c }}>{fmtNum(m.last)}</span>
            {m.pct1 != null && (
              <span className="font-mono text-[10px] font-bold" style={{ color: m.pct1 >= 0 ? '#00e676' : '#ff1744' }}>
                {fmtPct(m.pct1)}
              </span>
            )}
          </div>
          <div className={`text-[10px] font-mono ${theme.textMuted}`}>
            1W {fmtPct(m.pct5)} · 1M {fmtPct(m.pct20)}
          </div>
        </div>
        <Sparkline data={m.series.slice(-90)} color={regimeInfo.c} width={120} height={36} />
      </div>

      {cfg.thresholds && (
        <div className="mb-12">
          <ThresholdBar value={m.last} thresholds={cfg.thresholds} higherIsRiskier={cfg.higherIsRiskier} regimeColor={regimeInfo.c} />
        </div>
      )}

      <div className={`grid grid-cols-3 gap-2 mb-12 text-[10px] font-mono ${theme.textMuted}`}>
        <div>
          <div className={theme.textMuted}>Z-Score</div>
          <div className={theme.textBold}>{fmtSigned(m.zScore, 2)}</div>
        </div>
        <div>
          <div className={theme.textMuted}>Percentile</div>
          <div className={theme.textBold}>{Math.round(m.percentile)}°</div>
        </div>
        <div>
          <div className={theme.textMuted}>Score</div>
          <div className="font-bold" style={{ color: regimeInfo.c }}>{Math.round(m.score)}/100</div>
        </div>
      </div>

      <p className={`text-[11px] font-mono ${theme.textMuted} leading-relaxed mb-12 italic`}>{cfg.desc}</p>

      <div className={`text-[10px] font-mono ${theme.textMuted} mt-auto pt-3 border-t border-[var(--c-border)]`}>
        Contributo allo score: <span className={theme.textBold}>{m.contribution.toFixed(1)}</span>
        {' '}· Peso <span className={theme.textBold}>{(cfg.weight * 100).toFixed(0)}%</span>
      </div>

      {m.alertActive && (
        <div className="mt-12 p-2 rounded text-[10px] font-mono flex items-start gap-2"
          style={{ background: `${regimeInfo.c}10`, border: `1px solid ${regimeInfo.c}40`, color: regimeInfo.c }}>
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{m.alertMessage}</span>
        </div>
      )}
    </motion.div>
  );
}

// Operational guidance text
function buildGuidance(score, drivers) {
  if (score < 20) {
    return {
      title: 'Risk-On Esteso',
      bullets: [
        'Equity (specie cyclical / small cap) favorito; ridurre allocazione difensiva.',
        'Premio rischio compresso: rendimenti attesi futuri inferiori alla media.',
        'Bond lunghi e oro hanno meno appeal — outperformance attesa di asset rischiosi.',
        'Attenzione a possibile compiacenza: vendite di volatility (short vol) ben prezzate ma rischio coda.',
      ],
    };
  }
  if (score < 40) {
    return {
      title: 'Risk-On',
      bullets: [
        'Allocazione tilt verso equity con esposizione a momentum e growth.',
        'Credito High Yield interessante per carry; spread compressi.',
        'Bond duration lunga sottopesata; preferire cash + breve termine.',
        'Vol selling con cautela; mantenere copertura tail-risk.',
      ],
    };
  }
  if (score < 60) {
    return {
      title: 'Neutrale',
      bullets: [
        'Allocazione bilanciata 60/40 o simile.',
        'Diversificazione tra equity, bond, oro e commodity.',
        'Monitorare con attenzione divergenze tra vol equity e vol bond (MOVE).',
        'Aggiungere coperture tattiche su asset class con score > 60.',
      ],
    };
  }
  if (score < 80) {
    const driverName = drivers && drivers[0]?.name ? drivers[0].name : 'multipli fattori';
    return {
      title: 'Risk-Off',
      bullets: [
        `Stress in formazione, guidato principalmente da: ${driverName}.`,
        'Ridurre leva e cyclical exposure; aumentare cash + Treasury short-medium duration.',
        'Considerare hedging via opzioni put o VIX call; vol selling sconsigliato.',
        'Gold, USD e Treasury lunghi possono offrire diversificazione.',
        'Ridurre esposizione a credit High Yield e Emerging Markets.',
      ],
    };
  }
  return {
    title: 'Stress Sistemico',
    bullets: [
      'Drawdown probabile su tutti gli asset rischiosi: ridurre risk gross.',
      'Cash e Treasury lunghi sono i principali safe haven; oro come hedge inflazionistico.',
      'Correlazioni in salita verso 1: diversificazione tradizionale fallisce, hedge tramite vol/options.',
      'Evitare leverage, posizioni illiquide, EM debt, HY credit.',
      'Storicamente periodi di stress preludono a opportunità: prepararsi a redeployment graduale.',
    ],
  };
}

// =====================================================================
// Page
// =====================================================================
export default function VolatilityRegime({ isDark, theme }) {
  const { data, composite, historicalScore, isLoading, lastUpdated, errors, reload } = useVolatilityRegime();

  // Group indicators by category
  const grouped = useMemo(() => {
    const out = {};
    INDICATORS_CONFIG.forEach(cfg => {
      const m = data[cfg.id];
      if (!m) return;
      if (!out[cfg.cat]) out[cfg.cat] = [];
      out[cfg.cat].push({ cfg, m });
    });
    return out;
  }, [data]);

  // Active alerts
  const alerts = useMemo(() => {
    const out = [];
    INDICATORS_CONFIG.forEach((cfg, idx) => {
      const m = data[cfg.id];
      if (m && m.alertActive) {
        out.push({
          code: `ALERT_${cfg.id.toUpperCase().replace(/-/g, '_')}_${String(idx).padStart(2, '0')}`,
          severity: m.alertSeverity,
          source: cfg.name,
          message: m.alertMessage,
          value: m.last,
          score: m.score,
        });
      }
    });
    // Composite score alert
    if (composite && composite.score >= 80) {
      out.push({
        code: 'ALERT_SCORE_01',
        severity: 'critical',
        source: 'Volatility Regime Score',
        message: `Score complessivo ${composite.score.toFixed(1)}/100 — regime di stress sistemico.`,
        value: composite.score,
        score: composite.score,
      });
    }
    out.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 99) - (order[b.severity] ?? 99);
    });
    return out;
  }, [data, composite]);

  const guidance = composite ? buildGuidance(composite.score, composite.drivers) : null;
  const histChartData = historicalScore?.map(p => ({ date: p.date.toISOString().split('T')[0], v: parseFloat(p.v.toFixed(2)) })) || [];

  return (
    <div className="space-y-12 animate-fade-in">
      {/* ---- HEADER ---- */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl md:text-4xl font-black font-mono uppercase tracking-tight ${theme.textBold}`}>
            Volatility <span className="text-[#ff8c00] glow-orange">Regime</span>
          </h1>
          <p className={`mt-10 text-sm font-mono ${theme.textMuted}`}>
            Dashboard live · {INDICATORS_CONFIG.length} indicatori macro-finanziari · Score 0-100 con classificazione regime
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
              Aggiornato {lastUpdated.toLocaleTimeString('it-IT')}
            </span>
          )}
          <button
            onClick={reload}
            disabled={isLoading}
            className={`p-2.5 rounded border ${theme.navBtnBg} ${theme.navText} ${theme.navHover} transition-all disabled:opacity-50`}
            title="Ricarica dati"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading && !composite ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#ff8c00]" />
          <span className={`text-xs font-mono uppercase tracking-widest ${theme.textMuted}`}>
            Caricamento indicatori macro-finanziari...
          </span>
        </div>
      ) : composite ? (
        <>
          {/* ---- 1. EXECUTIVE SUMMARY ---- */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel`}
            style={{ borderColor: `${composite.regimeColor}55` }}
          >
            <div className="flex items-center gap-2 mb-10">
              <Compass className="w-4 h-4 text-[#ff8c00]" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#ff8c00]">
                Executive Summary
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
              {/* Gauge */}
              <div className="flex flex-col items-center gap-4">
                <CompositeGauge score={composite.score} color={composite.regimeColor} />
                <div className="text-center">
                  <div className="font-mono font-black text-lg uppercase tracking-widest" style={{ color: composite.regimeColor, textShadow: `0 0 12px ${composite.regimeColor}66` }}>
                    {composite.regime}
                  </div>
                  {composite.change1w != null && (
                    <div className={`text-[11px] font-mono mt-1 ${theme.textMuted}`}>
                      vs 1 settimana fa: <span className={composite.change1w >= 0 ? 'text-[#ff8c00]' : 'text-[#00e676]'}>
                        {fmtSigned(composite.change1w, 1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: scale + drivers + message */}
              <div className="space-y-8">
                <RegimeScale score={composite.score} theme={theme} />

                <p className={`text-sm font-mono ${theme.textMuted} leading-relaxed`}>
                  {composite.regimeDesc}
                </p>

                <div>
                  <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted} mb-10`}>
                    Top driver dello stress
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {composite.drivers.slice(0, 3).map((d, i) => {
                      const c = (REGIME_COLORS[d.regime] || REGIME_COLORS.medium).c;
                      return (
                        <div key={d.id} className={`${theme.card} border ${theme.borderLight} rounded p-3 flex items-center gap-3`}>
                          <span className="font-mono font-black text-lg text-[#ff8c00]">#{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[11px] font-mono font-bold ${theme.textBold} truncate`}>{d.name}</div>
                            <div className="text-[10px] font-mono font-bold" style={{ color: c }}>
                              Score {Math.round(d.score)}/100 · contributo {d.contribution.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ---- 2. SCORE STORICO ---- */}
          {histChartData.length > 5 && (
            <div className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel`}>
              <h3 className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#ff8c00] mb-12 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Evoluzione Storica dello Score (12M)
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={histChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff8c00" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#ff8c00" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} interval={Math.floor(histChartData.length / 8)} />
                    <YAxis tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText, border: `1px solid ${theme.chart.tooltipBorder}`, fontSize: 11 }}
                      itemStyle={{ color: theme.chart.tooltipText }}
                      labelStyle={{ color: theme.chart.tooltipText }}
                      formatter={(v) => [`${Number(v).toFixed(1)}/100`, 'Score']}
                    />
                    <ReferenceLine y={20} stroke="#00e676" strokeDasharray="2 2" strokeOpacity={0.4} />
                    <ReferenceLine y={40} stroke="#66bb6a" strokeDasharray="2 2" strokeOpacity={0.4} />
                    <ReferenceLine y={60} stroke="#ffd740" strokeDasharray="2 2" strokeOpacity={0.4} />
                    <ReferenceLine y={80} stroke="#ff8c00" strokeDasharray="2 2" strokeOpacity={0.4} />
                    <Area type="monotone" dataKey="v" stroke="#ff8c00" strokeWidth={2} fill="url(#histGradient)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ---- 3-7. INDICATOR SECTIONS ---- */}
          {Object.entries(CATEGORIES).map(([catId, catInfo]) => {
            const items = grouped[catId];
            if (!items || items.length === 0) return null;
            const Icon = catInfo.icon;
            return (
              <section key={catId}>
                <h2 className="text-[11px] font-mono uppercase tracking-widest font-bold mb-12 flex items-center gap-2" style={{ color: catInfo.color }}>
                  <Icon className="w-4 h-4" /> {catInfo.label}
                  <span className={`${theme.textMuted} opacity-60`}>· {items.length}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(({ cfg, m }) => <IndicatorCard key={cfg.id} cfg={cfg} m={m} theme={theme} />)}
                </div>
              </section>
            );
          })}

          {/* ---- 8. ALERT PANEL ---- */}
          <section className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel`}
            style={{ borderColor: alerts.length > 0 ? '#ff174455' : undefined }}>
            <h2 className="text-[11px] font-mono uppercase tracking-widest font-bold mb-12 flex items-center gap-2 text-[#ff8c00]">
              <Bell className="w-4 h-4" /> Alert Panel
              <span className={`${theme.textMuted} opacity-60`}>· {alerts.length} attivi</span>
            </h2>
            {alerts.length === 0 ? (
              <div className="flex items-center gap-2 py-14">
                <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
                <span className={`text-xs font-mono ${theme.textMuted}`}>Nessun alert attivo. Indicatori entro soglie normali.</span>
              </div>
            ) : (
              <div className="space-y-10">
                {alerts.map((a, i) => {
                  const c = a.severity === 'critical' ? '#ff1744' : a.severity === 'high' ? '#ff8c00' : a.severity === 'medium' ? '#ffd740' : '#66bb6a';
                  return (
                    <motion.div
                      key={a.code}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={`${theme.card} border ${theme.borderLight} rounded p-3 flex items-start gap-3`}
                      style={{ borderLeftColor: c, borderLeftWidth: 3 }}
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: c }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-black tracking-widest" style={{ color: c }}>{a.code}</span>
                          <span className="text-[9px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded"
                            style={{ background: `${c}15`, color: c }}>
                            {a.severity}
                          </span>
                          <span className={`text-[10px] font-mono ${theme.textMuted}`}>{a.source}</span>
                        </div>
                        <p className={`mt-1 text-xs font-mono ${theme.textBold}`}>{a.message}</p>
                      </div>
                      <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: c }}>
                        {fmtNum(a.value)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ---- 9. HEATMAP ---- */}
          <section>
            <h2 className="text-[11px] font-mono uppercase tracking-widest font-bold mb-12 flex items-center gap-2 text-[#ff8c00]">
              <Layers className="w-4 h-4" /> Heatmap Indicatori
            </h2>
            <div className={`${theme.panel} border ${theme.border} rounded-lg overflow-hidden glow-panel`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
                      <th className="px-3 py-12 text-left">Indicatore</th>
                      <th className="px-3 py-12 text-left">Cat.</th>
                      <th className="px-3 py-12 text-right">Valore</th>
                      <th className="px-3 py-12 text-right">1D</th>
                      <th className="px-3 py-12 text-right">1W</th>
                      <th className="px-3 py-12 text-right">1M</th>
                      <th className="px-3 py-12 text-right">Z-Score</th>
                      <th className="px-3 py-12 text-right">Pctile</th>
                      <th className="px-3 py-12 text-center">Regime</th>
                      <th className="px-3 py-12 text-center">Score</th>
                      <th className="px-3 py-12 text-right">Contrib.</th>
                      <th className="px-3 py-12 text-center">Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INDICATORS_CONFIG.map(cfg => {
                      const m = data[cfg.id];
                      if (!m) return (
                        <tr key={cfg.id} className={`border-t ${theme.borderLight} opacity-50`}>
                          <td className="px-3 py-14 font-mono text-xs font-bold">{cfg.name}</td>
                          <td className="px-3 py-14 font-mono text-[10px]" colSpan={11}>
                            <span className={`${theme.textMuted} italic`}>Dati non disponibili</span>
                          </td>
                        </tr>
                      );
                      const ri = REGIME_COLORS[m.regime] || REGIME_COLORS.medium;
                      const cellBg = (s) => ({ background: `${ri.c}${Math.round(Math.min(40, s * 0.4)).toString(16).padStart(2, '0')}` });
                      return (
                        <tr key={cfg.id} className={`border-t ${theme.borderLight}`}>
                          <td className="px-3 py-14 font-mono text-xs font-bold">{cfg.name}</td>
                          <td className={`px-3 py-14 font-mono text-[10px] ${theme.textMuted}`}>{(CATEGORIES[cfg.cat] || {}).label?.split(' ')[0]}</td>
                          <td className={`px-3 py-14 text-right font-mono text-xs ${theme.textBold}`}>{fmtNum(m.last)}</td>
                          <td className="px-3 py-14 text-right font-mono text-[10px]" style={{ color: m.pct1 >= 0 ? '#00e676' : '#ff1744' }}>{fmtPct(m.pct1)}</td>
                          <td className="px-3 py-14 text-right font-mono text-[10px]" style={{ color: m.pct5 >= 0 ? '#00e676' : '#ff1744' }}>{fmtPct(m.pct5)}</td>
                          <td className="px-3 py-14 text-right font-mono text-[10px]" style={{ color: m.pct20 >= 0 ? '#00e676' : '#ff1744' }}>{fmtPct(m.pct20)}</td>
                          <td className={`px-3 py-14 text-right font-mono text-[10px] ${theme.textBold}`}>{fmtSigned(m.zScore, 1)}</td>
                          <td className={`px-3 py-14 text-right font-mono text-[10px] ${theme.textBold}`}>{Math.round(m.percentile)}°</td>
                          <td className="px-3 py-14 text-center">
                            <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded"
                              style={{ background: `${ri.c}25`, color: ri.c }}>
                              {ri.label}
                            </span>
                          </td>
                          <td className="px-3 py-14 text-center font-mono text-xs font-black" style={cellBg(m.score)}>
                            <span style={{ color: ri.c }}>{Math.round(m.score)}</span>
                          </td>
                          <td className={`px-3 py-14 text-right font-mono text-[10px] ${theme.textBold}`}>{m.contribution.toFixed(1)}</td>
                          <td className="px-3 py-14 text-center">
                            {m.alertActive
                              ? <AlertTriangle className="w-3.5 h-3.5 inline" style={{ color: ri.c }} />
                              : <span className={`text-[10px] ${theme.textMuted}`}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ---- 10. OPERATIONAL GUIDANCE ---- */}
          {guidance && (
            <section className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel`}
              style={{ borderColor: `${composite.regimeColor}55` }}>
              <h2 className="text-[11px] font-mono uppercase tracking-widest font-bold mb-12 flex items-center gap-2"
                style={{ color: composite.regimeColor }}>
                <Target className="w-4 h-4" /> Implicazioni Operative — {guidance.title}
              </h2>
              <ul className={`space-y-10 text-xs font-mono ${theme.textMuted} leading-relaxed`}>
                {guidance.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bold flex-shrink-0" style={{ color: composite.regimeColor }}>›</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ---- METHODOLOGY ---- */}
          <section className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel`}>
            <h2 className="text-[11px] font-mono uppercase tracking-widest font-bold text-[#ff8c00] mb-12 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Metodologia
            </h2>
            <div className={`text-xs font-mono ${theme.textMuted} leading-relaxed space-y-10`}>
              <p>
                <span className={theme.textBold}>Volatility Regime Score</span>: media pesata degli score per indicatore.
                Ogni indicatore è normalizzato 0-100 via percentile rank vs. storico 2 anni
                (più alto = più stress; per indicatori "lower=stress" come yield curve è invertito).
              </p>
              <p>
                <span className={theme.textBold}>Pesi composite</span>: VIX 18% · MOVE 15% · HY Credit 8% · IG Credit 4% ·
                VVIX 7% · Realized Vol 7% · IV-RV 5% · Cross-Sector Corr 8% · DXY 4% · Yield Curve 5% · Funding 5% · OVX 7% · GVZ 7%.
              </p>
              <p>
                <span className={theme.textBold}>Soglie regime</span> per indicatori con thresholds fissi (VIX, MOVE, ecc.) sono
                calibrate su valori istituzionali standard. Per indicatori senza soglie fisse (DXY, credit proxies) si usa
                percentile dinamico vs. storico.
              </p>
              <p>
                <span className={theme.textBold}>Alert</span>: si attivano quando un indicatore supera la soglia critica
                o si trova oltre il 90° (10°) percentile storico. Severità derivata dallo score 0-100.
              </p>
              <p>
                <span className={theme.textBold}>Estensibilità</span>: aggiungere nuovi indicatori = una riga in
                <code className={`${theme.textBold} mx-1`}>INDICATORS_CONFIG</code> (`useVolatilityRegime.js`),
                con tipo, fonte, peso, soglie. Il resto è automatico.
              </p>
              {errors.length > 0 && (
                <p className="text-[#ff8c00]">
                  Indicatori non disponibili: {errors.join(', ')}. I pesi vengono ridistribuiti tra quelli disponibili.
                </p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
