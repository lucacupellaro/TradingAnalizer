import { useState, useEffect, useCallback } from 'react';

// CORS proxy chain — same pattern used elsewhere in the app
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

const fetchHistory = async (symbol, range = '2y') => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
    const json = await fetchJson(url);
    const r = json.chart?.result?.[0];
    if (!r) return null;
    const ts = r.timestamp || [];
    const closes = (r.indicators.quote[0].close || []);
    const out = [];
    for (let i = 0; i < ts.length; i++) {
      if (closes[i] != null) out.push({ date: new Date(ts[i] * 1000), v: closes[i] });
    }
    return out.length ? out : null;
  } catch { return null; }
};

// =====================================================================
// Indicator config — extendable: add row to extend the dashboard
// =====================================================================
// thresholds: very-low | low | medium | high | very-high — values BETWEEN these define regime
//   e.g. VIX thresholds [12, 16, 22, 30]:
//     <12 = very-low, 12-16 = low, 16-22 = medium, 22-30 = high, >30 = very-high
// higherIsRiskier: if true, higher value = higher stress score
// weight: composite score weight (sum should ≈ 1.0)
// alert: optional { critical: number, message: string }
export const INDICATORS_CONFIG = [
  // ---------- Equity Volatility ----------
  { id: 'vix', sym: '^VIX', name: 'VIX', cat: 'equity', subCat: 'Implied Vol Equity',
    desc: 'Volatilità implicita attesa S&P 500 (30 giorni).',
    weight: 0.18, higherIsRiskier: true,
    thresholds: [12, 16, 22, 30],
    alert: { critical: 30, message: 'VIX > 30: volatilità equity in regime alto.' } },
  { id: 'vvix', sym: '^VVIX', name: 'VVIX', cat: 'equity', subCat: 'Vol of Vol',
    desc: 'Volatilità del VIX. Anticipa cambi di regime di volatilità.',
    weight: 0.07, higherIsRiskier: true,
    thresholds: [80, 95, 110, 130],
    alert: { critical: 130, message: 'VVIX > 130: aspettative di brusco cambio di regime di volatilità.' } },
  { id: 'rv30', synthetic: 'realized', source: '^GSPC', window: 30, name: 'Realized Vol 30d',
    cat: 'equity', subCat: 'Realized Vol',
    desc: 'Volatilità realizzata annualizzata S&P 500 ultimi 30 giorni.',
    weight: 0.07, higherIsRiskier: true,
    thresholds: [8, 12, 18, 25],
    alert: { critical: 25, message: 'Realized vol > 25%: turbolenza effettiva sui prezzi.' } },
  { id: 'iv-rv', synthetic: 'spread', source: ['vix', 'rv30'], name: 'IV - RV Spread',
    cat: 'equity', subCat: 'Vol Risk Premium',
    desc: 'Premio volatilità: VIX − vol realizzata 30d. Spread negativo = stress.',
    weight: 0.05, higherIsRiskier: false,
    thresholds: [-3, 0, 2, 5], // lower = more stress
    alert: { critical: -3, message: 'IV-RV spread negativo: realizzata supera implicita, mercato preso di sorpresa.' } },

  // ---------- Bond Volatility ----------
  { id: 'move', sym: '^MOVE', name: 'MOVE Index', cat: 'bond', subCat: 'Implied Vol Bond',
    desc: 'Volatilità implicita opzioni Treasury (1-mese, 2-30Y blend).',
    weight: 0.15, higherIsRiskier: true,
    thresholds: [70, 90, 120, 150],
    alert: { critical: 150, message: 'MOVE > 150: stress sul mercato obbligazionario USA.' } },
  { id: 'curve', synthetic: 'spread', source: ['^TNX', '^IRX'], name: 'Yield Curve 10Y-3M',
    cat: 'bond', subCat: 'Term Structure',
    desc: 'Spread 10Y - 13W. Inversione → segnale di recessione.',
    weight: 0.05, higherIsRiskier: false,
    thresholds: [-1, 0, 1, 2.5],
    alert: { critical: 0, message: 'Yield curve invertita: storicamente precede recessioni.' } },

  // ---------- Credit Risk ----------
  { id: 'hy-spread', synthetic: 'ratioInv', source: ['HYG', 'IEF'], name: 'HY Credit Stress',
    cat: 'credit', subCat: 'High Yield Spread Proxy',
    desc: 'Proxy stress credito HY: ratio HYG/IEF invertito (sotto-performance HY = stress).',
    weight: 0.08, higherIsRiskier: true,
    thresholds: null, // computed dynamically from history
    alert: { critical: null, message: 'High yield spread ai massimi 12 mesi.' } },
  { id: 'ig-spread', synthetic: 'ratioInv', source: ['LQD', 'IEF'], name: 'IG Credit Stress',
    cat: 'credit', subCat: 'Investment Grade Spread Proxy',
    desc: 'Proxy stress IG: ratio LQD/IEF invertito.',
    weight: 0.04, higherIsRiskier: true,
    thresholds: null,
    alert: { critical: null, message: 'Spread investment grade in allargamento.' } },

  // ---------- Cross-Asset / Correlation ----------
  { id: 'corr', synthetic: 'corr',
    source: ['XLK', 'XLF', 'XLE', 'XLY', 'XLP', 'XLV', 'XLI', 'XLU', 'XLB', 'XLRE', 'XLC'],
    window: 60, name: 'Cross-Sector Correlation',
    cat: 'cross', subCat: 'Diversification Regime',
    desc: 'Correlazione media a coppie tra settori USA (60d). Alta = diversificazione ridotta.',
    weight: 0.08, higherIsRiskier: true,
    thresholds: [0.30, 0.50, 0.65, 0.80],
    alert: { critical: 0.75, message: 'Correlazione media > 0.75: diversificazione fallita, panic regime.' } },

  // ---------- FX ----------
  { id: 'dxy', sym: 'DX-Y.NYB', sourceFallback: ['UUP'], name: 'Dollar Index',
    cat: 'cross', subCat: 'USD Strength',
    desc: 'Forza relativa USD vs basket valute. Spike = risk-off / fuga verso safe haven.',
    weight: 0.04, higherIsRiskier: true,
    thresholds: null,
    alert: { critical: null, message: 'DXY ai massimi 12 mesi: condizioni finanziarie restrittive globali.' } },

  // ---------- Funding / Liquidity Stress ----------
  { id: 'funding', synthetic: 'realized', source: 'BIL', window: 30,
    name: 'Funding Stress Proxy',
    cat: 'funding', subCat: 'Short-end Vol',
    desc: 'Vol realizzata BIL (T-Bill ETF): proxy disordine sul mercato monetario.',
    weight: 0.05, higherIsRiskier: true,
    thresholds: [0.3, 0.6, 1.0, 1.5],
    alert: { critical: 1.0, message: 'Vol short-end elevata: stress sul money market.' } },

  // ---------- Commodity Volatility ----------
  { id: 'ovx', sym: '^OVX', name: 'OVX (Oil Vol)', cat: 'commodity', subCat: 'Oil Implied Vol',
    desc: 'Volatilità implicita opzioni petrolio.',
    weight: 0.07, higherIsRiskier: true,
    thresholds: [25, 35, 50, 65],
    alert: { critical: 65, message: 'OVX > 65: shock energetico in atto.' } },
  { id: 'gvz', sym: '^GVZ', name: 'GVZ (Gold Vol)', cat: 'commodity', subCat: 'Gold Implied Vol',
    desc: 'Volatilità implicita oro. Spike spesso accompagna fasi di stress macro.',
    weight: 0.07, higherIsRiskier: true,
    thresholds: [12, 16, 22, 30],
    alert: { critical: 30, message: 'GVZ > 30: stress macro intenso, fuga verso safe haven.' } },
];

