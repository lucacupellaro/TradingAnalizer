import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, RefreshCw, AlertTriangle, ShieldCheck, Minus, Layers, ArrowRight } from 'lucide-react';
import { useMarketRegime } from '../hooks/useMarketRegime';
import StockAnalyzer from './StockAnalyzer';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger = (delay = 0, step = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});

const COLORS = {
  green: '#00e676',
  red: '#ff1744',
  white: '#a0a0a0',
  amber: '#ffa726',
  blue: '#64b5f6',
};

// Returns: 'green' (sana), 'white' (neutra), 'red' (pericolo)
function classifyVVIX_VIX(r) {
  if (r == null || isNaN(r)) return 'white';
  if (r >= 4 && r <= 7) return 'green';
  if ((r >= 3 && r < 4) || (r > 7 && r <= 9)) return 'white';
  return 'red';
}

function classifySPY_RSP(r) {
  if (r == null || isNaN(r)) return 'white';
  if (r < 1.5) return 'green';
  if (r < 2.0) return 'white';
  return 'red';
}

function classifyIWD_IWF(r) {
  if (r == null || isNaN(r)) return 'white';
  if (r >= 0.5 && r <= 0.7) return 'green';
  if ((r >= 0.4 && r < 0.5) || (r > 0.7 && r <= 0.9)) return 'white';
  return 'red';
}

function classifySPHB_SPLV(r) {
  if (r == null || isNaN(r)) return 'white';
  if (r >= 0.4 && r <= 0.6) return 'green';
  if ((r >= 0.3 && r < 0.4) || (r > 0.6 && r <= 0.7)) return 'white';
  return 'red';
}

function classifyCyclical(r) {
  if (r == null || isNaN(r)) return 'white';
  if (r >= 1.4 && r <= 1.8) return 'green';
  if ((r >= 1.2 && r < 1.4) || (r > 1.8 && r <= 2.2)) return 'white';
  return 'red';
}

// Produce a color from green to red for a value within [min,max]
function statusColor(status) {
  return status === 'green' ? COLORS.green : status === 'red' ? COLORS.red : COLORS.white;
}

function statusLabel(status) {
  return status === 'green' ? 'SANA' : status === 'red' ? 'PERICOLO' : 'NEUTRA';
}

// Compute regime label combining all signals
function computeRegime(signals) {
  const { vvixVix, spyRsp, iwdIwf, sphbSplv, xlyXlp, xliXlu } = signals;

  // Score: risk-on (positive) vs risk-off (negative)
  let riskScore = 0;
  let growthScore = 0;
  let volScore = 0;

  if (sphbSplv != null) {
    if (sphbSplv > 0.6) riskScore += 2;
    else if (sphbSplv > 0.5) riskScore += 1;
    else if (sphbSplv < 0.4) riskScore -= 2;
    else if (sphbSplv < 0.5) riskScore -= 1;
  }

  if (iwdIwf != null) {
    if (iwdIwf < 0.5) growthScore += 2;
    else if (iwdIwf < 0.6) growthScore += 1;
    else if (iwdIwf > 0.8) growthScore -= 2;
    else if (iwdIwf > 0.7) growthScore -= 1;
  }

  if (xlyXlp != null) {
    if (xlyXlp > 1.8) growthScore += 2;
    else if (xlyXlp > 1.5) growthScore += 1;
    else if (xlyXlp < 1.2) growthScore -= 2;
    else if (xlyXlp < 1.4) growthScore -= 1;
  }

  if (xliXlu != null) {
    if (xliXlu > 1.5) growthScore += 1;
    else if (xliXlu < 1.0) growthScore -= 1;
  }

  if (vvixVix != null) {
    if (vvixVix < 4) volScore -= 2;
    else if (vvixVix > 9) volScore -= 1;
    else volScore += 1;
  }

  // Determine regime
  let regime, color, desc;
  if (growthScore >= 3 && riskScore >= 1 && volScore >= 0) {
    regime = 'ESPANSIONE';
    color = COLORS.green;
    desc = 'Crescita economica forte, risk-on, volatilità contenuta. Asset rischiosi favoriti.';
  } else if (growthScore <= -3 && riskScore <= -1) {
    regime = 'RECESSIONE';
    color = COLORS.red;
    desc = 'Contrazione economica, risk-off, fuga verso difensivi e qualità.';
  } else if (growthScore <= -1 && volScore < 0) {
    regime = 'STAGFLAZIONE';
    color = '#ff6d00';
    desc = 'Bassa crescita + volatilità persistente. Cicliche deboli, vol elevata.';
  } else if (growthScore >= 1 && volScore < 0) {
    regime = 'REFLAZIONE';
    color = COLORS.amber;
    desc = 'Crescita ma con vol elevata. Materie prime e value possono sovraperformare.';
  } else if (growthScore >= 0 && riskScore >= 0 && volScore >= 0) {
    regime = 'GOLDILOCKS';
    color = COLORS.green;
    desc = 'Crescita moderata, vol bassa, sentiment positivo. Contesto ideale.';
  } else if (riskScore <= -1 && growthScore >= 0) {
    regime = 'RISK-OFF';
    color = COLORS.red;
    desc = 'Avversione al rischio nonostante crescita stabile. Difensivi favoriti.';
  } else {
    regime = 'TRANSIZIONE';
    color = COLORS.white;
    desc = 'Segnali misti, regime non chiaramente definito. Cautela.';
  }

  return { regime, color, desc, riskScore, growthScore, volScore };
}

