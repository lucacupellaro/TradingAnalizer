import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Layers, RefreshCw, ArrowUpRight, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

// Curated themes — each is a small basket of representative tickers
// score / returns / sparkline are computed by aggregating constituents
const THEMES = [
  {
    id: 'ai',
    name: 'Intelligenza Artificiale',
    desc: 'Aziende leader nei modelli, GPU, software e infrastruttura AI.',
    color: '#00e676',
    accent: '#00b894',
    constituents: ['NVDA', 'MSFT', 'GOOGL', 'META', 'AMD', 'PLTR', 'AVGO'],
  },
  {
    id: 'mag7',
    name: 'Magnifici 7',
    desc: 'Le 7 mega-cap che dominano la capitalizzazione USA.',
    color: '#ff8c00',
    accent: '#e87a00',
    constituents: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'],
  },
  {
    id: 'cloud',
    name: 'Cloud Computing',
    desc: 'Infrastruttura cloud (IaaS/PaaS/SaaS) e migrazione enterprise.',
    color: '#64b5f6',
    accent: '#42a5f5',
    constituents: ['MSFT', 'AMZN', 'GOOGL', 'ORCL', 'CRM', 'SNOW', 'NOW'],
  },
  {
    id: 'semis',
    name: 'Semiconduttori',
    desc: 'Foundry, fabless e produttori di chip ad alto margine.',
    color: '#a78bfa',
    accent: '#9575ff',
    constituents: ['NVDA', 'AMD', 'TSM', 'AVGO', 'QCOM', 'INTC', 'MU', 'AMAT'],
  },
  {
    id: 'cyber',
    name: 'Cybersecurity',
    desc: 'Endpoint, cloud security, identity, network security.',
    color: '#ec407a',
    accent: '#d81b60',
    constituents: ['CRWD', 'PANW', 'ZS', 'NET', 'FTNT', 'OKTA', 'S'],
  },
  {
    id: 'biotech',
    name: 'Biotech & Pharma',
    desc: 'Big pharma e biotech con pipeline di prossima generazione.',
    color: '#26c6da',
    accent: '#00bcd4',
    constituents: ['LLY', 'JNJ', 'PFE', 'MRK', 'AMGN', 'GILD', 'REGN', 'VRTX'],
  },
  {
    id: 'ev',
    name: 'Veicoli Elettrici',
    desc: 'EV maker, batterie, charging e supply chain elettrica.',
    color: '#ffd740',
    accent: '#ffc107',
    constituents: ['TSLA', 'RIVN', 'LCID', 'NIO', 'BYDDY', 'F', 'GM'],
  },
  {
    id: 'renewables',
    name: 'Energie Rinnovabili',
    desc: 'Solare, eolico, idrogeno e utility verdi.',
    color: '#66bb6a',
    accent: '#43a047',
    constituents: ['NEE', 'ENPH', 'FSLR', 'ICLN', 'SEDG', 'PLUG', 'BEP'],
  },
  {
    id: 'banks',
    name: 'Banche USA',
    desc: 'Big bank money-center, sensibili a tassi e ciclo creditizio.',
    color: '#ffa726',
    accent: '#ff9800',
    constituents: ['JPM', 'BAC', 'GS', 'MS', 'WFC', 'C'],
  },
  {
    id: 'energy',
    name: 'Petrolio & Gas',
    desc: 'Major integrate, E&P e servizi oilfield.',
    color: '#ef5350',
    accent: '#e53935',
    constituents: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'OXY'],
  },
  {
    id: 'consumer',
    name: 'Consumi Discrezionali',
    desc: 'Retail, ristoranti, e-commerce e travel.',
    color: '#ab47bc',
    accent: '#8e24aa',
    constituents: ['AMZN', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW'],
  },
  {
    id: 'staples',
    name: 'Beni di Consumo Difensivi',
    desc: 'Food, beverage, household e personal care.',
    color: '#78909c',
    accent: '#607d8b',
    constituents: ['WMT', 'KO', 'PEP', 'PG', 'COST', 'PM', 'CL'],
  },
  {
    id: 'reit',
    name: 'Real Estate (REIT)',
    desc: 'Logistica, data center, telecom tower, residenziale.',
    color: '#8d6e63',
    accent: '#6d4c41',
    constituents: ['PLD', 'AMT', 'EQIX', 'CCI', 'SPG', 'O', 'AVB'],
  },
  {
    id: 'gold-miners',
    name: 'Miniere Auro & Argento',
    desc: 'Major minerarie, sensibili al prezzo dei metalli preziosi.',
    color: '#ffca28',
    accent: '#ffb300',
    constituents: ['NEM', 'GOLD', 'AEM', 'KGC', 'PAAS'],
  },
  {
    id: 'crypto-equity',
    name: 'Crypto Equity',
    desc: 'Aziende esposte a Bitcoin, mining e infrastruttura crypto.',
    color: '#f6ad55',
    accent: '#dd6b20',
    constituents: ['COIN', 'MARA', 'RIOT', 'MSTR', 'IBIT'],
  },
  {
    id: 'aerospace',
    name: 'Difesa & Aerospazio',
    desc: 'Contractor militari, prime aerospaziali, spazio commerciale.',
    color: '#5c6bc0',
    accent: '#3949ab',
    constituents: ['LMT', 'RTX', 'NOC', 'GD', 'BA', 'TXT'],
  },
];

