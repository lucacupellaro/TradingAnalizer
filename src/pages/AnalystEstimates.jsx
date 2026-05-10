import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, RefreshCw, Search, ArrowUp, ArrowDown, Minus, ExternalLink, AlertCircle, Building2, Briefcase } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BANK_FORECASTS, MACRO_CATEGORIES } from '../config/bankForecasts';

// =====================================================================
// Curated universe — focused on stocks with strong analyst coverage
// =====================================================================
const ANALYST_UNIVERSE = [
  // Mega-cap Tech
  { sym: 'AAPL',  name: 'Apple',                sector: 'Tecnologia' },
  { sym: 'MSFT',  name: 'Microsoft',            sector: 'Tecnologia' },
  { sym: 'NVDA',  name: 'NVIDIA',               sector: 'Tecnologia' },
  { sym: 'GOOGL', name: 'Alphabet',             sector: 'Tecnologia' },
  { sym: 'META',  name: 'Meta Platforms',       sector: 'Tecnologia' },
  { sym: 'AMZN',  name: 'Amazon',               sector: 'Discrezionali' },
  { sym: 'TSLA',  name: 'Tesla',                sector: 'Discrezionali' },
  { sym: 'AVGO',  name: 'Broadcom',             sector: 'Tecnologia' },
  { sym: 'AMD',   name: 'AMD',                  sector: 'Tecnologia' },
  { sym: 'ORCL',  name: 'Oracle',               sector: 'Tecnologia' },
  { sym: 'CRM',   name: 'Salesforce',           sector: 'Tecnologia' },
  { sym: 'NFLX',  name: 'Netflix',              sector: 'Comunicazione' },
  { sym: 'ADBE',  name: 'Adobe',                sector: 'Tecnologia' },
  // Financials
  { sym: 'JPM',   name: 'JPMorgan',             sector: 'Finanziari' },
  { sym: 'BAC',   name: 'Bank of America',      sector: 'Finanziari' },
  { sym: 'GS',    name: 'Goldman Sachs',        sector: 'Finanziari' },
  { sym: 'MS',    name: 'Morgan Stanley',       sector: 'Finanziari' },
  { sym: 'WFC',   name: 'Wells Fargo',          sector: 'Finanziari' },
  { sym: 'BRK-B', name: 'Berkshire Hathaway',   sector: 'Finanziari' },
  { sym: 'V',     name: 'Visa',                 sector: 'Finanziari' },
  { sym: 'MA',    name: 'Mastercard',           sector: 'Finanziari' },
  // Healthcare
  { sym: 'LLY',   name: 'Eli Lilly',            sector: 'Sanità' },
  { sym: 'JNJ',   name: 'Johnson & Johnson',    sector: 'Sanità' },
  { sym: 'UNH',   name: 'UnitedHealth',         sector: 'Sanità' },
  { sym: 'MRK',   name: 'Merck',                sector: 'Sanità' },
  { sym: 'PFE',   name: 'Pfizer',               sector: 'Sanità' },
  { sym: 'ABBV',  name: 'AbbVie',               sector: 'Sanità' },
  // Energy
  { sym: 'XOM',   name: 'Exxon Mobil',          sector: 'Energia' },
  { sym: 'CVX',   name: 'Chevron',              sector: 'Energia' },
  { sym: 'COP',   name: 'ConocoPhillips',       sector: 'Energia' },
  // Industrials
  { sym: 'CAT',   name: 'Caterpillar',          sector: 'Industriali' },
  { sym: 'BA',    name: 'Boeing',               sector: 'Industriali' },
  { sym: 'GE',    name: 'General Electric',     sector: 'Industriali' },
  // Discretionary / Staples
  { sym: 'HD',    name: 'Home Depot',           sector: 'Discrezionali' },
  { sym: 'WMT',   name: 'Walmart',              sector: 'Staples' },
  { sym: 'COST',  name: 'Costco',               sector: 'Staples' },
  { sym: 'KO',    name: 'Coca-Cola',            sector: 'Staples' },
  { sym: 'PEP',   name: 'PepsiCo',              sector: 'Staples' },
  { sym: 'MCD',   name: "McDonald's",           sector: 'Discrezionali' },
  { sym: 'NKE',   name: 'Nike',                 sector: 'Discrezionali' },
];

// =====================================================================
// Fetching utilities (CORS proxy chain)
// =====================================================================
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

// Lightweight: v7/quote for consensus (works through proxies)
const fetchQuote = async (symbol) => {
  const candidates = [
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
  ];
  for (const url of candidates) {
    try {
      const json = await fetchJson(url);
      const r = json?.quoteResponse?.result?.[0];
      if (!r) continue;
      let recMean = null, recKey = null;
      if (typeof r.averageAnalystRating === 'string') {
        const m = r.averageAnalystRating.match(/^([\d.]+)\s*-?\s*(.+)?/);
        if (m) { recMean = parseFloat(m[1]); recKey = (m[2] || '').toLowerCase().trim(); }
      }
      return {
        sym: symbol,
        price: r.regularMarketPrice ?? null,
        targetMean: r.targetMeanPrice ?? null,
        targetHigh: r.targetHighPrice ?? null,
        targetLow:  r.targetLowPrice ?? null,
        recMean, recKey,
        numAnalysts: r.numberOfAnalystOpinions ?? null,
        marketCap: r.marketCap ?? null,
        currency: r.currency ?? 'USD',
      };
    } catch { continue; }
  }
  return null;
};