// Color zone bar — visual representation of where the value sits
const RangeBar = ({ value, ranges, status }) => {
  // ranges: array of { from, to, color }
  if (value == null || isNaN(value)) return <div className="text-xs text-[#555] font-mono">N/D</div>;
  const min = Math.min(...ranges.map(r => r.from));
  const max = Math.max(...ranges.map(r => r.to));
  const clamped = Math.max(min, Math.min(max, value));
  const pct = ((clamped - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <div className="relative h-2.5 rounded-full overflow-hidden flex">
        {ranges.map((r, i) => {
          const w = ((r.to - r.from) / (max - min)) * 100;
          return <div key={i} style={{ width: `${w}%`, background: r.color, opacity: 0.45 }} />;
        })}
      </div>
      <div className="relative h-3 mt-0">
        <div
          className="absolute -top-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent"
          style={{ left: `calc(${pct}% - 6px)`, borderBottomColor: statusColor(status) }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[9px] font-mono text-[#555]">
        <span>{min.toFixed(1)}</span>
        <span>{((min + max) / 2).toFixed(1)}</span>
        <span>{max.toFixed(1)}</span>
      </div>
    </div>
  );
};

const IndicatorCard = ({ title, ratio, formula, value, change, status, ranges, interpretation, isDark, theme }) => {
  const color = statusColor(status);
  const label = statusLabel(status);
  return (
    <motion.div
      variants={fadeUp}
      className={`${theme.panel} border ${theme.border} rounded-lg p-14 flex flex-col glow-panel`}
      style={{ borderColor: status === 'red' ? `${color}55` : status === 'green' ? `${color}33` : undefined }}
    >
      <div className="flex items-start justify-between mb-12">
        <div>
          <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#ff8c00]">{ratio}</h3>
          <p className={`text-sm font-bold mt-0.5 ${theme.textBold}`}>{title}</p>
        </div>
        <span
          className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-14 rounded border"
          style={{ color, borderColor: `${color}55`, background: `${color}10` }}
        >
          {label}
        </span>
      </div>

      <div className="flex items-baseline gap-3 mb-10">
        <span className="text-3xl font-black font-mono" style={{ color }}>
          {value != null && !isNaN(value) ? value.toFixed(2) : '—'}
        </span>
        {change != null && !isNaN(change) && (
          <span className={`text-xs font-mono font-bold ${change >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}% MoM
          </span>
        )}
      </div>

      <RangeBar value={value} ranges={ranges} status={status} />

      <div className={`mt-10 pt-3 border-t ${theme.borderLight} text-[11px] leading-relaxed ${theme.textMuted} font-mono`}>
        <span className="font-mono text-[9px] uppercase tracking-widest text-[#555] block mb-1">{formula}</span>
        {interpretation}
      </div>
    </motion.div>
  );
};

// 2D regime matrix — shows position based on growth × risk-appetite
const RegimeMatrix = ({ growthScore, riskScore, regime, color, theme, isDark }) => {
  const x = Math.max(-4, Math.min(4, growthScore)); // -4..+4
  const y = Math.max(-4, Math.min(4, riskScore));
  const left = ((x + 4) / 8) * 100;
  const top = ((4 - y) / 8) * 100;

  const quadrants = [
    { x: 0, y: 0, w: 50, h: 50, label: 'BOLLA / SPECULAZIONE', color: COLORS.amber },
    { x: 50, y: 0, w: 50, h: 50, label: 'ESPANSIONE / RISK-ON', color: COLORS.green },
    { x: 0, y: 50, w: 50, h: 50, label: 'RECESSIONE / RISK-OFF', color: COLORS.red },
    { x: 50, y: 50, w: 50, h: 50, label: 'STAGFLAZIONE / DIFENSIVO', color: '#ff6d00' },
  ];

  return (
    <div className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel`}>
      <div className="flex items-center justify-between mb-12 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#ff8c00]" />
          <div>
            <h3 className="text-[11px] uppercase tracking-widest font-mono font-bold text-[#ff8c00]">
              Matrice di Regime
            </h3>
            <p className={`text-sm ${theme.textMuted} font-mono`}>Crescita × Risk Appetite</p>
          </div>
        </div>
        <div
          className="px-4 py-14 rounded font-mono font-bold uppercase tracking-widest text-sm border"
          style={{ color, borderColor: `${color}66`, background: `${color}15` }}
        >
          {regime}
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-md mx-auto">
        {/* Quadrants */}
        {quadrants.map((q, i) => (
          <div
            key={i}
            className="absolute border border-dashed flex items-center justify-center text-center p-3"
            style={{
              left: `${q.x}%`,
              top: `${q.y}%`,
              width: `${q.w}%`,
              height: `${q.h}%`,
              borderColor: `${q.color}33`,
              background: `${q.color}08`,
            }}
          >
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: q.color, opacity: 0.6 }}>
              {q.label}
            </span>
          </div>
        ))}

        {/* Axes */}
        <div className="absolute left-0 top-1/2 w-full h-px" style={{ background: isDark ? '#333' : '#d1d5db' }} />
        <div className="absolute top-0 left-1/2 h-full w-px" style={{ background: isDark ? '#333' : '#d1d5db' }} />

        {/* Marker */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'backOut', delay: 0.3 }}
          className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            background: color,
            boxShadow: `0 0 0 4px ${color}33, 0 0 16px ${color}aa`,
          }}
        />

        {/* Axis labels */}
        <div className={`absolute -bottom-7 left-0 text-[9px] font-mono ${theme.textMuted} uppercase tracking-widest`}>
          ← Difensivo
        </div>
        <div className={`absolute -bottom-7 right-0 text-[9px] font-mono ${theme.textMuted} uppercase tracking-widest`}>
          Ciclico →
        </div>
        <div className={`absolute -left-2 -top-7 text-[9px] font-mono ${theme.textMuted} uppercase tracking-widest`}>
          ↑ Risk-On
        </div>
        <div className={`absolute -left-2 -bottom-7 text-[9px] font-mono ${theme.textMuted} uppercase tracking-widest -translate-y-full`}>
          ↓ Risk-Off
        </div>
      </div>
    </div>
  );
};