// =====================================================================
// Math helpers
// =====================================================================

const realizedVol = (history, window) => {
  if (!history || history.length < window + 1) return null;
  const closes = history.slice(-window - 1).map(d => d.v);
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    rets.push(Math.log(closes[i] / closes[i - 1]));
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
};

// Rolling realized volatility series (annualized %) over the entire history
const rollingRealizedVolSeries = (history, window) => {
  if (!history || history.length < window + 2) return null;
  const series = [];
  for (let i = window; i < history.length; i++) {
    const slice = history.slice(i - window, i + 1).map(d => d.v);
    const rets = [];
    for (let j = 1; j < slice.length; j++) rets.push(Math.log(slice[j] / slice[j - 1]));
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
    series.push({ date: history[i].date, v: Math.sqrt(variance) * Math.sqrt(252) * 100 });
  }
  return series;
};

const pearson = (a, b) => {
  const n = Math.min(a.length, b.length);
  if (n < 2) return null;
  const ma = a.slice(-n).reduce((x, y) => x + y, 0) / n;
  const mb = b.slice(-n).reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const ax = a[a.length - n + i] - ma;
    const bx = b[b.length - n + i] - mb;
    num += ax * bx; da += ax * ax; db += bx * bx;
  }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : null;
};

const seriesReturns = (history) => {
  const r = [];
  for (let i = 1; i < history.length; i++) {
    r.push((history[i].v - history[i - 1].v) / history[i - 1].v);
  }
  return r;
};