// Heavy: v10/quoteSummary for upgradeDowngradeHistory + recommendationTrend
const fetchAnalystDetail = async (symbol) => {
  const modules = 'upgradeDowngradeHistory,recommendationTrend,financialData,price';
  const candidates = [
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`,
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`,
  ];
  for (const url of candidates) {
    try {
      const json = await fetchJson(url);
      const r = json?.quoteSummary?.result?.[0];
      if (!r) continue;
      const get = (o, k) => o?.[k]?.raw != null ? o[k].raw : (typeof o?.[k] === 'number' ? o[k] : null);
      const fd = r.financialData || {};
      const price = r.price || {};
      const upgrades = (r.upgradeDowngradeHistory?.history || []).map(u => ({
        firm: u.firm,
        toGrade: u.toGrade,
        fromGrade: u.fromGrade,
        action: u.action, // 'up', 'down', 'init', 'main', 'reit'
        date: u.epochGradeDate ? new Date(u.epochGradeDate * 1000) : null,
      })).sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
      // recommendationTrend gives last 4 months breakdown
      const trend = (r.recommendationTrend?.trend || []).map(t => ({
        period: t.period,
        strongBuy: t.strongBuy ?? 0,
        buy: t.buy ?? 0,
        hold: t.hold ?? 0,
        sell: t.sell ?? 0,
        strongSell: t.strongSell ?? 0,
      }));
      return {
        targetMean: get(fd, 'targetMeanPrice'),
        targetHigh: get(fd, 'targetHighPrice'),
        targetLow:  get(fd, 'targetLowPrice'),
        recMean: get(fd, 'recommendationMean'),
        recKey: fd.recommendationKey,
        numAnalysts: get(fd, 'numberOfAnalystOpinions'),
        upgrades,
        trend,
        currency: price.currency ?? 'USD',
      };
    } catch { continue; }
  }
  return null;
};

// =====================================================================
// Helpers
// =====================================================================
const fmtUSD = (v, dec = 2) => v == null || isNaN(v) ? '—' : `$${Number(v).toFixed(dec)}`;
const fmtPct = (v, dec = 1) => v == null || isNaN(v) ? '—' : (v >= 0 ? '+' : '') + Number(v).toFixed(dec) + '%';

// recMean (1-5) → label + color
function ratingFromMean(mean) {
  if (mean == null) return { label: 'N/D', color: '#555555' };
  if (mean < 1.7) return { label: 'STRONG BUY', color: '#00e676' };
  if (mean < 2.4) return { label: 'BUY',        color: '#66bb6a' };
  if (mean < 3.4) return { label: 'HOLD',       color: '#ffa726' };
  if (mean < 4.4) return { label: 'SELL',       color: '#ef5350' };
  return                  { label: 'STRONG SELL', color: '#ff1744' };
}

function actionIcon(action) {
  switch (action) {
    case 'up':   return { icon: ArrowUp,   color: '#00e676', label: 'Upgrade' };
    case 'down': return { icon: ArrowDown, color: '#ff1744', label: 'Downgrade' };
    case 'init': return { icon: ExternalLink, color: '#64b5f6', label: 'Initiation' };
    case 'main': return { icon: Minus,     color: '#a0a0a0', label: 'Maintain' };
    case 'reit': return { icon: Minus,     color: '#a0a0a0', label: 'Reiterate' };
    default:     return { icon: Minus,     color: '#a0a0a0', label: action || 'Update' };
  }
}

// Heatmap color for upside %
function upsideColor(upside) {
  if (upside == null) return '#555';
  if (upside >= 25) return '#00e676';
  if (upside >= 10) return '#66bb6a';
  if (upside >= 0)  return '#ffd740';
  if (upside >= -10) return '#ff8c00';
  return '#ff1744';
}