export default function MarketRegime({ isDark, theme, setActiveTab }) {
  const { data, isLoading, lastUpdated, error, reload } = useMarketRegime();

  const signals = useMemo(() => {
    const get = (s) => data[s]?.price ?? null;
    const chg = (s) => data[s]?.monthChangePct ?? null;

    const vix = get('^VIX'), vvix = get('^VVIX');
    const spy = get('SPY'), rsp = get('RSP');
    const iwd = get('IWD'), iwf = get('IWF');
    const sphb = get('SPHB'), splv = get('SPLV');
    const xly = get('XLY'), xlp = get('XLP');
    const xli = get('XLI'), xlu = get('XLU');

    const vvixVix = (vix && vvix) ? vvix / vix : null;
    const spyRsp  = (spy && rsp) ? spy / rsp : null;
    const iwdIwf  = (iwd && iwf) ? iwd / iwf : null;
    const sphbSplv = (sphb && splv) ? sphb / splv : null;
    const xlyXlp  = (xly && xlp) ? xly / xlp : null;
    const xliXlu  = (xli && xlu) ? xli / xlu : null;

    return {
      vvixVix, spyRsp, iwdIwf, sphbSplv, xlyXlp, xliXlu,
      raw: { vix, vvix, spy, rsp, iwd, iwf, sphb, splv, xly, xlp, xli, xlu },
      chg: { vix: chg('^VIX'), vvix: chg('^VVIX'), spy: chg('SPY'), rsp: chg('RSP'),
             iwd: chg('IWD'), iwf: chg('IWF'), sphb: chg('SPHB'), splv: chg('SPLV'),
             xly: chg('XLY'), xlp: chg('XLP'), xli: chg('XLI'), xlu: chg('XLU') },
    };
  }, [data]);

  const ratioChange = (a, b, dataA, dataB) => {
    if (!dataA || !dataB || dataA.length < 2 || dataB.length < 2) return null;
    const cur = dataA[dataA.length - 1] / dataB[dataB.length - 1];
    const past = dataA[0] / dataB[0];
    return ((cur - past) / past) * 100;
  };

  const changes = useMemo(() => ({
    vvixVix: ratioChange('^VVIX', '^VIX', data['^VVIX']?.history, data['^VIX']?.history),
    spyRsp: ratioChange('SPY', 'RSP', data['SPY']?.history, data['RSP']?.history),
    iwdIwf: ratioChange('IWD', 'IWF', data['IWD']?.history, data['IWF']?.history),
    sphbSplv: ratioChange('SPHB', 'SPLV', data['SPHB']?.history, data['SPLV']?.history),
    xlyXlp: ratioChange('XLY', 'XLP', data['XLY']?.history, data['XLP']?.history),
    xliXlu: ratioChange('XLI', 'XLU', data['XLI']?.history, data['XLU']?.history),
  }), [data]);

  const regime = useMemo(() => computeRegime(signals), [signals]);

  const indicators = [
    {
      ratio: 'VVIX / VIX',
      title: 'Volatilità della Volatilità',
      formula: 'VVIX ÷ VIX',
      value: signals.vvixVix,
      change: changes.vvixVix,
      status: classifyVVIX_VIX(signals.vvixVix),
      ranges: [
        { from: 2, to: 4, color: COLORS.red },
        { from: 4, to: 7, color: COLORS.green },
        { from: 7, to: 9, color: COLORS.white },
        { from: 9, to: 12, color: COLORS.red },
      ],
      interpretation: 'Range 4-7 = mercato stabile. <4 vol elevata persistente. >7 calma apparente con rischio latente.',
    },
    {
      ratio: 'SPY / RSP',
      title: 'Concentrazione di Mercato',
      formula: 'SPY (cap-weighted) ÷ RSP (equal-weight)',
      value: signals.spyRsp,
      change: changes.spyRsp,
      status: classifySPY_RSP(signals.spyRsp),
      ranges: [
        { from: 1.0, to: 1.5, color: COLORS.green },
        { from: 1.5, to: 2.0, color: COLORS.white },
        { from: 2.0, to: 3.0, color: COLORS.red },
      ],
      interpretation: 'In aumento = mercato trainato da poche large-cap (rischio sistemico). In calo = performance diffusa, sano.',
    },
    {
      ratio: 'IWD / IWF',
      title: 'Value vs Growth',
      formula: 'IWD (Value) ÷ IWF (Growth)',
      value: signals.iwdIwf,
      change: changes.iwdIwf,
      status: classifyIWD_IWF(signals.iwdIwf),
      ranges: [
        { from: 0.3, to: 0.4, color: COLORS.red },
        { from: 0.4, to: 0.5, color: COLORS.white },
        { from: 0.5, to: 0.7, color: COLORS.green },
        { from: 0.7, to: 0.9, color: COLORS.white },
        { from: 0.9, to: 1.1, color: COLORS.red },
      ],
      interpretation: 'In aumento = sovraperformance Value (difensivo). In diminuzione = Growth domina (espansivo).',
    },
    {
      ratio: 'SPHB / SPLV',
      title: 'High Beta vs Low Vol',
      formula: 'SPHB (High Beta) ÷ SPLV (Low Vol)',
      value: signals.sphbSplv,
      change: changes.sphbSplv,
      status: classifySPHB_SPLV(signals.sphbSplv),
      ranges: [
        { from: 0.2, to: 0.3, color: COLORS.red },
        { from: 0.3, to: 0.4, color: COLORS.white },
        { from: 0.4, to: 0.6, color: COLORS.green },
        { from: 0.6, to: 0.7, color: COLORS.white },
        { from: 0.7, to: 0.9, color: COLORS.red },
      ],
      interpretation: 'In aumento = risk-on, preferenza asset rischiosi. In diminuzione = risk-off, fuga verso difensivi.',
    },
    {
      ratio: 'XLY / XLP',
      title: 'Cicliche vs Non Cicliche',
      formula: 'XLY (Discrezionali) ÷ XLP (Beni di prima necessità)',
      value: signals.xlyXlp,
      change: changes.xlyXlp,
      status: classifyCyclical(signals.xlyXlp),
      ranges: [
        { from: 0.8, to: 1.2, color: COLORS.red },
        { from: 1.2, to: 1.4, color: COLORS.white },
        { from: 1.4, to: 1.8, color: COLORS.green },
        { from: 1.8, to: 2.2, color: COLORS.white },
        { from: 2.2, to: 2.6, color: COLORS.red },
      ],
      interpretation: 'In aumento = aspettative di crescita (espansione). In diminuzione = cautela, possibile rallentamento.',
    },
    {
      ratio: 'XLI / XLU',
      title: 'Industriali vs Utility',
      formula: 'XLI (Industriali) ÷ XLU (Utility)',
      value: signals.xliXlu,
      change: changes.xliXlu,
      status: signals.xliXlu == null ? 'white' : signals.xliXlu > 1.4 ? 'green' : signals.xliXlu < 1.0 ? 'red' : 'white',
      ranges: [
        { from: 0.6, to: 1.0, color: COLORS.red },
        { from: 1.0, to: 1.4, color: COLORS.white },
        { from: 1.4, to: 2.0, color: COLORS.green },
        { from: 2.0, to: 2.4, color: COLORS.white },
      ],
      interpretation: 'In aumento = appetito ciclico (espansione). In diminuzione = preferenza difensivi (recessivo).',
    },
  ];

  return (
    <div className="space-y-14 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl md:text-4xl font-black font-mono uppercase tracking-tight ${theme.textBold}`}>
            Market <span className="text-[#ff8c00] glow-orange">Regime</span>
          </h1>
          <p className={`mt-10 text-sm font-mono ${theme.textMuted}`}>
            Pannello live · Indicatori macro per identificare il regime di mercato (espansione, recessione, stagflazione)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
              Aggiornato: {lastUpdated.toLocaleTimeString('it-IT')}
            </span>
          )}
          <button
            onClick={reload}
            disabled={isLoading}
            className={`p-2.5 rounded border ${theme.navBtnBg} ${theme.navText} ${theme.navHover} transition-all disabled:opacity-50`}
            title="Ricarica"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded border border-[#ff1744]/40 bg-[#ff1744]/10 text-[#ff1744] text-sm font-mono">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {error}
        </div>
      )}

      {isLoading && Object.keys(data).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#ff8c00]" />
          <span className={`text-xs font-mono uppercase tracking-widest ${theme.textMuted}`}>
            Caricamento dati di mercato...
          </span>
        </div>
      ) : (
        <>
          {/* Regime banner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel`}
            style={{ borderColor: `${regime.color}55` }}
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div
                className="w-3 h-3 rounded-full pulse-live"
                style={{ background: regime.color, boxShadow: `0 0 16px ${regime.color}` }}
              />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">
                Regime corrente:
              </span>
              <span
                className="text-2xl md:text-3xl font-black font-mono uppercase tracking-tight"
                style={{ color: regime.color, textShadow: `0 0 12px ${regime.color}66` }}
              >
                {regime.regime}
              </span>
              <span className={`flex-1 min-w-[280px] text-sm font-mono ${theme.textMuted}`}>
                {regime.desc}
              </span>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3">
              <ScoreBadge label="Crescita" value={regime.growthScore} icon={TrendingUp} theme={theme} />
              <ScoreBadge label="Risk Appetite" value={regime.riskScore} icon={ShieldCheck} theme={theme} />
              <ScoreBadge label="Volatilità" value={regime.volScore} icon={Activity} theme={theme} invert />
            </div>
          </motion.div>

          {/* Indicators grid */}
          <motion.div
            variants={stagger(0, 0.06)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {indicators.map((ind) => (
              <IndicatorCard key={ind.ratio} {...ind} isDark={isDark} theme={theme} />
            ))}
          </motion.div>

          {/* Regime matrix */}
          <RegimeMatrix
            growthScore={regime.growthScore}
            riskScore={regime.riskScore}
            regime={regime.regime}
            color={regime.color}
            theme={theme}
            isDark={isDark}
          />

          {/* CTA — link to Themes overview */}
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('themes')}
              className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel w-full text-left flex items-center justify-between gap-4 group transition-all hover:border-[#ff8c00]/50`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: '#ff8c0015', border: '1px solid #ff8c0040' }}>
                  <Layers className="w-5 h-5 text-[#ff8c00]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold font-mono text-[#ff8c00] uppercase tracking-widest">
                    Esplora i temi di investimento
                  </h4>
                  <p className={`text-xs font-mono ${theme.textMuted} mt-0.5`}>
                    Overview di 16+ temi (AI, Cloud, Semis, Cyber, Renewables...) con score aggregato e breadth.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#ff8c00] flex-shrink-0 transition-transform group-hover:translate-x-1" />
            </button>
          )}

          {/* Stock screener */}
          <StockAnalyzer regimeLabel={regime.regime} isDark={isDark} theme={theme} />

          {/* Legend */}
          <div className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel`}>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#ff8c00] font-bold mb-12">
              Legenda zone di colore
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: COLORS.green }} />
                <span className={theme.textMuted}><span className={theme.textBold}>Sana</span> — condizioni di mercato favorevoli</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: COLORS.white }} />
                <span className={theme.textMuted}><span className={theme.textBold}>Neutra</span> — zona di transizione</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: COLORS.red }} />
                <span className={theme.textMuted}><span className={theme.textBold}>Pericolo</span> — segnale di stress</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const ScoreBadge = ({ label, value, icon: Icon, theme, invert = false }) => {
  const v = value ?? 0;
  const positive = invert ? v < 0 : v > 0;
  const negative = invert ? v > 0 : v < 0;
  const color = positive ? COLORS.green : negative ? COLORS.red : COLORS.white;
  return (
    <div className={`${theme.card} border ${theme.borderLight} rounded p-3 flex items-center gap-3`}>
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-mono uppercase tracking-widest text-[#555]">{label}</div>
        <div className="font-mono font-bold text-sm flex items-center gap-1.5" style={{ color }}>
          {v > 0 ? <TrendingUp className="w-3 h-3" /> : v < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {v > 0 ? '+' : ''}{v}
        </div>
      </div>
    </div>
  );
};