// Rolling avg pairwise correlation series across multiple symbols
const rollingAvgCorrSeries = (rawHistories, window) => {
  // rawHistories: { sym: [{date, v}, ...] }
  const symbols = Object.keys(rawHistories);
  // Align by intersection of dates (use min length)
  const minLen = Math.min(...symbols.map(s => rawHistories[s].length));
  if (minLen < window + 5) return null;
  const truncated = {};
  symbols.forEach(s => { truncated[s] = rawHistories[s].slice(-minLen); });

  // Returns
  const rets = {};
  symbols.forEach(s => { rets[s] = seriesReturns(truncated[s]); });

  const out = [];
  for (let t = window; t < minLen - 1; t++) {
    const corrs = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const a = rets[symbols[i]].slice(t - window, t);
        const b = rets[symbols[j]].slice(t - window, t);
        const c = pearson(a, b);
        if (c != null && !isNaN(c)) corrs.push(c);
      }
    }
    if (corrs.length) {
      out.push({ date: truncated[symbols[0]][t].date, v: corrs.reduce((a, b) => a + b, 0) / corrs.length });
    }
  }
  return out.length ? out : null;
};

// Synthetic series: a/b inverted (so HIGHER = MORE stress)
const ratioInverseSeries = (a, b) => {
  if (!a || !b) return null;
  const n = Math.min(a.length, b.length);
  const out = [];
  for (let i = 0; i < n; i++) {
    const idxA = a.length - n + i, idxB = b.length - n + i;
    if (a[idxA].v > 0 && b[idxB].v > 0) {
      // We invert so spikes = stress
      out.push({ date: a[idxA].date, v: b[idxB].v / a[idxA].v });
    }
  }
  return out.length ? out : null;
};

const subtractSeries = (a, b) => {
  if (!a || !b) return null;
  const n = Math.min(a.length, b.length);
  const out = [];
  for (let i = 0; i < n; i++) {
    const idxA = a.length - n + i, idxB = b.length - n + i;
    out.push({ date: a[idxA].date, v: a[idxA].v - b[idxB].v });
  }
  return out;
};

// =====================================================================
// Score / regime classification per indicator
// =====================================================================

const percentileRank = (value, sortedHist) => {
  if (!sortedHist || sortedHist.length === 0) return 50;
  // Number of points below value / total
  let count = 0;
  for (const v of sortedHist) {
    if (v <= value) count++;
    else break;
  }
  return (count / sortedHist.length) * 100;
};

const zScoreCalc = (value, hist) => {
  if (!hist || hist.length < 5) return 0;
  const mean = hist.reduce((a, b) => a + b, 0) / hist.length;
  const sd = Math.sqrt(hist.reduce((a, b) => a + (b - mean) ** 2, 0) / hist.length);
  return sd > 0 ? (value - mean) / sd : 0;
};