// Reuse the same proxy/fetch pattern as StockAnalyzer
const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const fetchJson = async (targetUrl) => {
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(targetUrl));
      if (!res.ok) continue;
      const text = await res.text();
      return JSON.parse(text);
    } catch { continue; }
  }
  throw new Error('All proxies failed');
};

const fetchTickerHistory = async (symbol) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;
    const json = await fetchJson(url);
    const r = json.chart?.result?.[0];
    if (!r) return null;
    const closes = (r.indicators.quote[0].close || []).filter(c => c != null);
    if (closes.length < 5) return null;
    return closes;
  } catch {
    return null;
  }
};

// Compute aggregated metrics for a theme from its constituents' price history
const computeThemeMetrics = (constituentData) => {
  // constituentData: { [sym]: closesArray }
  const valid = Object.entries(constituentData).filter(([, c]) => c && c.length >= 5);
  if (valid.length === 0) return null;

  // Compute per-stock returns
  const stocks = valid.map(([sym, closes]) => {
    const last = closes[closes.length - 1];
    const ago = (n) => closes.length > n ? closes[closes.length - 1 - n] : closes[0];
    const r1d = ((last - ago(1))  / ago(1))  * 100;
    const r1w = ((last - ago(5))  / ago(5))  * 100;
    const r1m = ((last - ago(21)) / ago(21)) * 100;
    const r3m = ((last - closes[0]) / closes[0]) * 100;
    return { sym, last, r1d, r1w, r1m, r3m };
  });

  // Average returns
  const avg = (key) => stocks.reduce((a, b) => a + b[key], 0) / stocks.length;
  const r1dAvg = avg('r1d'), r1wAvg = avg('r1w'), r1mAvg = avg('r1m'), r3mAvg = avg('r3m');

  // Theme score 0-100: based on weighted return strength + breadth (% positive)
  const breadth = stocks.filter(s => s.r1m > 0).length / stocks.length; // fraction up over 1m
  let score = 50;
  score += Math.max(-25, Math.min(25, r1mAvg * 1.2));   // 1m momentum
  score += Math.max(-10, Math.min(15, r3mAvg * 0.5));   // 3m trend
  score += (breadth - 0.5) * 30;                          // breadth bonus
  score = Math.max(0, Math.min(100, Math.round(score)));

  let action, actionColor;
  if (score >= 75)      { action = 'STRONG BUY'; actionColor = '#00e676'; }
  else if (score >= 60) { action = 'BUY';        actionColor = '#66bb6a'; }
  else if (score >= 45) { action = 'HOLD';       actionColor = '#ffa726'; }
  else if (score >= 30) { action = 'SELL';       actionColor = '#ef5350'; }
  else                  { action = 'STRONG SELL';actionColor = '#ff1744'; }

  // Top 3 by 1-month return
  const sorted = [...stocks].sort((a, b) => b.r1m - a.r1m);
  const top3 = sorted.slice(0, 3);

  // Theme sparkline: equal-weighted index normalized to 100 over 3 months
  const minLen = Math.min(...valid.map(([, c]) => c.length));
  const sparkline = [];
  for (let i = 0; i < minLen; i++) {
    let sum = 0;
    valid.forEach(([, closes]) => {
      const offset = closes.length - minLen;
      sum += closes[i + offset] / closes[offset]; // normalized vs first point
    });
    sparkline.push((sum / valid.length) * 100);
  }

  return {
    score, action, actionColor,
    r1dAvg, r1wAvg, r1mAvg, r3mAvg,
    breadth: breadth * 100,
    stocks, top3,
    sparkline,
    coverage: valid.length,
  };
};