// =====================================================================
// Recommendation distribution bar (5 segments: SB / B / H / S / SS)
// =====================================================================
function RatingBar({ trend, theme }) {
  if (!trend || trend.length === 0) return null;
  const last = trend[0]; // most recent month
  const total = last.strongBuy + last.buy + last.hold + last.sell + last.strongSell;
  if (total === 0) return null;
  const segs = [
    { label: 'SB', val: last.strongBuy,  c: '#00e676' },
    { label: 'B',  val: last.buy,        c: '#66bb6a' },
    { label: 'H',  val: last.hold,       c: '#ffa726' },
    { label: 'S',  val: last.sell,       c: '#ef5350' },
    { label: 'SS', val: last.strongSell, c: '#ff1744' },
  ];
  return (
    <div className="w-full">
      <div className="relative h-3 rounded overflow-hidden flex">
        {segs.map(s => s.val > 0 && (
          <div key={s.label} style={{ width: `${(s.val / total) * 100}%`, background: s.c }}
            title={`${s.label}: ${s.val}/${total}`} />
        ))}
      </div>
      <div className={`flex justify-between mt-1 text-[8px] font-mono ${theme.textMuted}`}>
        {segs.map(s => (
          <span key={s.label} style={{ color: s.val > 0 ? s.c : '#444' }}>{s.label} {s.val}</span>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// Detail panel for a selected stock
// =====================================================================
function AnalystDetail({ stock, quote, detail, loading, onClose, theme }) {
  if (!stock) return null;

  const upside = quote?.targetMean && quote?.price ? ((quote.targetMean - quote.price) / quote.price) * 100 : null;
  const rating = ratingFromMean(quote?.recMean ?? detail?.recMean);

  // Build target range visualization
  // X axis: low → high target with markers for current and mean
  const range = quote?.targetHigh != null && quote?.targetLow != null && quote?.price != null
    ? { min: Math.min(quote.targetLow, quote.price) * 0.95,
        max: Math.max(quote.targetHigh, quote.price) * 1.05 }
    : null;

  // Recommendation trend chart (last 4 months)
  const trendChart = (detail?.trend || []).slice().reverse().map(t => ({
    period: t.period,
    'Strong Buy': t.strongBuy,
    'Buy': t.buy,
    'Hold': t.hold,
    'Sell': t.sell,
    'Strong Sell': t.strongSell,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${theme.panel} border ${theme.border} rounded-lg p-6 glow-panel mb-6`}
      style={{ borderColor: `${rating.color}55` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl font-black font-mono text-[#ff8c00]">{stock.sym}</span>
            <span className={`text-sm ${theme.textBold}`}>{stock.name}</span>
            <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>{stock.sector}</span>
          </div>
          {quote?.price && (
            <div className="mt-1 flex items-baseline gap-3">
              <span className={`text-3xl font-black font-mono ${theme.textBold}`}>{fmtUSD(quote.price)}</span>
              <span className="font-mono text-xs font-bold uppercase tracking-widest"
                style={{ color: rating.color, background: `${rating.color}15`, border: `1px solid ${rating.color}55`, padding: '4px 10px', borderRadius: '4px' }}>
                {rating.label}
              </span>
              {quote.numAnalysts && (
                <span className={`text-xs font-mono ${theme.textMuted}`}>· {quote.numAnalysts} analisti</span>
              )}
            </div>
          )}
        </div>
        <button onClick={onClose}
          className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted} hover:text-[#ff8c00] transition-colors`}>
          Chiudi ✕
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KPI label="Target Medio"   value={fmtUSD(quote?.targetMean ?? detail?.targetMean)} color="#ff8c00" theme={theme} />
        <KPI label="Target Massimo" value={fmtUSD(quote?.targetHigh ?? detail?.targetHigh)} color="#00e676" theme={theme} />
        <KPI label="Target Minimo"  value={fmtUSD(quote?.targetLow  ?? detail?.targetLow )} color="#ef5350" theme={theme} />
        <KPI label="Upside"         value={fmtPct(upside)} color={upsideColor(upside)} theme={theme} />
        <KPI label="Consensus"      value={`${(quote?.recMean ?? detail?.recMean ?? 0).toFixed(2)}/5`} color={rating.color} theme={theme} />
      </div>

      {/* Target Range visualization */}
      {range && quote.targetHigh && quote.targetLow && quote.targetMean && (
        <div className={`${theme.panel} border ${theme.borderLight} rounded p-4 mb-6`}>
          <h4 className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted} mb-3`}>
            Range Target Analisti vs Prezzo Attuale
          </h4>
          <div className="relative h-12">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r from-[#ef5350] via-[#ffd740] to-[#00e676]" />
            {[
              { v: quote.targetLow,  c: '#ef5350', label: 'LOW',  pos: 'top' },
              { v: quote.targetMean, c: '#ff8c00', label: 'MEAN', pos: 'top' },
              { v: quote.targetHigh, c: '#00e676', label: 'HIGH', pos: 'top' },
              { v: quote.price,      c: '#ffffff', label: 'NOW',  pos: 'bottom' },
            ].map(p => {
              const pct = ((p.v - range.min) / (range.max - range.min)) * 100;
              return (
                <div key={p.label} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${pct}%` }}>
                  <div className={`w-3 h-3 rounded-full ring-2 ring-black`} style={{ background: p.c }} />
                  <div className={`absolute left-1/2 -translate-x-1/2 ${p.pos === 'top' ? '-top-7' : 'top-5'} text-center whitespace-nowrap`}>
                    <div className="text-[8px] font-mono uppercase tracking-widest" style={{ color: p.c }}>{p.label}</div>
                    <div className="text-[10px] font-mono font-bold" style={{ color: p.c }}>{fmtUSD(p.v)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Distribution bar + trend chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {detail?.trend && detail.trend.length > 0 && (
          <div className={`${theme.panel} border ${theme.borderLight} rounded p-4`}>
            <h4 className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted} mb-3`}>
              Breakdown Rating Corrente
            </h4>
            <RatingBar trend={detail.trend} theme={theme} />
            <p className={`mt-3 text-[11px] font-mono ${theme.textMuted}`}>
              Su {(detail.trend[0].strongBuy + detail.trend[0].buy + detail.trend[0].hold + detail.trend[0].sell + detail.trend[0].strongSell)} analisti
              {' '}coperti dalla testata: <span className="text-[#00e676] font-bold">{detail.trend[0].strongBuy + detail.trend[0].buy} buy</span>
              {' / '}<span className="text-[#ffa726] font-bold">{detail.trend[0].hold} hold</span>
              {' / '}<span className="text-[#ff1744] font-bold">{detail.trend[0].sell + detail.trend[0].strongSell} sell</span>.
            </p>
          </div>
        )}

        {trendChart.length > 0 && (
          <div className={`${theme.panel} border ${theme.borderLight} rounded p-4`}>
            <h4 className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted} mb-3`}>
              Evoluzione Rating (4 mesi)
            </h4>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChart} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
                  <XAxis dataKey="period" tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} />
                  <YAxis tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} />
                  <Tooltip
                    contentStyle={{ backgroundColor: theme.chart.tooltipBg, border: `1px solid ${theme.chart.tooltipBorder}`, fontSize: 11 }}
                    itemStyle={{ color: theme.chart.tooltipText }}
                    labelStyle={{ color: theme.chart.tooltipText }}
                  />
                  <Bar dataKey="Strong Buy"   stackId="a" fill="#00e676" />
                  <Bar dataKey="Buy"          stackId="a" fill="#66bb6a" />
                  <Bar dataKey="Hold"         stackId="a" fill="#ffa726" />
                  <Bar dataKey="Sell"         stackId="a" fill="#ef5350" />
                  <Bar dataKey="Strong Sell"  stackId="a" fill="#ff1744" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent upgrades/downgrades from individual banks */}
      <div className={`${theme.panel} border ${theme.borderLight} rounded overflow-hidden`}>
        <div className="px-4 py-3 border-b border-[var(--c-border)] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#ff8c00]" />
          <h4 className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#ff8c00]">
            Revisioni Recenti delle Banche
          </h4>
          {loading && <RefreshCw className="w-3 h-3 animate-spin text-[#ff8c00] ml-2" />}
        </div>
        {(!detail || detail.upgrades.length === 0) ? (
          <p className={`px-4 py-6 text-xs font-mono italic ${theme.textMuted} text-center`}>
            {loading ? 'Caricamento delle revisioni bank-by-bank...' : 'Nessuna revisione recente disponibile (Yahoo upgradeDowngradeHistory).'}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Banca</th>
                <th className="px-4 py-2 text-left">Azione</th>
                <th className="px-4 py-2 text-left">Da</th>
                <th className="px-4 py-2 text-left">A</th>
              </tr>
            </thead>
            <tbody>
              {detail.upgrades.slice(0, 25).map((u, i) => {
                const ai = actionIcon(u.action);
                const ActionIcon = ai.icon;
                return (
                  <tr key={i} className={`border-t ${theme.borderLight}`}>
                    <td className={`px-4 py-2 font-mono text-[10px] ${theme.textMuted}`}>
                      {u.date ? u.date.toLocaleDateString('it-IT') : '—'}
                    </td>
                    <td className={`px-4 py-2 font-mono text-xs font-bold ${theme.textBold}`}>{u.firm || '—'}</td>
                    <td className="px-4 py-2 font-mono text-[10px]">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-bold uppercase"
                        style={{ background: `${ai.color}15`, color: ai.color, border: `1px solid ${ai.color}55` }}>
                        <ActionIcon className="w-3 h-3" />
                        {ai.label}
                      </span>
                    </td>
                    <td className={`px-4 py-2 font-mono text-[11px] ${theme.textMuted}`}>{u.fromGrade || '—'}</td>
                    <td className={`px-4 py-2 font-mono text-[11px] ${theme.textBold}`}>{u.toGrade || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className={`mt-4 text-[10px] font-mono italic ${theme.textMuted} flex items-start gap-2`}>
        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span>
          I price target individuali per banca (es. "JP Morgan: $250") richiedono accesso a feed istituzionali (Bloomberg, FactSet).
          Yahoo Finance fornisce solo l&apos;aggregato consensus + storico delle revisioni con grade. Le card sopra mostrano <span className={theme.textBold}>dati ufficiali aggregati</span>.
        </span>
      </p>
    </motion.div>
  );
}

const KPI = ({ label, value, color, theme }) => (
  <div className={`${theme.card} border ${theme.borderLight} rounded p-3`}>
    <div className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>{label}</div>
    <div className="font-mono font-black text-lg" style={{ color }}>{value}</div>
  </div>
);

// =====================================================================
// Main page
// =====================================================================
export default function AnalystEstimates({ isDark, theme }) {
  const [activeTab, setActiveTab] = useState('stocks');
  const [quotes, setQuotes] = useState({});      // { sym: quote }
  const [macroPrices, setMacroPrices] = useState({}); // { sym: currentPrice } for macro assets
  const [selected, setSelected] = useState(null);
  const [selectedMacro, setSelectedMacro] = useState(null); // sym of macro asset
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('upside');
  const [sortDir, setSortDir] = useState('desc');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Batch-fetch quotes for stocks
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setQuotes({});
    setProgress({ done: 0, total: ANALYST_UNIVERSE.length });
    const chunkSize = 6;
    for (let i = 0; i < ANALYST_UNIVERSE.length; i += chunkSize) {
      const chunk = ANALYST_UNIVERSE.slice(i, i + chunkSize);
      const results = await Promise.allSettled(chunk.map(s => fetchQuote(s.sym)));
      const updates = {};
      results.forEach((r, j) => {
        if (r.status === 'fulfilled' && r.value) updates[chunk[j].sym] = r.value;
      });
      setQuotes(prev => ({ ...prev, ...updates }));
      setProgress(prev => ({ ...prev, done: Math.min(prev.total, prev.done + chunk.length) }));
    }
    setIsLoading(false);
  }, []);

  // Fetch current prices for all macro assets that have forecasts
  const loadMacroPrices = useCallback(async () => {
    const macroSymbols = Object.keys(BANK_FORECASTS);
    const updates = {};
    const results = await Promise.allSettled(macroSymbols.map(s => fetchQuote(s)));
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value?.price != null) updates[macroSymbols[i]] = r.value.price;
    });
    setMacroPrices(updates);
  }, []);

  useEffect(() => {
    loadAll();
    loadMacroPrices();
  }, [loadAll, loadMacroPrices]);

  // Fetch detail when a stock is selected
  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setDetailLoading(true);
    setDetail(null);
    fetchAnalystDetail(selected.sym).then(d => {
      setDetail(d);
    }).finally(() => setDetailLoading(false));
  }, [selected]);

  // Build display rows with computed upside
  const rows = useMemo(() => {
    return ANALYST_UNIVERSE.map(s => {
      const q = quotes[s.sym];
      if (!q) return { ...s, q: null, upside: null };
      const upside = q.targetMean && q.price ? ((q.targetMean - q.price) / q.price) * 100 : null;
      return { ...s, q, upside };
    });
  }, [quotes]);

  // Filter + sort
  const visible = useMemo(() => {
    const q = search.trim().toUpperCase();
    let r = rows.filter(row => {
      if (!q) return true;
      return row.sym.includes(q) || row.name.toUpperCase().includes(q) || row.sector.toUpperCase().includes(q);
    });
    r.sort((a, b) => {
      const va = sortKey === 'sym' ? a.sym
              : sortKey === 'name' ? a.name
              : sortKey === 'sector' ? a.sector
              : sortKey === 'price' ? (a.q?.price ?? -Infinity)
              : sortKey === 'target' ? (a.q?.targetMean ?? -Infinity)
              : sortKey === 'analysts' ? (a.q?.numAnalysts ?? -Infinity)
              : sortKey === 'recMean' ? (a.q?.recMean ?? Infinity) // lower = better, so reverse
              :                          (a.upside ?? -Infinity);
      const vb = sortKey === 'sym' ? b.sym
              : sortKey === 'name' ? b.name
              : sortKey === 'sector' ? b.sector
              : sortKey === 'price' ? (b.q?.price ?? -Infinity)
              : sortKey === 'target' ? (b.q?.targetMean ?? -Infinity)
              : sortKey === 'analysts' ? (b.q?.numAnalysts ?? -Infinity)
              : sortKey === 'recMean' ? (b.q?.recMean ?? Infinity)
              :                          (b.upside ?? -Infinity);
      let cmp = va < vb ? -1 : va > vb ? 1 : 0;
      // recMean: lower is "better" → flip
      if (sortKey === 'recMean') cmp = -cmp;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [rows, search, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'recMean' ? 'asc' : 'desc'); }
  };

  // Compute portfolio-level metrics
  const portfolio = useMemo(() => {
    const valid = rows.filter(r => r.q && r.upside != null);
    if (valid.length === 0) return null;
    const avgUpside = valid.reduce((s, r) => s + r.upside, 0) / valid.length;
    const positiveCount = valid.filter(r => r.upside > 0).length;
    const top3 = [...valid].sort((a, b) => b.upside - a.upside).slice(0, 3);
    const bot3 = [...valid].sort((a, b) => a.upside - b.upside).slice(0, 3);
    return { avgUpside, positiveCount, total: valid.length, top3, bot3 };
  }, [rows]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl md:text-4xl font-black font-mono uppercase tracking-tight ${theme.textBold}`}>
            Analyst <span className="text-[#ff8c00] glow-orange">Estimates</span>
          </h1>
          <p className={`mt-2 text-sm font-mono ${theme.textMuted}`}>
            Consensus aggregato · Target prices · Bank-by-bank · Azioni + Indici + Commodity + Bond + Forex + Crypto
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              placeholder="Cerca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`pl-9 pr-3 py-2 rounded text-xs font-mono border ${theme.border} bg-[#000000] text-[#e0e0e0] placeholder:text-[#555] focus:border-[#ff8c00]/50 focus:outline-none w-56`}
            />
          </div>
          <button onClick={() => { loadAll(); loadMacroPrices(); }} disabled={isLoading}
            className={`p-2.5 rounded border ${theme.navBtnBg} ${theme.navText} ${theme.navHover} transition-all disabled:opacity-50`}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'stocks', label: 'Azioni', icon: Users },
          ...Object.entries(MACRO_CATEGORIES).map(([id, c]) => ({ id, label: c.label, icon: Briefcase })),
        ].map(t => {
          const TabIcon = t.icon;
          const active = activeTab === t.id;
          const count = t.id === 'stocks' ? ANALYST_UNIVERSE.length : MACRO_CATEGORIES[t.id]?.members.length || 0;
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSelected(null); setSelectedMacro(null); setSearch(''); }}
              className={`px-3 py-2 rounded text-[11px] font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
                active
                  ? 'bg-[#ff8c00]/15 text-[#ff8c00] border-[#ff8c00]/40'
                  : `${theme.card} ${theme.textMuted} border-[var(--c-border)] hover:text-[#e0e0e0] hover:border-[#ff8c00]/20`
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {t.label} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Loading progress */}
      {isLoading && (
        <div className={`${theme.panel} border ${theme.border} rounded-lg p-4 glow-panel`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
              Caricamento consensus · {progress.done}/{progress.total}
            </span>
            <span className="text-[10px] font-mono text-[#ff8c00]">{Math.round((progress.done / Math.max(1, progress.total)) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
            <motion.div animate={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
              transition={{ duration: 0.3 }} className="h-full bg-gradient-to-r from-[#ff8c00] to-[#ffa726]" />
          </div>
        </div>
      )}

      {/* Portfolio-level summary (only for stocks tab) */}
      {portfolio && activeTab === 'stocks' && (
        <div className={`${theme.panel} border ${theme.border} rounded-lg p-5 glow-panel`}>
          <h3 className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#ff8c00] mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Sintesi Universo Coperto
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Upside Medio"        value={fmtPct(portfolio.avgUpside)}                 color={upsideColor(portfolio.avgUpside)} theme={theme} />
            <KPI label="Con Upside Positivo" value={`${portfolio.positiveCount}/${portfolio.total}`} color="#66bb6a"                          theme={theme} />
            <div className={`${theme.card} border ${theme.borderLight} rounded p-3`}>
              <div className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>Top Upside</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {portfolio.top3.map(t => (
                  <span key={t.sym} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{ background: '#00e67615', color: '#00e676', border: '1px solid #00e67640' }}>
                    {t.sym} {fmtPct(t.upside, 0)}
                  </span>
                ))}
              </div>
            </div>
            <div className={`${theme.card} border ${theme.borderLight} rounded p-3`}>
              <div className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>Top Downside</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {portfolio.bot3.map(t => (
                  <span key={t.sym} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{ background: '#ff174415', color: '#ff1744', border: '1px solid #ff174440' }}>
                    {t.sym} {fmtPct(t.upside, 0)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============== STOCKS TAB ============== */}
      {activeTab === 'stocks' && (
        <>
          {/* Detail panel (if a stock is selected) */}
          {selected && (
            <AnalystDetail
              stock={selected}
              quote={quotes[selected.sym]}
              detail={detail}
              loading={detailLoading}
              onClose={() => setSelected(null)}
              theme={theme}
            />
          )}

          {/* Main table */}
          <div className={`${theme.panel} border ${theme.border} rounded-lg overflow-hidden glow-panel`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
                    <Th label="Asset"        sortKey="sym"      curr={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
                    <Th label="Settore"      sortKey="sector"   curr={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
                    <Th label="Prezzo"       sortKey="price"    curr={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                    <Th label="Target Medio" sortKey="target"   curr={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                    <Th label="Range Target" sortKey=""         curr={sortKey} dir={sortDir} align="right" disabled />
                    <Th label="Upside"       sortKey="upside"   curr={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                    <Th label="# Analisti"   sortKey="analysts" curr={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                    <Th label="Rating"       sortKey="recMean"  curr={sortKey} dir={sortDir} onClick={toggleSort} align="center" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map(row => {
                    const q = row.q;
                    const r = ratingFromMean(q?.recMean);
                    const active = selected?.sym === row.sym;
                    return (
                      <tr key={row.sym} onClick={() => setSelected(row)}
                        className={`border-t ${theme.borderLight} cursor-pointer transition-colors ${active ? 'bg-[#ff8c00]/10' : theme.cardHover}`}>
                        <td className="px-4 py-3 font-mono">
                          <div className="flex flex-col">
                            <span className={`font-bold ${theme.textBold}`}>{row.sym}</span>
                            <span className={`text-[10px] ${theme.textMuted}`}>{row.name}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-[10px] font-mono ${theme.textMuted}`}>{row.sector}</td>
                        <td className={`px-4 py-3 text-right font-mono text-sm ${theme.textBold}`}>{fmtUSD(q?.price)}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-bold text-[#ff8c00]">{fmtUSD(q?.targetMean)}</td>
                        <td className="px-4 py-3 text-right">
                          {q?.targetLow && q?.targetHigh ? (
                            <div className="inline-flex flex-col items-end">
                              <span className={`text-[10px] font-mono ${theme.textMuted}`}>
                                <span className="text-[#ef5350]">{fmtUSD(q.targetLow, 0)}</span>
                                {' – '}
                                <span className="text-[#00e676]">{fmtUSD(q.targetHigh, 0)}</span>
                              </span>
                            </div>
                          ) : <span className="text-[10px] text-[#555] font-mono">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.upside != null ? (
                            <span className="inline-block px-2 py-1 rounded font-mono text-xs font-bold"
                              style={{ background: `${upsideColor(row.upside)}15`, color: upsideColor(row.upside), border: `1px solid ${upsideColor(row.upside)}40` }}>
                              {fmtPct(row.upside)}
                            </span>
                          ) : <span className="text-[10px] text-[#555] font-mono">—</span>}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono text-xs ${theme.textBold}`}>{q?.numAnalysts ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase tracking-widest"
                            style={{ background: r.color, color: '#000' }}>
                            {r.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {visible.length === 0 && (
                    <tr><td colSpan={8} className={`px-4 py-12 text-center text-xs font-mono ${theme.textMuted}`}>
                      Nessun risultato per "{search}"
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============== MACRO TABS (Indici / Commodity / Bond / Forex / Crypto) ============== */}
      {activeTab !== 'stocks' && MACRO_CATEGORIES[activeTab] && (
        <>
          {/* Detail panel for selected macro asset */}
          {selectedMacro && (
            <MacroForecastDetail
              symbol={selectedMacro}
              currentPrice={macroPrices[selectedMacro]}
              onClose={() => setSelectedMacro(null)}
              theme={theme}
            />
          )}

          {/* Macro consensus table */}
          <div className={`${theme.panel} border ${theme.border} rounded-lg overflow-hidden glow-panel`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
                    <th className="px-4 py-3 text-left">Asset</th>
                    <th className="px-4 py-3 text-left">Horizon</th>
                    <th className="px-4 py-3 text-right">Prezzo Spot</th>
                    <th className="px-4 py-3 text-right">Consensus Medio</th>
                    <th className="px-4 py-3 text-right">Range</th>
                    <th className="px-4 py-3 text-right">Upside</th>
                    <th className="px-4 py-3 text-right">Top Bull</th>
                    <th className="px-4 py-3 text-right">Top Bear</th>
                    <th className="px-4 py-3 text-right">#Banche</th>
                  </tr>
                </thead>
                <tbody>
                  {MACRO_CATEGORIES[activeTab].members
                    .filter(s => {
                      const q = search.trim().toUpperCase();
                      if (!q) return true;
                      const fc = BANK_FORECASTS[s];
                      return s.includes(q) || (fc && fc.name.toUpperCase().includes(q));
                    })
                    .map(sym => {
                      const fc = BANK_FORECASTS[sym];
                      if (!fc) return null;
                      const targets = fc.forecasts.map(f => f.target).filter(t => t != null);
                      const meanT = targets.length ? targets.reduce((a, b) => a + b, 0) / targets.length : null;
                      const minT = targets.length ? Math.min(...targets) : null;
                      const maxT = targets.length ? Math.max(...targets) : null;
                      const spot = macroPrices[sym];
                      const upside = meanT != null && spot ? ((meanT - spot) / spot) * 100 : null;
                      const topBull = [...fc.forecasts].sort((a, b) => b.target - a.target)[0];
                      const topBear = [...fc.forecasts].sort((a, b) => a.target - b.target)[0];
                      const fmt = (v) => v == null ? '—' : Number(v).toFixed(v < 10 ? 4 : 2);
                      const active = selectedMacro === sym;
                      return (
                        <tr key={sym} onClick={() => setSelectedMacro(sym)}
                          className={`border-t ${theme.borderLight} cursor-pointer transition-colors ${active ? 'bg-[#ff8c00]/10' : theme.cardHover}`}>
                          <td className="px-4 py-3 font-mono">
                            <div className="flex flex-col">
                              <span className={`font-bold ${theme.textBold}`}>{fc.name}</span>
                              <span className={`text-[10px] ${theme.textMuted}`}>{sym} · {fc.unit}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-[10px] font-mono ${theme.textMuted}`}>{fc.horizon}</td>
                          <td className={`px-4 py-3 text-right font-mono text-sm ${theme.textBold}`}>{fmt(spot)}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-bold text-[#ff8c00]">{fmt(meanT)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[10px] font-mono">
                              <span className="text-[#ef5350]">{fmt(minT)}</span>
                              {' – '}
                              <span className="text-[#00e676]">{fmt(maxT)}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {upside != null ? (
                              <span className="inline-block px-2 py-1 rounded font-mono text-xs font-bold"
                                style={{ background: `${upsideColor(upside)}15`, color: upsideColor(upside), border: `1px solid ${upsideColor(upside)}40` }}>
                                {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
                              </span>
                            ) : <span className="text-[10px] text-[#555] font-mono">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-[#00e676] font-bold">{topBull.bank}</span>
                              <span className={`text-[10px] ${theme.textMuted}`}>{fmt(topBull.target)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-[#ff1744] font-bold">{topBear.bank}</span>
                              <span className={`text-[10px] ${theme.textMuted}`}>{fmt(topBear.target)}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-right font-mono text-xs ${theme.textBold}`}>{fc.forecasts.length}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Methodology */}
      <div className={`${theme.panel} border ${theme.border} rounded-lg p-5 glow-panel`}>
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#ff8c00] font-bold mb-3 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> Note Metodologiche
        </h4>
        <ul className={`space-y-2 text-xs font-mono ${theme.textMuted} leading-relaxed`}>
          <li>· <span className={theme.textBold}>Target Medio / High / Low</span>: aggregato del consensus di tutti gli analisti coperti, da Yahoo Finance v7/quote.</li>
          <li>· <span className={theme.textBold}>Upside</span> = (Target Medio − Prezzo Attuale) / Prezzo Attuale × 100.</li>
          <li>· <span className={theme.textBold}>Rating</span>: convertito da `averageAnalystRating` (1.0 = Strong Buy, 5.0 = Strong Sell).</li>
          <li>· <span className={theme.textBold}>Revisioni bank-by-bank</span> (nel detail panel): Yahoo `upgradeDowngradeHistory` — storico azioni con grade FROM/TO. Disponibile per la maggior parte delle azioni USA con coverage istituzionale.</li>
          <li>· I <span className={theme.textBold}>price target individuali per banca</span> (es. "JP Morgan: $7000") richiedono accesso a feed istituzionali (Bloomberg, FactSet, Refinitiv) e non sono esposti dalle API pubbliche di Yahoo.</li>
        </ul>
      </div>
    </div>
  );
}

// =====================================================================
// Macro asset detail panel — bank-by-bank forecasts table
// =====================================================================
function MacroForecastDetail({ symbol, currentPrice, onClose, theme }) {
  const fc = BANK_FORECASTS[symbol];
  if (!fc) return null;

  const targets = fc.forecasts.map(f => f.target).filter(t => t != null);
  const meanTarget = targets.length ? targets.reduce((a, b) => a + b, 0) / targets.length : null;
  const minTarget = targets.length ? Math.min(...targets) : null;
  const maxTarget = targets.length ? Math.max(...targets) : null;
  const upside = meanTarget != null && currentPrice ? ((meanTarget - currentPrice) / currentPrice) * 100 : null;

  const ratingColor = (rating) => {
    if (!rating) return '#a0a0a0';
    const r = rating.toLowerCase();
    if (r.includes('bullish') || r.includes('eur bullish') || r.includes('jpy bullish') || r.includes('chf bullish') || r.includes('gbp bullish')) return '#00e676';
    if (r.includes('bearish') || r.includes('usd bullish')) return '#ff1744';
    return '#ffa726';
  };

  // Build distribution chart data (banks as x, targets as y)
  const sorted = [...fc.forecasts].sort((a, b) => b.target - a.target);
  const chartData = sorted.map(f => ({ bank: f.bank.slice(0, 12), target: f.target, color: ratingColor(f.rating) }));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${theme.panel} border ${theme.border} rounded-lg p-6 glow-panel mb-6`}
      style={{ borderColor: '#ff8c0055' }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl font-black font-mono text-[#ff8c00]">{fc.name}</span>
            <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
              {symbol} · Horizon: {fc.horizon}
            </span>
          </div>
          {currentPrice != null && (
            <div className="mt-1 flex items-baseline gap-3">
              <span className={`text-3xl font-black font-mono ${theme.textBold}`}>
                {fc.unit === 'punti' || symbol.startsWith('^') ? Number(currentPrice).toFixed(2) : `${currentPrice < 10 ? currentPrice.toFixed(4) : currentPrice.toFixed(2)}`}
                {fc.unit && fc.unit !== 'punti' && <span className={`text-sm ${theme.textMuted} ml-2`}>{fc.unit}</span>}
              </span>
              {upside != null && (
                <span className="font-mono text-sm font-bold uppercase tracking-widest"
                  style={{
                    color: upside >= 0 ? '#00e676' : '#ff1744',
                    background: upside >= 0 ? '#00e67615' : '#ff174415',
                    border: `1px solid ${upside >= 0 ? '#00e676' : '#ff1744'}55`,
                    padding: '4px 10px', borderRadius: '4px',
                  }}>
                  {upside >= 0 ? '+' : ''}{upside.toFixed(1)}% vs Consensus
                </span>
              )}
            </div>
          )}
        </div>
        <button onClick={onClose}
          className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted} hover:text-[#ff8c00] transition-colors`}>
          Chiudi ✕
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Consensus Medio" value={meanTarget != null ? meanTarget.toFixed(2) : '—'} color="#ff8c00" theme={theme} />
        <KPI label="Target Massimo"  value={maxTarget != null ? maxTarget.toFixed(2) : '—'}  color="#00e676" theme={theme} />
        <KPI label="Target Minimo"   value={minTarget != null ? minTarget.toFixed(2) : '—'}  color="#ef5350" theme={theme} />
        <KPI label="# Banche"        value={fc.forecasts.length}                              color="#64b5f6" theme={theme} />
      </div>

      {/* Distribution chart: bank-by-bank targets */}
      <div className={`${theme.panel} border ${theme.borderLight} rounded p-4 mb-6`}>
        <h4 className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted} mb-3`}>
          Distribuzione Target per Banca · {fc.unit || 'unit'}
        </h4>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
              <XAxis dataKey="bank" tick={{ fontSize: 10, fill: theme.chart.tooltipText }}
                stroke={theme.chart.axis} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: theme.chart.tooltipBg, border: `1px solid ${theme.chart.tooltipBorder}`, fontSize: 11 }}
                itemStyle={{ color: theme.chart.tooltipText }}
                labelStyle={{ color: theme.chart.tooltipText }}
                formatter={(v) => [Number(v).toFixed(2), 'Target']}
              />
              {currentPrice != null && (
                <ReferenceLine y={currentPrice} stroke="#ffffff" strokeDasharray="4 4" strokeOpacity={0.7}
                  label={{ value: `Prezzo Attuale ${Number(currentPrice).toFixed(2)}`, fill: '#ffffff', fontSize: 10, position: 'right' }} />
              )}
              {meanTarget != null && (
                <ReferenceLine y={meanTarget} stroke="#ff8c00" strokeDasharray="2 2" strokeOpacity={0.8}
                  label={{ value: `Mean ${meanTarget.toFixed(2)}`, fill: '#ff8c00', fontSize: 10, position: 'left' }} />
              )}
              <Bar dataKey="target" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {chartData.map((entry, i) => (
                  <rect key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bank-by-bank table */}
      <div className={`${theme.panel} border ${theme.borderLight} rounded overflow-hidden mb-4`}>
        <div className="px-4 py-3 border-b border-[var(--c-border)] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#ff8c00]" />
          <h4 className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#ff8c00]">
            Forecast Bank-by-Bank · {fc.horizon}
          </h4>
        </div>
        <table className="w-full">
          <thead>
            <tr className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
              <th className="px-4 py-2 text-left">Banca</th>
              <th className="px-4 py-2 text-right">Target</th>
              <th className="px-4 py-2 text-right">vs Spot</th>
              <th className="px-4 py-2 text-center">Outlook</th>
              <th className="px-4 py-2 text-left">Note</th>
              <th className="px-4 py-2 text-right">Data</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => {
              const c = ratingColor(f.rating);
              const upsideF = currentPrice ? ((f.target - currentPrice) / currentPrice) * 100 : null;
              return (
                <tr key={i} className={`border-t ${theme.borderLight}`}>
                  <td className={`px-4 py-2 font-mono text-xs font-bold ${theme.textBold}`}>{f.bank}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-black" style={{ color: c }}>
                    {f.target.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs font-bold"
                    style={{ color: upsideF != null ? (upsideF >= 0 ? '#00e676' : '#ff1744') : '#555' }}>
                    {upsideF != null ? `${upsideF >= 0 ? '+' : ''}${upsideF.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {f.rating && (
                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest"
                        style={{ background: `${c}15`, color: c, border: `1px solid ${c}55` }}>
                        {f.rating}
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-2 font-mono text-[11px] ${theme.textMuted}`}>{f.note || '—'}</td>
                  <td className={`px-4 py-2 text-right font-mono text-[10px] ${theme.textMuted}`}>
                    {f.date ? new Date(f.date).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={`text-[10px] font-mono italic ${theme.textMuted} flex items-start gap-2`}>
        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span>
          Forecast curate manualmente da pubblicazioni ufficiali delle banche (research notes, comunicati stampa).
          Le date indicano quando il target è stato pubblicato. Per dati operativi serve un feed istituzionale aggiornato.
        </span>
      </p>
    </motion.div>
  );
}

const Th = ({ label, sortKey, curr, dir, onClick, align = 'left', disabled = false }) => (
  <th className={`px-4 py-3 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${disabled ? '' : 'cursor-pointer hover:text-[#ff8c00]'} transition-colors select-none`}
    onClick={disabled ? undefined : () => onClick(sortKey)}>
    {label}
    {!disabled && curr === sortKey && <span className="ml-1 text-[#ff8c00]">{dir === 'asc' ? '↑' : '↓'}</span>}
  </th>
);