// Returns { score:0-100, regime:'very-low'|'low'|'medium'|'high'|'very-high', percentile, zScore, change1d, change5d, change20d }
const computeIndicatorMetrics = (cfg, series) => {
  if (!series || series.length < 30) return null;
  const values = series.map(s => s.v);
  const last = values[values.length - 1];
  const ago = (n) => values.length > n ? values[values.length - 1 - n] : null;
  const ch1 = ago(1) != null ? last - ago(1) : null;
  const ch5 = ago(5) != null ? last - ago(5) : null;
  const ch20 = ago(20) != null ? last - ago(20) : null;
  const pct1 = ago(1) != null && ago(1) !== 0 ? ((last - ago(1)) / Math.abs(ago(1))) * 100 : null;
  const pct5 = ago(5) != null && ago(5) !== 0 ? ((last - ago(5)) / Math.abs(ago(5))) * 100 : null;
  const pct20 = ago(20) != null && ago(20) !== 0 ? ((last - ago(20)) / Math.abs(ago(20))) * 100 : null;

  // Build sorted history for percentile (exclude last 5 to avoid bias)
  const histForPct = values.slice(0, -1).slice().sort((a, b) => a - b);
  const percentile = percentileRank(last, histForPct);
  const zScore = zScoreCalc(last, values.slice(0, -1));

  // Score 0-100 — depends on direction of risk
  let score;
  if (cfg.higherIsRiskier) {
    score = percentile;
  } else {
    score = 100 - percentile;
  }
  score = Math.max(0, Math.min(100, score));

  // Regime classification
  let regime;
  if (cfg.thresholds && cfg.thresholds.length === 4) {
    // Apply direction
    const v = last;
    const t = cfg.thresholds;
    if (cfg.higherIsRiskier) {
      if (v < t[0])      regime = 'very-low';
      else if (v < t[1]) regime = 'low';
      else if (v < t[2]) regime = 'medium';
      else if (v < t[3]) regime = 'high';
      else               regime = 'very-high';
    } else {
      // Lower value = higher stress
      if (v > t[3])      regime = 'very-low';
      else if (v > t[2]) regime = 'low';
      else if (v > t[1]) regime = 'medium';
      else if (v > t[0]) regime = 'high';
      else               regime = 'very-high';
    }
  } else {
    // No fixed thresholds → derive from score buckets
    if (score < 20)      regime = 'very-low';
    else if (score < 40) regime = 'low';
    else if (score < 60) regime = 'medium';
    else if (score < 80) regime = 'high';
    else                 regime = 'very-high';
  }

  // Alert logic
  let alertActive = false, alertMessage = null, alertSeverity = null;
  if (cfg.alert) {
    if (cfg.alert.critical != null) {
      const triggered = cfg.higherIsRiskier ? last > cfg.alert.critical : last < cfg.alert.critical;
      if (triggered) {
        alertActive = true;
        alertMessage = cfg.alert.message;
        alertSeverity = score >= 80 ? 'critical' : score >= 60 ? 'high' : 'medium';
      }
    } else {
      // Trigger on percentile >= 90
      if (percentile >= 90 && cfg.higherIsRiskier) {
        alertActive = true;
        alertMessage = cfg.alert.message;
        alertSeverity = percentile >= 95 ? 'critical' : 'high';
      }
      if (percentile <= 10 && !cfg.higherIsRiskier) {
        alertActive = true;
        alertMessage = cfg.alert.message;
        alertSeverity = percentile <= 5 ? 'critical' : 'high';
      }
    }
  }

  return {
    last, ch1, ch5, ch20, pct1, pct5, pct20,
    percentile, zScore, score, regime,
    alertActive, alertMessage, alertSeverity,
    series, // pass through for sparkline / mini chart
    contribution: score * cfg.weight,
  };
};

// =====================================================================
// Hook
// =====================================================================