// SVG sparkline component
const Sparkline = ({ data, color, width = 160, height = 50 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const stepX = width / (data.length - 1);
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(height - ((v - min) / range) * height).toFixed(1)}`).join(' ');
  // Area under curve
  const area = path + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.slice(1)})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}88)` }} />
    </svg>
  );
};

// Card per tema
const ThemeCard = ({ theme, themeData, onSelect, isDark, themeUI }) => {
  const isLoading = !themeData;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      transition={{ duration: 0.4 }}
      onClick={() => onSelect(theme)}
      className={`${themeUI.panel} border ${themeUI.border} rounded-lg overflow-hidden glow-panel cursor-pointer group transition-all`}
      style={{ borderColor: themeData ? `${theme.color}40` : undefined }}
    >
      {/* Header bar with theme color */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${theme.color}, ${theme.accent})` }} />

      <div className="p-14">
        <div className="flex items-start justify-between mb-12">
          <div className="flex-1 min-w-0">
            <h3 className={`font-display text-base font-bold ${themeUI.textBold} truncate`}>{theme.name}</h3>
            <p className={`text-[11px] ${themeUI.textMuted} font-mono mt-0.5 line-clamp-1`}>{theme.desc}</p>
          </div>
          {themeData && (
            <div className="flex-shrink-0 ml-3">
              <span
                className="inline-block px-2.5 py-14 rounded text-[10px] font-mono font-black uppercase tracking-widest"
                style={{ background: themeData.actionColor, color: '#000' }}
              >
                {themeData.action}
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: theme.color }} />
            <span className={`text-[10px] font-mono uppercase tracking-widest ${themeUI.textMuted}`}>
              Caricamento...
            </span>
          </div>
        ) : (
          <>
            {/* Score + sparkline */}
            <div className="flex items-end justify-between gap-3 mb-10">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono" style={{ color: themeData.actionColor }}>
                    {themeData.score}
                  </span>
                  <span className="text-[10px] font-mono text-[#555]">/100</span>
                </div>
                <span className={`text-[9px] font-mono uppercase tracking-widest ${themeUI.textMuted}`}>SniperScore</span>
              </div>
              <Sparkline data={themeData.sparkline} color={theme.color} width={140} height={42} />
            </div>

            {/* Returns row */}
            <div className="grid grid-cols-3 gap-1.5 mb-10">
              {[
                { label: '1D', value: themeData.r1dAvg },
                { label: '1W', value: themeData.r1wAvg },
                { label: '1M', value: themeData.r1mAvg },
              ].map(r => {
                const c = r.value >= 0 ? '#00e676' : '#ff1744';
                return (
                  <div key={r.label} className={`${themeUI.card} border ${themeUI.borderLight} rounded p-2 text-center`}>
                    <div className={`text-[9px] font-mono ${themeUI.textMuted} uppercase`}>{r.label}</div>
                    <div className="font-mono font-bold text-xs" style={{ color: c }}>
                      {r.value >= 0 ? '+' : ''}{r.value.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top 3 + breadth */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {themeData.top3.map(s => (
                  <span
                    key={s.sym}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                      background: `${s.r1m >= 0 ? '#00e676' : '#ff1744'}15`,
                      color: s.r1m >= 0 ? '#00e676' : '#ff1744',
                      border: `1px solid ${s.r1m >= 0 ? '#00e676' : '#ff1744'}40`,
                    }}
                    title={`${s.sym}: ${s.r1m >= 0 ? '+' : ''}${s.r1m.toFixed(2)}% 1M`}
                  >
                    {s.sym}
                  </span>
                ))}
              </div>
              <span className={`text-[10px] font-mono ${themeUI.textMuted} flex items-center gap-1`}>
                Breadth <span className={themeUI.textBold}>{Math.round(themeData.breadth)}%</span>
              </span>
            </div>
          </>
        )}

        {/* Footer arrow */}
        <div className={`mt-10 pt-3 border-t border-[var(--c-border)] flex items-center justify-between text-[10px] font-mono uppercase tracking-widest ${themeUI.textMuted} group-hover:text-[#ff8c00] transition-colors`}>
          <span>{theme.constituents.length} costituenti</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
};

// Detail panel: when a theme is selected, show a deeper breakdown
const ThemeDetail = ({ theme, themeData, onClose, themeUI }) => {
  if (!themeData) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${themeUI.panel} border ${themeUI.border} rounded-lg p-14 glow-panel mb-12`}
      style={{ borderColor: `${theme.color}55` }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap mb-12">
        <div className="flex items-center gap-3">
          <div className="w-1 h-10 rounded-full" style={{ background: theme.color, boxShadow: `0 0 12px ${theme.color}` }} />
          <div>
            <h2 className={`font-display text-2xl font-black ${themeUI.textBold}`}>{theme.name}</h2>
            <p className={`text-xs ${themeUI.textMuted} font-mono`}>{theme.desc}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`text-[10px] font-mono uppercase tracking-widest ${themeUI.textMuted} hover:text-[#ff8c00] transition-colors`}
        >
          Chiudi ✕
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        <KPICard label="SniperScore" value={`${themeData.score}/100`} color={themeData.actionColor} themeUI={themeUI} />
        <KPICard label="1 Giorno"  value={`${themeData.r1dAvg >= 0 ? '+' : ''}${themeData.r1dAvg.toFixed(2)}%`} color={themeData.r1dAvg >= 0 ? '#00e676' : '#ff1744'} themeUI={themeUI} />
        <KPICard label="1 Settimana" value={`${themeData.r1wAvg >= 0 ? '+' : ''}${themeData.r1wAvg.toFixed(2)}%`} color={themeData.r1wAvg >= 0 ? '#00e676' : '#ff1744'} themeUI={themeUI} />
        <KPICard label="1 Mese"   value={`${themeData.r1mAvg >= 0 ? '+' : ''}${themeData.r1mAvg.toFixed(2)}%`} color={themeData.r1mAvg >= 0 ? '#00e676' : '#ff1744'} themeUI={themeUI} />
        <KPICard label="Breadth"  value={`${Math.round(themeData.breadth)}%`} color={themeData.breadth >= 60 ? '#00e676' : themeData.breadth >= 40 ? '#ffa726' : '#ff1744'} themeUI={themeUI} />
      </div>

      {/* Constituents table */}
      <div className="overflow-hidden rounded-lg border border-[var(--c-border)]">
        <table className="w-full">
          <thead>
            <tr className={`text-[9px] font-mono uppercase tracking-widest ${themeUI.textMuted}`}>
              <th className="px-4 py-12 text-left">Ticker</th>
              <th className="px-4 py-12 text-right">Prezzo</th>
              <th className="px-4 py-12 text-right">1D %</th>
              <th className="px-4 py-12 text-right">1W %</th>
              <th className="px-4 py-12 text-right">1M %</th>
              <th className="px-4 py-12 text-right">3M %</th>
            </tr>
          </thead>
          <tbody>
            {[...themeData.stocks].sort((a, b) => b.r1m - a.r1m).map(s => (
              <tr key={s.sym} className="border-t border-[var(--c-border)]">
                <td className="px-4 py-12 font-mono font-bold text-sm" style={{ color: theme.color }}>{s.sym}</td>
                <td className={`px-4 py-12 text-right font-mono text-sm ${themeUI.textBold}`}>${s.last.toFixed(2)}</td>
                <td className="px-4 py-12 text-right font-mono text-xs font-bold" style={{ color: s.r1d >= 0 ? '#00e676' : '#ff1744' }}>
                  {s.r1d >= 0 ? '+' : ''}{s.r1d.toFixed(2)}%
                </td>
                <td className="px-4 py-12 text-right font-mono text-xs font-bold" style={{ color: s.r1w >= 0 ? '#00e676' : '#ff1744' }}>
                  {s.r1w >= 0 ? '+' : ''}{s.r1w.toFixed(2)}%
                </td>
                <td className="px-4 py-12 text-right font-mono text-xs font-bold" style={{ color: s.r1m >= 0 ? '#00e676' : '#ff1744' }}>
                  {s.r1m >= 0 ? '+' : ''}{s.r1m.toFixed(2)}%
                </td>
                <td className="px-4 py-12 text-right font-mono text-xs font-bold" style={{ color: s.r3m >= 0 ? '#00e676' : '#ff1744' }}>
                  {s.r3m >= 0 ? '+' : ''}{s.r3m.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

const KPICard = ({ label, value, color, themeUI }) => (
  <div className={`${themeUI.card} border ${themeUI.borderLight} rounded p-3`}>
    <div className={`text-[9px] font-mono uppercase tracking-widest ${themeUI.textMuted}`}>{label}</div>
    <div className="font-mono font-black text-lg" style={{ color }}>{value}</div>
  </div>
);

// =====================================================================
// Main Page
// =====================================================================
export default function MarketThemes({ isDark, theme }) {
  const [data, setData] = useState({}); // { themeId: themeData }
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const loadTheme = useCallback(async (themeDef) => {
    const constituentData = {};
    const results = await Promise.allSettled(themeDef.constituents.map(fetchTickerHistory));
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        constituentData[themeDef.constituents[i]] = r.value;
      }
    });
    return computeThemeMetrics(constituentData);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setData({});
    setProgress({ done: 0, total: THEMES.length });
    let done = 0;
    for (const t of THEMES) {
      const result = await loadTheme(t);
      done++;
      setProgress({ done, total: THEMES.length });
      setData(prev => ({ ...prev, [t.id]: result }));
    }
    setLoading(false);
  }, [loadTheme]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Selected theme's data (live, in case user clicks while still loading)
  const selectedData = useMemo(() => selectedTheme ? data[selectedTheme.id] : null, [data, selectedTheme]);

  // Sort themes by score (loaded ones first)
  const sortedThemes = useMemo(() => {
    return [...THEMES].sort((a, b) => {
      const da = data[a.id]?.score, db = data[b.id]?.score;
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return db - da;
    });
  }, [data]);

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl md:text-4xl font-black font-mono uppercase tracking-tight ${theme.textBold}`}>
            Market <span className="text-[#ff8c00] glow-orange">Themes</span>
          </h1>
          <p className={`mt-10 text-sm font-mono ${theme.textMuted}`}>
            Overview di {THEMES.length} temi di investimento · Score aggregato dai costituenti · Breadth + momentum 1M/3M
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className={`p-2.5 rounded border ${theme.navBtnBg} ${theme.navText} ${theme.navHover} transition-all disabled:opacity-50`}
          title="Ricarica tutti i temi"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading progress */}
      {loading && progress.total > 0 && (
        <div className={`${theme.panel} border ${theme.border} rounded-lg p-4 glow-panel`}>
          <div className="flex items-center justify-between mb-10">
            <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
              Caricamento temi · {progress.done}/{progress.total}
            </span>
            <span className="text-[10px] font-mono text-[#ff8c00]">
              {Math.round((progress.done / progress.total) * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
            <motion.div
              animate={{ width: `${(progress.done / progress.total) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-[#ff8c00] to-[#ffa726]"
            />
          </div>
        </div>
      )}

      {/* Detail panel (if selected) */}
      {selectedTheme && (
        <ThemeDetail
          theme={selectedTheme}
          themeData={selectedData}
          onClose={() => setSelectedTheme(null)}
          themeUI={theme}
        />
      )}

      {/* Themes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedThemes.map(t => (
          <ThemeCard
            key={t.id}
            theme={t}
            themeData={data[t.id]}
            onSelect={setSelectedTheme}
            isDark={isDark}
            themeUI={theme}
          />
        ))}
      </div>

      {/* Methodology footer */}
      <div className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel`}>
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#ff8c00] font-bold mb-12 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" /> Metodologia
        </h4>
        <ul className={`space-y-10 text-xs font-mono ${theme.textMuted} leading-relaxed`}>
          <li>· <span className={theme.textBold}>SniperScore tema</span> = 50 + (ritorno medio 1M × 1.2) + (ritorno medio 3M × 0.5) + (breadth − 50%) × 30, clampato 0-100.</li>
          <li>· <span className={theme.textBold}>Breadth</span> = % di costituenti con ritorno 1M positivo. Misura l&apos;ampiezza del trend.</li>
          <li>· <span className={theme.textBold}>Sparkline</span> = indice equal-weighted normalizzato a 100 sui 3 mesi precedenti.</li>
          <li>· <span className={theme.textBold}>Top 3</span> = costituenti con miglior ritorno 1M (badge verde se positivo, rosso se negativo).</li>
          <li>· Dati live da Yahoo Finance via proxy CORS · refresh manuale dal pulsante in alto a destra.</li>
        </ul>
      </div>
    </div>
  );
}