export const useVolatilityRegime = () => {
  const [data, setData] = useState({});      // { id: metrics }
  const [composite, setComposite] = useState(null); // { score, regime, drivers, change1w }
  const [historicalScore, setHistoricalScore] = useState(null);  // [{date, v}]
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errors, setErrors] = useState([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrors([]);

    // Collect all needed raw symbols
    const rawSymbols = new Set();
    for (const cfg of INDICATORS_CONFIG) {
      if (cfg.sym) rawSymbols.add(cfg.sym);
      if (cfg.sourceFallback) cfg.sourceFallback.forEach(s => rawSymbols.add(s));
      if (cfg.synthetic && Array.isArray(cfg.source)) {
        cfg.source.forEach(s => rawSymbols.add(s));
      } else if (cfg.synthetic && typeof cfg.source === 'string') {
        rawSymbols.add(cfg.source);
      }
    }

    // Parallel fetch
    const symbols = Array.from(rawSymbols);
    const fetched = {};
    const fetchErrors = [];
    const results = await Promise.allSettled(symbols.map(s => fetchHistory(s, '2y')));
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) fetched[symbols[i]] = r.value;
      else fetchErrors.push(symbols[i]);
    });

    // Try fallbacks
    for (const cfg of INDICATORS_CONFIG) {
      if (cfg.sym && !fetched[cfg.sym] && cfg.sourceFallback) {
        for (const fb of cfg.sourceFallback) {
          if (fetched[fb]) {
            fetched[cfg.sym] = fetched[fb]; // alias
            break;
          }
        }
      }
    }

    // Build metrics
    const metrics = {};

    for (const cfg of INDICATORS_CONFIG) {
      let series = null;

      if (cfg.synthetic === 'realized') {
        const src = fetched[cfg.source];
        if (src) series = rollingRealizedVolSeries(src, cfg.window || 30);
      } else if (cfg.synthetic === 'spread') {
        // sources can be ids of other indicators (string starting with non-^) or raw symbols
        // For 'iv-rv' spread we need vix series - rv30 series. Special case:
        if (cfg.id === 'iv-rv') {
          const vixSeries = fetched['^VIX'];
          const rvSeries = rollingRealizedVolSeries(fetched['^GSPC'], 30);
          series = subtractSeries(vixSeries, rvSeries);
        } else {
          const a = fetched[cfg.source[0]];
          const b = fetched[cfg.source[1]];
          series = subtractSeries(a, b);
        }
      } else if (cfg.synthetic === 'ratioInv') {
        const a = fetched[cfg.source[0]];
        const b = fetched[cfg.source[1]];
        series = ratioInverseSeries(a, b);
      } else if (cfg.synthetic === 'corr') {
        const histories = {};
        cfg.source.forEach(s => { if (fetched[s]) histories[s] = fetched[s]; });
        if (Object.keys(histories).length >= 4) {
          series = rollingAvgCorrSeries(histories, cfg.window || 60);
        }
      } else if (cfg.sym) {
        series = fetched[cfg.sym];
      }

      const m = computeIndicatorMetrics(cfg, series);
      if (m) metrics[cfg.id] = m;
    }

    // ---------- Composite score ----------
    let compScore = 0, totalWeight = 0;
    const drivers = [];
    INDICATORS_CONFIG.forEach(cfg => {
      const m = metrics[cfg.id];
      if (m) {
        compScore += m.score * cfg.weight;
        totalWeight += cfg.weight;
        drivers.push({ id: cfg.id, name: cfg.name, contribution: m.score * cfg.weight, score: m.score, regime: m.regime });
      }
    });
    const finalScore = totalWeight > 0 ? compScore / totalWeight : 50;
    drivers.sort((a, b) => b.contribution - a.contribution);

    let regime, regimeColor, regimeDesc;
    if (finalScore < 20)      { regime = 'VOLATILITÀ MOLTO BASSA'; regimeColor = '#00e676'; regimeDesc = 'Mercato calmo, condizioni finanziarie distese, pricing del rischio compresso.'; }
    else if (finalScore < 40) { regime = 'VOLATILITÀ BASSA';       regimeColor = '#66bb6a'; regimeDesc = 'Regime risk-on con vol contenuta. Premio per il rischio basso, possibile compiacenza.'; }
    else if (finalScore < 60) { regime = 'VOLATILITÀ MEDIA';       regimeColor = '#ffd740'; regimeDesc = 'Condizioni neutrali. Allocazione bilanciata, attenzione a divergenze tra vol equity e bond.'; }
    else if (finalScore < 80) { regime = 'VOLATILITÀ ALTA';        regimeColor = '#ff8c00'; regimeDesc = 'Regime di stress. Risk-off in formazione, ridurre leva e cyclical exposure.'; }
    else                       { regime = 'STRESS SISTEMICO';       regimeColor = '#ff1744'; regimeDesc = 'Stress sistemico. Drawdown probabile, fuga verso cash/Treasury, correlazioni vicine a 1.'; }

    // ---------- Historical composite score series ----------
    // Use 60-day window of all indicators that have series of equal length
    let histScore = null;
    try {
      const seriesByCfg = {};
      INDICATORS_CONFIG.forEach(cfg => {
        const m = metrics[cfg.id];
        if (m && m.series) seriesByCfg[cfg.id] = m.series;
      });
      const ids = Object.keys(seriesByCfg);
      if (ids.length >= 5) {
        const minLen = Math.min(...ids.map(id => seriesByCfg[id].length));
        if (minLen >= 60) {
          const hist = [];
          // For each historical timestep, compute score using percentile rank within EACH indicator's full hist
          // To save compute, sample every 5 days
          for (let t = Math.max(0, minLen - 250); t < minLen; t += 5) {
            let s = 0, w = 0;
            INDICATORS_CONFIG.forEach(cfg => {
              const ser = seriesByCfg[cfg.id];
              if (!ser) return;
              const offset = ser.length - minLen;
              const idx = t + offset;
              if (idx < 0 || idx >= ser.length) return;
              const valueAtT = ser[idx].v;
              const histUpToT = ser.slice(0, idx).map(x => x.v).sort((a, b) => a - b);
              if (histUpToT.length < 20) return;
              const pct = percentileRank(valueAtT, histUpToT);
              const sc = cfg.higherIsRiskier ? pct : 100 - pct;
              s += sc * cfg.weight;
              w += cfg.weight;
            });
            if (w > 0) hist.push({ date: seriesByCfg[ids[0]][t + (seriesByCfg[ids[0]].length - minLen)].date, v: s / w });
          }
          histScore = hist;
        }
      }
    } catch { /* historical score is optional */ }

    // 1-week change of composite score
    const change1w = histScore && histScore.length >= 2
      ? finalScore - histScore[histScore.length - 1].v
      : null;

    setData(metrics);
    setComposite({ score: finalScore, regime, regimeColor, regimeDesc, drivers, change1w });
    setHistoricalScore(histScore);
    setErrors(fetchErrors);
    setLastUpdated(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  return { data, composite, historicalScore, isLoading, lastUpdated, errors, reload: load };
};
