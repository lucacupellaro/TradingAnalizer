import React, { useState, useMemo, useEffect, useRef } from 'react';
import MonteCarloWorker from './workers/monteCarlo.worker.js?worker';
import { getTheme } from './config/themes';
import {
  useAuth,
  useFileUpload,
  useAnalysis,
  useMarketData
} from './hooks';
import {
  KPICard,
  FilterBadge,
  EquityChart,
  DrawdownChart,
  DistributionChart,
  CullenFreyPlot,
  DayStatsCharts,
  CorrelationHeatmap,
  Navbar,
  Sidebar,
  MarketTicker,
  LoginModal,
  AnalysisLoader
} from './components';
import { marqueeStyle } from './styles/marquee';
import {
  skewnessAndKurtosis,
  jarqueBeraTest,
  adTest,
  calcBetaCorr,
  calculateDayStats,
  getAvgTimeStr
} from './utils';
import { Info, Globe, TableIcon, ChevronUp, ChevronDown, Grid, Shuffle, Clock, Upload, Trophy, Award } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, Cell, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts'; // eslint-disable-line
import ChiSono from './pages/ChiSono';
import ComeFunziona from './pages/ComeFunziona';
import MarketRegime from './pages/MarketRegime';
import MarketThemes from './pages/MarketThemes';
import VolatilityRegime from './pages/VolatilityRegime';
import AnalystEstimates from './pages/AnalystEstimates';
import TradingAccounts from './pages/TradingAccounts';
import Researcher from './pages/Researcher';
import Landing from './pages/Landing';

// Tooltip Monte Carlo: mostra SOLO la linea attualmente hover-ata (non tutte le 50)
const MonteCarloTooltip = ({ active, payload, label, theme, hoveredKey }) => {
  if (!active || !payload || !payload.length) return null;

  const targetKey = hoveredKey || 'average';
  const hovered = payload.find(p => p && p.dataKey === targetKey);
  if (!hovered || hovered.value == null) return null;

  const isAverage = hovered.dataKey === 'average';
  const niceName = isAverage ? 'MEDIA (Valore Atteso)' : `Run #${String(hovered.dataKey).replace('run', '')}`;

  return (
    <div
      style={{
        backgroundColor: theme.chart.tooltipBg,
        color: theme.chart.tooltipText,
        border: `1px solid ${theme.chart.tooltipBorder}`,
        padding: '8px 10px',
        fontSize: 11,
        fontFamily: 'monospace',
      }}
    >
      <div style={{ opacity: 0.6, fontSize: 10, marginBottom: 4 }}>Trade #{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          backgroundColor: hovered.color || hovered.stroke,
          borderRadius: 2,
        }} />
        <span style={{ fontWeight: 'bold' }}>{niceName}</span>
        <span style={{ marginLeft: 12, fontWeight: 'bold' }}>
          {Number(hovered.value).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

// Descrizione affiancata ai grafici
const ChartDescription = ({ theme, title, text }) => (
  <div className={`${theme.panel} border ${theme.borderLight} rounded-lg p-5 flex flex-col justify-center glow-panel`}>
    <h4 className="text-[#ff8c00] font-mono font-bold text-xs uppercase tracking-widest mb-3">{title}</h4>
    <p className={`${theme.textMuted} text-sm leading-relaxed font-mono`}>{text}</p>
  </div>
);

// Grafici PnL settimanale e mensile affiancati
const PnLBarCharts = ({ weeklyPnL, monthlyPnL, theme }) => {
  const [mode, setMode] = useState('eur'); // 'eur' | 'pct'
  const [showSpx, setShowSpx] = useState(false);

  if ((!weeklyPnL || weeklyPnL.length === 0) && (!monthlyPnL || monthlyPnL.length === 0)) return null;

  const barKey = mode === 'eur' ? 'pnl' : 'pnlPct';
  const fmtVal = (v) => mode === 'eur' ? `€${Number(v).toFixed(2)}` : `${Number(v).toFixed(2)}%`;
  const btnBase = 'px-4 py-2 rounded text-xs font-bold uppercase tracking-wide transition-all border font-mono';

  const renderChart = (data, labelKey, title) => (
    <div className={`${theme.panel} border ${theme.borderLight} rounded-lg p-4 glow-panel`}>
      <h3 className="text-center font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 mb-3 text-[#ff8c00] font-mono">
        {title}
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
            <XAxis
              dataKey={labelKey}
              tick={{ fontSize: 8, fill: theme.chart.tooltipText }}
              stroke={theme.chart.axis}
              interval={data.length > 20 ? Math.floor(data.length / 15) : 0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} />
            <YAxis yAxisId="right" orientation="right" tick={showSpx ? { fontSize: 9, fill: '#64b5f6' } : false} stroke={showSpx ? '#64b5f6' : 'transparent'} tickFormatter={(v) => `${v.toFixed(1)}%`} width={showSpx ? 50 : 5} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.chart.tooltipBg,
                color: theme.chart.tooltipText,
                border: `1px solid ${theme.chart.tooltipBorder}`,
                fontSize: 11,
              }}
              itemStyle={{ color: theme.chart.tooltipText }}
              labelStyle={{ color: theme.chart.tooltipText }}
              formatter={(val, name) => {
                if (name === 'SP500') return [`${Number(val).toFixed(2)}%`, 'SP500'];
                return [fmtVal(val), mode === 'eur' ? 'PnL' : 'PnL %'];
              }}
            />
            <ReferenceLine y={0} yAxisId="left" stroke={theme.chart.axis} strokeDasharray="3 3" />
            <Bar yAxisId="left" dataKey={barKey} radius={[3, 3, 0, 0]} isAnimationActive={false} name={mode === 'eur' ? 'PnL' : 'PnL %'}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry[barKey] >= 0 ? '#00e676' : '#ff1744'} fillOpacity={0.8} />
              ))}
            </Bar>
            {showSpx && (
              <Bar yAxisId="right" dataKey="spxPct" fill="#64b5f6" fillOpacity={0.85} radius={[3, 3, 0, 0]} isAnimationActive={false} name="SP500" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="mb-14">
      <div className="flex justify-end gap-2 mb-3">
        <div className="flex gap-1 bg-black/40 rounded-lg p-1 border border-[var(--c-border)]">
          <button
            onClick={() => setMode('eur')}
            className={`${btnBase} ${mode === 'eur' ? 'bg-[#ff8c00] text-black border-[#ff8c00]' : `${theme.textMuted} border-transparent`}`}
          >€</button>
          <button
            onClick={() => setMode('pct')}
            className={`${btnBase} ${mode === 'pct' ? 'bg-[#ff8c00] text-black border-[#ff8c00]' : `${theme.textMuted} border-transparent`}`}
          >%</button>
        </div>
        <button
          onClick={() => setShowSpx(v => !v)}
          className={`${btnBase} ${showSpx ? 'bg-[#64b5f6]/20 text-[#64b5f6] border-[#64b5f6]/40' : `${theme.textMuted} border-transparent bg-black/40`}`}
        >
          {showSpx ? '✓ SP500' : 'SP500'}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {weeklyPnL && weeklyPnL.length > 0 && renderChart(weeklyPnL, 'week', 'PROFITTO SETTIMANALE')}
        {monthlyPnL && monthlyPnL.length > 0 && renderChart(monthlyPnL, 'month', 'PROFITTO MENSILE')}
      </div>
    </div>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('analyzer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ctaClicked, setCtaClicked] = useState(false);
  const [pendingRows, setPendingRows] = useState(null);
  const [confirmedRows, setConfirmedRows] = useState([]);
  const [rankingPeriod, setRankingPeriod] = useState('max');

  // Analyzer compact navigation: 'global' | 'asset:<sym>' | 'strategy:<id>'
  const [analyzerView, setAnalyzerView] = useState('global');
  const [analyzerMenuOpen, setAnalyzerMenuOpen] = useState({ asset: false, strategy: false });

  const theme = useMemo(() => getTheme(isDark), [isDark]);

  const authState = useAuth();
  const { rawRows, headers, colConfig, isLoading, error, handleFileUpload } = useFileUpload();

  useEffect(() => {
    if (rawRows.length > 0) setPendingRows(rawRows);
  }, [rawRows]);

  const {
    parsedTrades,
    uniqueSymbols,
    uniqueStrategies,
    filteredTableTrades,
    analyzedTrades,
    showTable,
    setShowTable,
    groupBy,
    setGroupBy,
    tableFilters,
    setTableFilters,
    appliedFilters,
    setAppliedFilters,
    isAnalyzing,
    formulaIdx,
    mcIterations,
    setMcIterations,
    triggerAnalysis
  } = useAnalysis(confirmedRows, colConfig);

  const handleRowConfirm = (start, end) => {
    setTableFilters(prev => ({ ...prev, rowStart: start, rowEnd: end }));
    setAppliedFilters(prev => ({ ...prev, rowStart: start, rowEnd: end }));
    setConfirmedRows(pendingRows);
    setPendingRows(null);
  };

  const { spxData, marketQuotes } = useMarketData();

  const globalStats = useMemo(() => {
    if (!analyzedTrades.length) return null;

    let netProfit = 0, pkEq = 0, mxDD = 0, sumSqDDpct = 0, grossP = 0, grossL = 0, totCosti = 0, totSwap = 0;
    let curEq = 0, wonBuy = 0, wonSell = 0;
    let maxConsecLoss = 0, curConsecLoss = 0;
    let maxConsecWin = 0, curConsecWin = 0;
    const tDets = [], pDly = {}, opT = [], clT = [], eqSeq = [];

    analyzedTrades.forEach((t, i) => {
      if (t.IsMergedOut) {
        const swap = t.Swap + t.inSwap;
        const commFee = t.Commission + t.inComm + t.Fee + t.inFee;
        const costi = commFee + swap;
        const net = t.Profit + costi;

        if (t.Profit > 0) grossP += t.Profit;
        else grossL += t.Profit;

        if (net > 0) {
          if (t.Type === 'buy') wonBuy++;
          else if (t.Type === 'sell') wonSell++;
        }

        totCosti += costi;
        totSwap += swap;
        netProfit += net;
        tDets.push({ net, TimeMs: t.TimeMs });

        if (net < 0) {
          curConsecLoss++;
          if (curConsecLoss > maxConsecLoss) maxConsecLoss = curConsecLoss;
          curConsecWin = 0;
        } else {
          curConsecLoss = 0;
          curConsecWin++;
          if (curConsecWin > maxConsecWin) maxConsecWin = curConsecWin;
        }

        if (t.OpenTimeMs) opT.push(t.OpenTimeMs);
        if (t.CloseTimeMs) clT.push(t.CloseTimeMs);
        if (t.TimeMs) {
          const dKey = new Date(t.TimeMs).toISOString().split('T')[0];
          pDly[dKey] = (pDly[dKey] || 0) + net;
        }

        curEq += net;
        if (curEq > pkEq) {
          pkEq = curEq;
        } else {
          mxDD = Math.max(mxDD, pkEq - curEq);
          const ddPct = pkEq > 0 ? ((pkEq - curEq) / pkEq) * 100 : 0;
          sumSqDDpct += ddPct * ddPct;
        }

        eqSeq.push({
          tradeNum: i + 1,
          date: t.TimeMs ? new Date(t.TimeMs).toISOString().split('T')[0] : '',
          equity: curEq,
          drawdown: curEq - pkEq
        });
      }
    });

    const cC = tDets.length;
    if (cC === 0) return null;

    const wns = tDets.filter(t => t.net > 0);
    const lss = tDets.filter(t => t.net <= 0);
    const pOnly = tDets.map(t => t.net);
    const avgP = pOnly.reduce((a, b) => a + b, 0) / cC;
    const std = Math.sqrt(pOnly.reduce((a, b) => a + Math.pow(b - avgP, 2), 0) / cC);
    const pf = Math.abs(grossL) > 0 ? grossP / Math.abs(grossL) : 999;

    const lssOnly = lss.map(t => t.net);
    const downDev = Math.sqrt(
      lssOnly.length > 0 ? lssOnly.reduce((a, b) => a + Math.pow(b, 2), 0) / lssOnly.length : 0
    );

    // Annualization factor: estimate trades per year from date range
    const tradeDates = tDets.filter(t => t.TimeMs).map(t => t.TimeMs);
    let annFactor = 1;
    if (tradeDates.length >= 2) {
      const spanMs = Math.max(...tradeDates) - Math.min(...tradeDates);
      const spanYears = spanMs / (365.25 * 24 * 60 * 60 * 1000);
      const tradesPerYear = spanYears > 0 ? cC / spanYears : cC;
      annFactor = Math.sqrt(tradesPerYear);
    }

    const sharpeAnn = std > 0 ? (avgP / std) * annFactor : 0;
    const sortinoAnn = downDev > 0 ? (avgP / downDev) * annFactor : avgP > 0 ? 999 : 0;

    const { beta, corr } = calcBetaCorr(pDly, spxData);
    const { skew, kurt } = skewnessAndKurtosis(pOnly, avgP, std);
    const jbTest = jarqueBeraTest(cC, skew, kurt);
    const andDar = adTest(pOnly, avgP, std);

    // Weekly and monthly aggregations
    const pWeekly = {};
    const pMonthly = {};
    tDets.forEach(t => {
      if (!t.TimeMs) return;
      const d = new Date(t.TimeMs);
      // Week key: ISO year + week number
      const jan4 = new Date(d.getFullYear(), 0, 4);
      const weekNum = Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + jan4.getDay() + 1) / 7);
      const wKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      pWeekly[wKey] = (pWeekly[wKey] || 0) + t.net;
      // Month key
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      pMonthly[mKey] = (pMonthly[mKey] || 0) + t.net;
    });

    const weeklyValues = Object.values(pWeekly);
    const monthlyValues = Object.values(pMonthly);
    const avgWeekly = weeklyValues.length > 0 ? weeklyValues.reduce((a, b) => a + b, 0) / weeklyValues.length : 0;
    const avgMonthly = monthlyValues.length > 0 ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length : 0;

    // SPX aggregations matching same period keys
    const spxWeekly = {};
    const spxMonthly = {};
    const spxDowSum = [0, 0, 0, 0, 0, 0, 0];
    const spxDowCnt = [0, 0, 0, 0, 0, 0, 0];
    if (spxData) {
      Object.entries(spxData).forEach(([dStr, ret]) => {
        const dt = new Date(dStr);
        if (isNaN(dt)) return;
        const jan4 = new Date(dt.getFullYear(), 0, 4);
        const wN = Math.ceil(((dt - new Date(dt.getFullYear(), 0, 1)) / 86400000 + jan4.getDay() + 1) / 7);
        const wK = `${dt.getFullYear()}-W${String(wN).padStart(2, '0')}`;
        spxWeekly[wK] = (spxWeekly[wK] || 0) + ret;
        const mK = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        spxMonthly[mK] = (spxMonthly[mK] || 0) + ret;
        const dow = dt.getDay();
        spxDowSum[dow] += ret;
        spxDowCnt[dow]++;
      });
    }

    // Notional initial capital for % return mode (kept stable across periods)
    const initialCapital = Math.max(10000, mxDD * 5, Math.abs(netProfit) * 2);

    // Monthly & Weekly PnL series for histograms (sorted chronologically)
    const monthNames = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
    const monthlyPnL = Object.keys(pMonthly).sort().map(k => {
      const [y, m] = k.split('-');
      return {
        month: `${monthNames[parseInt(m, 10) - 1]} ${y.slice(2)}`,
        pnl: pMonthly[k],
        pnlPct: (pMonthly[k] / initialCapital) * 100,
        spxPct: (spxMonthly[k] || 0) * 100,
      };
    });
    const weeklyPnL = Object.keys(pWeekly).sort().map(k => ({
      week: k,
      pnl: pWeekly[k],
      pnlPct: (pWeekly[k] / initialCapital) * 100,
      spxPct: (spxWeekly[k] || 0) * 100,
    }));

    // Enrich day-of-week stats with % mode and SPX avg per day
    const dayNameToIdx = { 'Domenica': 0, 'Lunedì': 1, 'Martedì': 2, 'Mercoledì': 3, 'Giovedì': 4, 'Venerdì': 5, 'Sabato': 6 };
    const dayStatsRaw = calculateDayStats(tDets);
    const dayStatsEnriched = dayStatsRaw.map(d => {
      const idx = dayNameToIdx[d.name];
      const spxAvgPct = spxDowCnt[idx] > 0 ? (spxDowSum[idx] / spxDowCnt[idx]) * 100 : 0;
      return { ...d, avgPct: (d.avg / initialCapital) * 100, spxPct: spxAvgPct };
    });

    return {
      initialCapital,
      netProfit,
      rawProfit: netProfit - totCosti,
      grossP,
      grossL,
      totCosti,
      totSwap,
      sharpe: sharpeAnn,
      sortino: sortinoAnn,
      maxDrawdown: mxDD,
      ulcerIndex: Math.sqrt(sumSqDDpct / cC),
      winRate: (wns.length / cC) * 100,
      profitFactor: pf,
      avgProfit: avgP,
      avgWeekly,
      avgMonthly,
      monthlyPnL,
      weeklyPnL,
      stdDev: std,
      completedCount: cC,
      wonCount: wns.length,
      lostCount: lss.length,
      wonBuy,
      wonSell,
      dayStats: dayStatsEnriched,
      tradeProfits: pOnly,
      equitySequence: eqSeq,
      skew,
      kurt,
      jbTest,
      andDar,
      beta,
      corr,
      avgOpen: getAvgTimeStr(opT),
      avgClose: getAvgTimeStr(clT),
      maxConsecLoss,
      maxConsecWin,
    };
  }, [analyzedTrades, spxData]);

  const strategyStats = useMemo(() => {
    if (!analyzedTrades.length) return [];

    const grp = analyzedTrades
      .filter(t => t.IsMergedOut)
      .reduce((acc, t) => {
        const k = groupBy === 'Asset' ? t.Symbol : t.Id;
        if (groupBy === 'Strategy' && k === 'Senza Commento') return acc;
        if (!acc[k]) acc[k] = [];
        acc[k].push(t);
        return acc;
      }, {});

    return Object.keys(grp)
      .map(name => {
        const deals = grp[name].sort((a, b) => a.TimeMs - b.TimeMs);
        let curEq = 0, pkEq = 0, mxDD = 0, sumSqDDpct = 0, netProfit = 0, grossP = 0, grossL = 0, sC = 0, sSwap = 0;
        let wonBuy = 0, wonSell = 0, maxConsecLoss = 0, curConsecLoss = 0, maxConsecWin = 0, curConsecWin = 0;
        const eqSeq = [], tDets = [], opTs = [], clTs = [], pDly = {};

        deals.forEach((d, idx) => {
          const swap = d.Swap + d.inSwap;
          const costi = d.Commission + d.inComm + d.Fee + d.inFee + swap;
          const net = d.Profit + costi;

          if (d.Profit > 0) grossP += d.Profit;
          else grossL += d.Profit;

          if (net > 0) {
            if (d.Type === 'buy') wonBuy++;
            else if (d.Type === 'sell') wonSell++;
          }

          sC += costi;
          sSwap += swap;
          netProfit += net;
          curEq += net;
          tDets.push({ net, TimeMs: d.TimeMs });

          if (net < 0) {
            curConsecLoss++;
            if (curConsecLoss > maxConsecLoss) maxConsecLoss = curConsecLoss;
            curConsecWin = 0;
          } else {
            curConsecLoss = 0;
            curConsecWin++;
            if (curConsecWin > maxConsecWin) maxConsecWin = curConsecWin;
          }

          if (d.OpenTimeMs) opTs.push(d.OpenTimeMs);
          if (d.CloseTimeMs) clTs.push(d.CloseTimeMs);

          if (d.TimeMs) {
            const dKey = new Date(d.TimeMs).toISOString().split('T')[0];
            pDly[dKey] = (pDly[dKey] || 0) + net;
          }

          if (curEq > pkEq) {
            pkEq = curEq;
          } else {
            mxDD = Math.max(mxDD, pkEq - curEq);
            const ddPct = pkEq > 0 ? ((pkEq - curEq) / pkEq) * 100 : 0;
            sumSqDDpct += ddPct * ddPct;
          }

          eqSeq.push({
            tradeNum: idx + 1,
            date: d.TimeMs ? new Date(d.TimeMs).toISOString().split('T')[0] : '',
            equity: curEq,
            drawdown: curEq - pkEq
          });
        });

        const c = tDets.length;
        const wns = tDets.filter(t => t.net > 0);
        const lss = tDets.filter(t => t.net <= 0);
        const pOnly = tDets.map(t => t.net);
        const avgP = c > 0 ? netProfit / c : 0;
        const std = Math.sqrt(c > 0 ? tDets.reduce((a, b) => a + Math.pow(b.net - avgP, 2), 0) / c : 0);
        const lssOnly = lss.map(t => t.net);
        const downDev = Math.sqrt(
          lssOnly.length > 0 ? lssOnly.reduce((a, b) => a + Math.pow(b, 2), 0) / lssOnly.length : 0
        );
        const ulcerIndex = c > 0 ? Math.sqrt(sumSqDDpct / c) : 0;

        // Annualization factor for this strategy/asset
        const sDates = tDets.filter(t => t.TimeMs).map(t => t.TimeMs);
        let sAnnFactor = 1;
        if (sDates.length >= 2) {
          const sSpan = Math.max(...sDates) - Math.min(...sDates);
          const sYears = sSpan / (365.25 * 24 * 60 * 60 * 1000);
          const sTradesPerYear = sYears > 0 ? c / sYears : c;
          sAnnFactor = Math.sqrt(sTradesPerYear);
        }

        const { beta, corr } = calcBetaCorr(pDly, spxData);
        const { skew, kurt } = skewnessAndKurtosis(pOnly, avgP, std);
        const jbTest = jarqueBeraTest(c, skew, kurt);
        const andDar = adTest(pOnly, avgP, std);

        // Weekly & Monthly aggregation
        const sWeekly = {};
        const sMonthly = {};
        tDets.forEach(t => {
          if (!t.TimeMs) return;
          const d = new Date(t.TimeMs);
          const jan4 = new Date(d.getFullYear(), 0, 4);
          const wNum = Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + jan4.getDay() + 1) / 7);
          const wK = `${d.getFullYear()}-W${String(wNum).padStart(2, '0')}`;
          sWeekly[wK] = (sWeekly[wK] || 0) + t.net;
          const mK = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          sMonthly[mK] = (sMonthly[mK] || 0) + t.net;
        });
        const sWkVals = Object.values(sWeekly);
        const sMoVals = Object.values(sMonthly);
        const sAvgWeekly = sWkVals.length > 0 ? sWkVals.reduce((a, b) => a + b, 0) / sWkVals.length : 0;
        const sAvgMonthly = sMoVals.length > 0 ? sMoVals.reduce((a, b) => a + b, 0) / sMoVals.length : 0;
        const mNames = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

        // SPX aggregations for this strategy (same ranges as its trades)
        const sSpxWeekly = {};
        const sSpxMonthly = {};
        const sSpxDowSum = [0, 0, 0, 0, 0, 0, 0];
        const sSpxDowCnt = [0, 0, 0, 0, 0, 0, 0];
        if (spxData) {
          Object.entries(spxData).forEach(([dStr, ret]) => {
            const dt = new Date(dStr);
            if (isNaN(dt)) return;
            const jan4 = new Date(dt.getFullYear(), 0, 4);
            const wN = Math.ceil(((dt - new Date(dt.getFullYear(), 0, 1)) / 86400000 + jan4.getDay() + 1) / 7);
            const wK = `${dt.getFullYear()}-W${String(wN).padStart(2, '0')}`;
            sSpxWeekly[wK] = (sSpxWeekly[wK] || 0) + ret;
            const mK = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
            sSpxMonthly[mK] = (sSpxMonthly[mK] || 0) + ret;
            const dow = dt.getDay();
            sSpxDowSum[dow] += ret;
            sSpxDowCnt[dow]++;
          });
        }

        const sInitialCapital = Math.max(10000, mxDD * 5, Math.abs(netProfit) * 2);

        const sMonthlyPnL = Object.keys(sMonthly).sort().map(k => {
          const [y, m] = k.split('-');
          return {
            month: `${mNames[parseInt(m, 10) - 1]} ${y.slice(2)}`,
            pnl: sMonthly[k],
            pnlPct: (sMonthly[k] / sInitialCapital) * 100,
            spxPct: (sSpxMonthly[k] || 0) * 100,
          };
        });
        const sWeeklyPnL = Object.keys(sWeekly).sort().map(k => ({
          week: k,
          pnl: sWeekly[k],
          pnlPct: (sWeekly[k] / sInitialCapital) * 100,
          spxPct: (sSpxWeekly[k] || 0) * 100,
        }));

        const dayNameIdx = { 'Domenica': 0, 'Lunedì': 1, 'Martedì': 2, 'Mercoledì': 3, 'Giovedì': 4, 'Venerdì': 5, 'Sabato': 6 };
        const sDayStats = calculateDayStats(tDets).map(d => {
          const idx = dayNameIdx[d.name];
          const spxAvgPct = sSpxDowCnt[idx] > 0 ? (sSpxDowSum[idx] / sSpxDowCnt[idx]) * 100 : 0;
          return { ...d, avgPct: (d.avg / sInitialCapital) * 100, spxPct: spxAvgPct };
        });

        return {
          name,
          count: c,
          winRate: c > 0 ? (wns.length / c) * 100 : 0,
          wonCount: wns.length,
          lostCount: lss.length,
          wonBuy,
          wonSell,
          sharpe: std > 0 ? (avgP / std) * sAnnFactor : 0,
          sortino: downDev > 0 ? (avgP / downDev) * sAnnFactor : avgP > 0 ? 999 : 0,
          maxDrawdown: mxDD,
          netProfit,
          grossP,
          grossL,
          totCosti: sC,
          totSwap: sSwap,
          avgP,
          std,
          ulcerIndex,
          avgWeekly: sAvgWeekly,
          avgMonthly: sAvgMonthly,
          monthlyPnL: sMonthlyPnL,
          weeklyPnL: sWeeklyPnL,
          beta,
          corr,
          skew,
          kurt,
          jbTest,
          andDar,
          tradeProfits: pOnly,
          profitFactor: Math.abs(grossL) > 0 ? grossP / Math.abs(grossL) : 999,
          equitySequence: eqSeq,
          initialCapital: sInitialCapital,
          dayStats: sDayStats,
          avgOpen: getAvgTimeStr(opTs),
          avgClose: getAvgTimeStr(clTs),
          maxConsecLoss,
          maxConsecWin,
        };
      })
      .sort((a, b) => b.netProfit - a.netProfit);
  }, [analyzedTrades, groupBy, spxData]);

  // Rankings: best assets and best strategies by time period
  const rankings = useMemo(() => {
    if (!analyzedTrades.length) return { assets: [], strategies: [] };

    const now = Date.now();
    const periodMs = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      trimester: 90 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
      max: Infinity,
    };

    const cutoff = rankingPeriod === 'max' ? 0 : now - periodMs[rankingPeriod];

    const completed = analyzedTrades.filter(t => t.IsMergedOut && (t.TimeMs || 0) >= cutoff);

    const groupAndRank = (keyFn) => {
      const grp = {};
      completed.forEach(t => {
        const k = keyFn(t);
        if (!k || k === 'Senza Commento') return;
        if (!grp[k]) grp[k] = { name: k, pnl: 0, trades: 0, wins: 0, nets: [], dates: [] };
        const swap = t.Swap + t.inSwap;
        const costi = t.Commission + t.inComm + t.Fee + t.inFee + swap;
        const net = t.Profit + costi;
        grp[k].pnl += net;
        grp[k].trades++;
        grp[k].nets.push(net);
        if (t.TimeMs) grp[k].dates.push(t.TimeMs);
        if (net > 0) grp[k].wins++;
      });
      return Object.values(grp)
        .map(g => {
          const winRate = g.trades > 0 ? (g.wins / g.trades * 100) : 0;
          const avg = g.nets.reduce((a, b) => a + b, 0) / g.nets.length;
          const std = Math.sqrt(g.nets.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / g.nets.length);
          let annFactor = 1;
          if (g.dates.length >= 2) {
            const spanMs = Math.max(...g.dates) - Math.min(...g.dates);
            const spanY = spanMs / (365.25 * 24 * 60 * 60 * 1000);
            if (spanY > 0) annFactor = Math.sqrt(g.nets.length / spanY);
          }
          const sharpe = std > 0 ? (avg / std) * annFactor : 0;
          return { name: g.name, pnl: g.pnl, trades: g.trades, wins: g.wins, winRate, sharpe };
        })
        .sort((a, b) => b.pnl - a.pnl);
    };

    return {
      assets: groupAndRank(t => t.Symbol),
      strategies: groupAndRank(t => t.Id),
    };
  }, [analyzedTrades, rankingPeriod]);

  const correlationData = useMemo(() => {
    const trades = analyzedTrades.filter(t => t.IsMergedOut && t.TimeMs);
    if (trades.length < 10) return { entities: [], matrix: [] };

    const dMap = {};
    trades.forEach(t => {
      const d = new Date(t.TimeMs).toISOString().split('T')[0];
      const k = groupBy === 'Asset' ? t.Symbol : t.Id;
      if (groupBy === 'Strategy' && k === 'Senza Commento') return;

      const net = t.Profit + t.Commission + t.inComm + t.Fee + t.inFee + t.Swap + t.inSwap;
      if (!dMap[d]) dMap[d] = {};
      dMap[d][k] = (dMap[d][k] || 0) + net;
    });

    const entities = Array.from(
      new Set(trades.map(t => groupBy === 'Asset' ? t.Symbol : t.Id))
    )
      .filter(e => !(groupBy === 'Strategy' && e === 'Senza Commento'))
      .sort();

    if (entities.length < 2) return { entities: [], matrix: [] };

    const matrix = entities.map(e1 => {
      const row = { entity: e1 };

      entities.forEach(e2 => {
        if (e1 === e2) {
          row[e2] = 1;
          return;
        }

        let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0, n = 0;

        Object.values(dMap).forEach(dayData => {
          const v1 = dayData[e1] || 0;
          const v2 = dayData[e2] || 0;

          if (v1 !== 0 || v2 !== 0) {
            sum1 += v1;
            sum2 += v2;
            sum1Sq += v1 * v1;
            sum2Sq += v2 * v2;
            pSum += v1 * v2;
            n++;
          }
        });

        if (n === 0) {
          row[e2] = 0;
          return;
        }

        const num = pSum - (sum1 * sum2 / n);
        const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
        row[e2] = den === 0 ? 0 : num / den;
      });

      return row;
    });

    return { entities, matrix };
  }, [analyzedTrades, groupBy]);

  const [monteCarloData, setMonteCarloData] = useState(null);
  const [isMcLoading, setIsMcLoading] = useState(false);
  const [hoveredRunKey, setHoveredRunKey] = useState(null);
  const mcWorkerRef = useRef(null);

  useEffect(() => {
    const worker = new MonteCarloWorker();
    mcWorkerRef.current = worker;
    worker.onmessage = (e) => {
      setMonteCarloData(e.data);
      setIsMcLoading(false);
    };
    return () => {
      worker.terminate();
      mcWorkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mcWorkerRef.current) return;
    if (!analyzedTrades.length) {
      setMonteCarloData(null);
      return;
    }
    const trades = analyzedTrades
      .filter(t => t.IsMergedOut)
      .map(t => t.Profit + t.Commission + t.Fee + t.Swap + t.inComm + t.inFee + t.inSwap);

    if (trades.length < 5) {
      setMonteCarloData(null);
      return;
    }

    setIsMcLoading(true);
    mcWorkerRef.current.postMessage({ trades, iterations: mcIterations });
  }, [analyzedTrades, mcIterations]);

  const getLineColors = (darkMode) => [
    darkMode ? '#00ff00' : '#16a34a',
    darkMode ? '#ffffff' : '#0ea5e9',
    darkMode ? '#ffcc00' : '#d97706',
    darkMode ? '#ff00ff' : '#c026d3',
    darkMode ? '#ff3333' : '#dc2626',
    '#3399ff',
    '#ff9933',
    '#cc66ff',
    '#33cc99',
    darkMode ? '#00ffff' : '#0f172a',
    '#ff66b2',
    '#99ff33',
    '#00bfff',
    '#ff9999',
    '#cccc00'
  ];

  const dynLineColors = getLineColors(isDark);

  return (
    <div className={`w-full min-h-screen ${theme.bg} ${theme.text} font-sans bloomberg-scanline`}
      style={{
        '--c-border': isDark ? '#1a1a1a' : '#e5e7eb',
        '--c-panel': isDark ? '#0a0a0a' : '#ffffff',
        '--c-card': isDark ? '#0e0e0e' : '#f9fafb',
        '--c-muted': isDark ? '#555555' : '#6b7280',
        '--c-text': isDark ? '#e0e0e0' : '#111827',
        '--c-accent': isDark ? '#ff8c00' : '#2563eb',
      }}
    >
      <style>{marqueeStyle}</style>

      <AnalysisLoader
        isAnalyzing={isAnalyzing}
        formulaIdx={formulaIdx}
        isDark={isDark}
        theme={theme}
        rowStart={tableFilters.rowStart}
        rowEnd={tableFilters.rowEnd}
      />

      {!authState.isAuthenticated && !ctaClicked && (
        <Landing
          isDark={isDark}
          setIsDark={setIsDark}
          theme={theme}
          onStart={() => setCtaClicked(true)}
          marketQuotes={marketQuotes}
        />
      )}
      {!authState.isAuthenticated && ctaClicked && (
        <LoginModal {...authState} theme={theme} onBack={() => { setCtaClicked(false); authState.setLoginStep('input'); }} />
      )}

      {pendingRows && (
        <RowRangeModal totalRows={pendingRows.length} onConfirm={handleRowConfirm} />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => { authState.setIsAuthenticated(false); setCtaClicked(false); }}
        isDark={isDark}
        theme={theme}
      />

      <div className="sticky top-0 z-[100]">
        <div className="w-full px-6 lg:px-10 xl:px-14">
          <MarketTicker marketQuotes={marketQuotes} isDark={isDark} theme={theme} />
          <Navbar
            isDark={isDark}
            setIsDark={setIsDark}
            isLoading={isLoading}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            onFileUpload={handleFileUpload}
            theme={theme}
          />
        </div>
      </div>

      <main className="w-full py-20 pb-40">
        <div className="w-full px-8 lg:px-14 xl:px-20 py-16 pb-40 flex gap-10">
          {/* Sidebar Analyzer compatta: appare solo con report caricato */}
          {activeTab === 'analyzer' && parsedTrades.length > 0 && (
            <aside className="w-72 flex-shrink-0 sticky top-32 self-start max-h-[calc(100vh-10rem)] overflow-y-auto bg-[var(--c-panel)] border border-[var(--c-border)] rounded-lg">
              {/* Header */}
              <div className="px-6 py-5 border-b border-[var(--c-border)]">
                <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--c-muted)]">
                  Navigazione
                </div>
                <div className="mt-2 text-sm font-mono font-bold text-[var(--c-text)] tracking-wide">
                  Report Analyzer
                </div>
              </div>

              {/* Globale */}
              <div className="px-3 py-5">
                <button
                  onClick={() => setAnalyzerView('global')}
                  className={`w-full flex items-center gap-3 px-4 h-11 rounded-md font-mono text-[13px] tracking-wide transition-all ${
                    analyzerView === 'global'
                      ? 'bg-[#ff8c00] text-black shadow-sm'
                      : 'text-[var(--c-text)] hover:bg-[#ff8c00]/10 hover:text-[#ff8c00]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    analyzerView === 'global' ? 'bg-black' : 'bg-[var(--c-muted)]'
                  }`} />
                  <span className="font-semibold">Globale</span>
                </button>
              </div>

              <div className="h-px bg-[var(--c-border)]" />

              {/* Orders */}
              <div className="px-3 py-5">
                <button
                  onClick={() => setAnalyzerView('orders')}
                  className={`w-full flex items-center gap-3 px-4 h-11 rounded-md font-mono text-[13px] tracking-wide transition-all ${
                    analyzerView === 'orders'
                      ? 'bg-[#ff8c00] text-black shadow-sm'
                      : 'text-[var(--c-text)] hover:bg-[#ff8c00]/10 hover:text-[#ff8c00]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    analyzerView === 'orders' ? 'bg-black' : 'bg-[var(--c-muted)]'
                  }`} />
                  <span className="font-semibold">Orders</span>
                  <span className="ml-auto text-[10px] font-mono opacity-60">
                    {filteredTableTrades.length}
                  </span>
                </button>
              </div>

              <div className="h-px bg-[var(--c-border)]" />

              {/* Classifica Performance */}
              <div className="px-3 py-5">
                <button
                  onClick={() => setAnalyzerView('rankings')}
                  className={`w-full flex items-center gap-3 px-4 h-11 rounded-md font-mono text-[13px] tracking-wide transition-all ${
                    analyzerView === 'rankings'
                      ? 'bg-[#ff8c00] text-black shadow-sm'
                      : 'text-[var(--c-text)] hover:bg-[#ff8c00]/10 hover:text-[#ff8c00]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    analyzerView === 'rankings' ? 'bg-black' : 'bg-[var(--c-muted)]'
                  }`} />
                  <span className="font-semibold">Classifica Performance</span>
                </button>
              </div>

              <div className="h-px bg-[var(--c-border)]" />

              {/* Per Asset */}
              <div className="px-3 py-5">
                <button
                  onClick={() => setAnalyzerMenuOpen((s) => ({ ...s, asset: !s.asset }))}
                  className="w-full flex items-center justify-between px-4 h-11 rounded-md font-mono text-[13px] tracking-wide text-[var(--c-text)] hover:bg-[#ff8c00]/10 hover:text-[#ff8c00] transition-all"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-muted)]" />
                    <span className="font-semibold">Per Asset</span>
                    <span className="text-[10px] font-mono text-[var(--c-muted)]">
                      {uniqueSymbols.length}
                    </span>
                  </span>
                  {analyzerMenuOpen.asset ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                </button>
                {analyzerMenuOpen.asset && (
                  <div className="mt-3 ml-5 pl-5 border-l border-[var(--c-border)] space-y-1.5 py-2">
                    {uniqueSymbols.map((sym) => {
                      const key = `asset:${sym}`;
                      const selected = analyzerView === key;
                      return (
                        <button
                          key={sym}
                          onClick={() => {
                            if (groupBy !== 'Asset') setGroupBy('Asset');
                            setAnalyzerView(key);
                          }}
                          className={`w-full text-left px-3 h-9 flex items-center rounded font-mono text-xs tracking-wide transition-all ${
                            selected
                              ? 'bg-[#ff8c00]/15 text-[#ff8c00]'
                              : 'text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[#ff8c00]/5'
                          }`}
                        >
                          {sym}
                        </button>
                      );
                    })}
                    {uniqueSymbols.length === 0 && (
                      <div className="text-xs font-mono text-[var(--c-muted)] italic px-3 py-2">Nessun asset</div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-[var(--c-border)]" />

              {/* Per Strategia */}
              <div className="px-3 py-5">
                <button
                  onClick={() => setAnalyzerMenuOpen((s) => ({ ...s, strategy: !s.strategy }))}
                  className="w-full flex items-center justify-between px-4 h-11 rounded-md font-mono text-[13px] tracking-wide text-[var(--c-text)] hover:bg-[#ff8c00]/10 hover:text-[#ff8c00] transition-all"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-muted)]" />
                    <span className="font-semibold">Per Strategia</span>
                    <span className="text-[10px] font-mono text-[var(--c-muted)]">
                      {uniqueStrategies.filter((s) => s !== 'Senza Commento').length}
                    </span>
                  </span>
                  {analyzerMenuOpen.strategy ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                </button>
                {analyzerMenuOpen.strategy && (
                  <div className="mt-3 ml-5 pl-5 border-l border-[var(--c-border)] space-y-1.5 py-2">
                    {uniqueStrategies.filter((s) => s !== 'Senza Commento').map((id) => {
                      const key = `strategy:${id}`;
                      const selected = analyzerView === key;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            if (groupBy !== 'Strategy') setGroupBy('Strategy');
                            setAnalyzerView(key);
                          }}
                          className={`w-full text-left px-3 h-9 flex items-center rounded font-mono text-xs tracking-wide transition-all truncate ${
                            selected
                              ? 'bg-[#ff8c00]/15 text-[#ff8c00]'
                              : 'text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[#ff8c00]/5'
                          }`}
                          title={id}
                        >
                          {id}
                        </button>
                      );
                    })}
                    {uniqueStrategies.filter((s) => s !== 'Senza Commento').length === 0 && (
                      <div className="text-xs font-mono text-[var(--c-muted)] italic px-3 py-2">Nessuna strategia</div>
                    )}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Contenuto principale (preserva lo space-y-32 di prima) */}
          <div className="flex-1 min-w-0 space-y-32">
          {parsedTrades.length === 0 && confirmedRows.length === 0 && activeTab === 'analyzer' && (
            <div className="flex flex-col items-center justify-center min-h-[62vh] text-center gap-8 animate-fade-in">
              <img src="/Logo.jpg" alt="SniperForex" className="w-20 h-20 opacity-30 rounded-lg" />
              <div>
                <h2 className="text-3xl font-black mb-3 text-[var(--c-text)] font-mono tracking-tight">
                  Nessun Report Caricato
                </h2>
                <p className="text-[var(--c-muted)] text-sm max-w-md mx-auto font-mono leading-6">
                  Importa un report MetaTrader 5 in formato <span className="text-[#ff8c00]">.xlsx</span>,{' '}
                  <span className="text-[#ff8c00]">.xls</span>, <span className="text-[#ff8c00]">.html</span> o{' '}
                  <span className="text-[#ff8c00]">.csv</span> per iniziare l&apos;analisi.
                </p>
              </div>

              <label className="flex items-center gap-4 px-8 py-4 rounded-xl font-bold text-sm cursor-pointer uppercase tracking-[0.2em] bg-[#ff8c00] text-black hover:bg-[#ff9f1c] transition-all shadow-xl shadow-[#ff8c00]/30 hover:scale-105 hover:shadow-[#ff8c00]/50 font-mono h-14">
                <Upload className="w-6 h-6 flex-shrink-0" />
                IMPORT REPORT MT5
                <input
                  type="file"
                  accept=".xlsx,.xls,.html,.htm,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {parsedTrades.length === 0 && confirmedRows.length > 0 && activeTab === 'analyzer' && (
            <div className="flex flex-col items-center justify-center min-h-[44vh] text-center gap-8 animate-fade-in">
              <img src="/Logo.jpg" alt="SniperForex" className="w-16 h-16 opacity-30 rounded-lg" />
              <div>
                <h2 className="text-2xl font-black mb-3 text-[var(--c-text)] font-mono tracking-tight">
                  Nessun Trade nel Range
                </h2>
                <p className="text-[var(--c-muted)] text-sm max-w-md mx-auto font-mono leading-6">
                  Il range selezionato non contiene trade validi. Ricarica il file e seleziona un range diverso.
                </p>
              </div>

              <label className="flex items-center gap-2 px-6 py-3.5 rounded font-bold text-xs cursor-pointer uppercase tracking-widest bg-[#ff8c00] text-black hover:bg-[#ff9f1c] transition-all shadow-lg shadow-[#ff8c00]/20 font-mono">
                <Upload className="w-4 h-4" />
                RICARICA FILE
                <input
                  type="file"
                  accept=".xlsx,.xls,.html,.htm,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {parsedTrades.length > 0 && activeTab === 'analyzer' && analyzerView === 'orders' && (
            <div className={`rounded-lg border ${theme.border} ${theme.panel} overflow-hidden glow-panel animate-fade-in`}>
              <div
                className={`flex items-center justify-between px-8 py-4.5 border-b ${theme.border} cursor-pointer select-none ${theme.cardHover} transition-colors`}
                onClick={() => setShowTable(!showTable)}
              >
                <div className="flex items-center gap-3">
                  <TableIcon className="w-4 h-4 text-[#ff8c00]" />
                  <span className="text-xs font-bold text-[#ff8c00] tracking-widest font-mono uppercase glow-orange">
                    DEAL BOOK
                  </span>
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-[#ff8c00]/10 text-[#ff8c00] border border-[#ff8c00]/20 font-mono">
                    {filteredTableTrades.length}
                  </span>
                </div>

                <button className="p-2.5 rounded text-[var(--c-muted)] hover:text-[#ff8c00] hover:bg-[#ff8c00]/5 transition-all">
                  {showTable ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {showTable && (
                <div className="p-8 space-y-7">
                  <div className="space-y-8 pb-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        {
                          label: 'Direzione',
                          node: (
                            <select
                              className="w-full h-10 px-3 rounded text-xs border border-[var(--c-border)] bg-[#000000] text-[var(--c-text)] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
                              value={tableFilters.dir}
                              onChange={e => setTableFilters({ ...tableFilters, dir: e.target.value })}
                            >
                              <option value="all">Tutte</option>
                              <option value="in">IN</option>
                              <option value="out">OUT</option>
                            </select>
                          )
                        },
                        {
                          label: 'Tipo',
                          node: (
                            <select
                              className="w-full h-10 px-3 rounded text-xs border border-[var(--c-border)] bg-[#000000] text-[var(--c-text)] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
                              value={tableFilters.tradeType}
                              onChange={e => setTableFilters({ ...tableFilters, tradeType: e.target.value })}
                            >
                              <option value="all">Tutti</option>
                              <option value="buy">BUY</option>
                              <option value="sell">SELL</option>
                            </select>
                          )
                        },
                        {
                          label: 'Da data',
                          node: (
                            <input
                              type="date"
                              className="w-full h-10 px-3 rounded text-xs border border-[var(--c-border)] bg-[#000000] text-[var(--c-text)] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
                              value={tableFilters.dateStart}
                              onChange={e => setTableFilters({ ...tableFilters, dateStart: e.target.value })}
                            />
                          )
                        },
                        {
                          label: 'A data',
                          node: (
                            <input
                              type="date"
                              className="w-full h-10 px-3 rounded text-xs border border-[var(--c-border)] bg-[#000000] text-[var(--c-text)] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
                              value={tableFilters.dateEnd}
                              onChange={e => setTableFilters({ ...tableFilters, dateEnd: e.target.value })}
                            />
                          )
                        },
                        {
                          label: 'Da riga',
                          node: (
                            <input
                              type="number"
                              min="1"
                              className="w-full h-10 px-3 rounded text-xs border border-[var(--c-border)] bg-[#000000] text-[var(--c-text)] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
                              value={tableFilters.rowStart || ''}
                              onChange={e => setTableFilters({ ...tableFilters, rowStart: e.target.value || '' })}
                            />
                          )
                        },
                        {
                          label: 'A riga',
                          node: (
                            <input
                              type="number"
                              min="1"
                              className="w-full h-10 px-3 rounded text-xs border border-[var(--c-border)] bg-[#000000] text-[var(--c-text)] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
                              value={tableFilters.rowEnd || ''}
                              onChange={e => setTableFilters({ ...tableFilters, rowEnd: e.target.value || '' })}
                            />
                          )
                        },
                      ].map(({ label, node }) => (
                        <div key={label}>
                          <label className="block text-[9px] uppercase tracking-[0.15em] font-semibold text-[var(--c-muted)] mb-2 font-mono">
                            {label}
                          </label>
                          {node}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {[
                        {
                          label: 'Simboli',
                          items: uniqueSymbols,
                          selected: tableFilters.symbols,
                          onToggle: (s) => setTableFilters({
                            ...tableFilters,
                            symbols: tableFilters.symbols.includes(s)
                              ? tableFilters.symbols.filter(x => x !== s)
                              : [...tableFilters.symbols, s]
                          }),
                          onClear: () => setTableFilters({ ...tableFilters, symbols: [] }),
                        },
                        {
                          label: 'Strategie',
                          items: uniqueStrategies,
                          selected: tableFilters.strategies,
                          onToggle: (s) => setTableFilters({
                            ...tableFilters,
                            strategies: tableFilters.strategies.includes(s)
                              ? tableFilters.strategies.filter(x => x !== s)
                              : [...tableFilters.strategies, s]
                          }),
                          onClear: () => setTableFilters({ ...tableFilters, strategies: [] }),
                        },
                      ].map(({ label, items, selected, onToggle, onClear }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] uppercase tracking-widest font-semibold text-gray-600">
                              {label}
                            </label>
                            <button
                              onClick={onClear}
                              className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
                            >
                              Azzera
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 p-4 rounded border border-[var(--c-border)] bg-[#000000]/60 min-h-[56px] max-h-32 overflow-y-auto">
                            {items.map(s => (
                              <button
                                key={s}
                                onClick={() => onToggle(s)}
                                className={`px-3 py-2 rounded text-xs font-mono font-semibold transition-all border ${
                                  selected.includes(s)
                                    ? 'bg-[#ff8c00]/15 text-[#ff8c00] border-[#ff8c00]/30'
                                    : 'bg-transparent text-[var(--c-muted)] border-[var(--c-border)] hover:text-[var(--c-text)] hover:border-[var(--c-border)]'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-5 pb-3">
                      <button
                        onClick={triggerAnalysis}
                        className="w-full h-10 rounded-2xl text-sm font-bold uppercase tracking-[0.2em] bg-[#ff8c00] hover:bg-[#ff9f1c] text-black transition-all duration-200 border border-[#ff8c00]/60 shadow-lg shadow-[#ff8c00]/20 font-mono hover:scale-[1.02] active:scale-[0.98]"
                      >
                        APPLICA FILTRI & AGGIORNA ANALISI
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <FilterBadge filters={appliedFilters} isDark={isDark} theme={theme} />
                  </div>

                  <div className="rounded-lg border border-[var(--c-border)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <div className="overflow-y-auto max-h-[560px]">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead className="sticky top-0 z-10 bg-[var(--c-card)]">
                            <tr>
                              {[
                                'Open Time',
                                'Dir',
                                'Type',
                                'Symbol',
                                'Strategy / ID',
                                'Gross Profit',
                                'Swap',
                                'Commissioni',
                                'Net PNL'
                              ].map((h, i) => (
                                <th
                                  key={h}
                                  className={`px-4 py-3.5 text-[9px] uppercase tracking-[0.15em] font-semibold text-[var(--c-muted)] border-b border-[var(--c-border)] whitespace-nowrap ${
                                    i >= 5 ? 'text-right' : ''
                                  }`}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-[#111824]">
                            {filteredTableTrades.map((t, idx) => {
                              const swap = t.Swap + t.inSwap;
                              const comms = t.Commission + t.Fee + t.inComm + t.inFee;
                              const netto = t.Profit + swap + comms;

                              return (
                                <tr
                                  key={idx}
                                  className="hover:bg-[var(--c-card)]/60 transition-colors duration-100 group"
                                >
                                  <td className="px-4 py-3 text-[var(--c-muted)] whitespace-nowrap">
                                    {t.OpenTimeMs ? new Date(t.OpenTimeMs).toLocaleString() : '—'}
                                  </td>

                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-bold tracking-wider ${
                                        t.Direction === 'in'
                                          ? 'bg-[#64b5f6]/10 text-[#64b5f6] border border-[#64b5f6]/20'
                                          : 'bg-[#ff1744]/10 text-[#ff1744] border border-[#ff1744]/20'
                                      }`}
                                    >
                                      {t.Direction.toUpperCase()}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-bold tracking-wider ${
                                        t.Type === 'buy'
                                          ? 'bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20'
                                          : 'bg-[#ff8c00]/10 text-[#ff8c00] border border-[#ff8c00]/20'
                                      }`}
                                    >
                                      {t.Type.toUpperCase()}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 font-bold text-[var(--c-text)]">{t.Symbol}</td>
                                  <td className="px-4 py-3 text-[var(--c-muted)] max-w-[180px] truncate">{t.Id}</td>

                                  <td
                                    className={`px-4 py-3 text-right font-semibold ${
                                      t.Profit >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'
                                    }`}
                                  >
                                    {t.Profit.toFixed(2)}
                                  </td>

                                  <td className="px-4 py-3 text-right text-[#ffa726]/70">{swap.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-right text-[#ff1744]/60">{comms.toFixed(2)}</td>

                                  <td
                                    className={`px-4 py-3 text-right font-bold ${
                                      netto >= 0 ? 'text-[#00e676] glow-green' : 'text-[#ff1744] glow-red'
                                    }`}
                                  >
                                    {netto.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {globalStats && activeTab === 'analyzer' && analyzerView === 'global' && (
            <div className={`${theme.panel} rounded-lg border ${theme.border} p-10 lg:p-12 glow-panel animate-fade-in`}>
              <div className="flex items-center gap-3 mb-14">
                <div className="w-1 h-6 bg-[#ff8c00] rounded-full" />
                <h3 className="text-sm font-bold text-[#ff8c00] uppercase tracking-[0.2em] font-mono glow-orange">
                  GLOBAL STATISTICS
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5 lg:gap-6 mb-16">
                <KPICard isDark={isDark} theme={theme} label="Net Profit" value={`€${globalStats.netProfit.toFixed(2)}`} valueClass={globalStats.netProfit >= 0 ? theme.success : theme.danger} infoDesc="Profitto finale post costi" infoFormula="Net = Σ(Profit + Swap + Comm + Fee)" signal={globalStats.netProfit > 0 ? 'good' : 'bad'} />
                <KPICard isDark={isDark} theme={theme} label="Gross Profit" value={`+€${globalStats.grossP.toFixed(2)}`} valueClass={theme.success} infoDesc="Somma dei trade vinti" infoFormula="Σ Profit_i  dove Profit_i > 0" />
                <KPICard isDark={isDark} theme={theme} label="Gross Loss" value={`€${globalStats.grossL.toFixed(2)}`} valueClass={theme.danger} infoDesc="Somma dei trade persi" infoFormula="Σ Profit_i  dove Profit_i < 0" />
                <KPICard isDark={isDark} theme={theme} label="Costi (Comm)" value={`€${globalStats.totCosti.toFixed(2)}`} valueClass="text-rose-500" infoDesc="Commissioni e Fee totali" infoFormula="Σ (Commission_i + Fee_i)" />
                <KPICard isDark={isDark} theme={theme} label="Costi (Swap)" value={`€${globalStats.totSwap.toFixed(2)}`} valueClass="text-amber-500" infoDesc="Tassi Swap Overnight" infoFormula="Σ Swap_i" />
                <KPICard isDark={isDark} theme={theme} label="Profit Medio" value={`€${globalStats.avgProfit.toFixed(2)}`} infoDesc="Expectancy per trade" infoFormula="E[X] = NetProfit / N" signal={globalStats.avgProfit > 0 ? 'good' : 'bad'} />
                <KPICard isDark={isDark} theme={theme} label="Dev. Standard" value={`€${globalStats.stdDev.toFixed(2)}`} infoDesc="Volatilità dei ritorni" infoFormula="σ = √(Σ(x_i - μ)² / N)" />
                <KPICard isDark={isDark} theme={theme} label="Profit Factor" value={globalStats.profitFactor === 999 ? 'MAX' : globalStats.profitFactor.toFixed(2)} infoDesc="Rapporto vincite/perdite assolute" infoFormula="PF = GrossProfit / |GrossLoss|" signal={globalStats.profitFactor >= 1.5 ? 'good' : globalStats.profitFactor < 1 ? 'bad' : undefined} />

                <KPICard isDark={isDark} theme={theme} label="Trade Totali" value={globalStats.completedCount} infoDesc="Numero ordini chiusi totali" infoFormula="N = count(MergedOut)" />
                <KPICard isDark={isDark} theme={theme} label="Trade Vinti" value={globalStats.wonCount} valueClass={theme.success} infoDesc="Trade con net > 0" infoFormula="W = count(net_i > 0)" />
                <KPICard isDark={isDark} theme={theme} label="Trade Persi" value={globalStats.lostCount} valueClass={theme.danger} infoDesc="Trade con net ≤ 0" infoFormula="L = count(net_i ≤ 0)" />
                <KPICard isDark={isDark} theme={theme} label="Win Rate" value={`${globalStats.winRate.toFixed(1)}%`} infoDesc="Percentuale successo" infoFormula="WR = (W / N) × 100" signal={globalStats.winRate >= 50 ? 'good' : 'bad'} />
                <KPICard isDark={isDark} theme={theme} label="Buy Vinti" value={globalStats.wonBuy} valueClass={theme.success} infoDesc="Operazioni Long in profitto" infoFormula="count(buy ∧ net > 0)" />
                <KPICard isDark={isDark} theme={theme} label="Sell Vinti" value={globalStats.wonSell} valueClass={theme.success} infoDesc="Operazioni Short in profitto" infoFormula="count(sell ∧ net > 0)" />
                <KPICard isDark={isDark} theme={theme} label="Avg Open Time" value={globalStats.avgOpen} icon={Clock} infoDesc="Media oraria di entrata" infoFormula="mean(OpenTime_i)" />
                <KPICard isDark={isDark} theme={theme} label="Avg Close Time" value={globalStats.avgClose} icon={Clock} infoDesc="Media oraria di uscita" infoFormula="mean(CloseTime_i)" />

                <KPICard isDark={isDark} theme={theme} label="Max Drawdown" value={`€${globalStats.maxDrawdown.toFixed(2)}`} valueClass={theme.danger} infoDesc="Peggior flessione equity (assoluta)" infoFormula="MDD = max(Peak_i - Equity_i)" signal="bad" />
                <KPICard isDark={isDark} theme={theme} label="Ulcer Index" value={globalStats.ulcerIndex.toFixed(2)} valueClass={theme.warning} infoDesc="Indice di stress (RMS % drawdown)" infoFormula="UI = √(Σ DD%_i² / N)  dove DD%=(Peak-Eq)/Peak×100" signal={globalStats.ulcerIndex < 5 ? 'good' : 'bad'} />
                <KPICard isDark={isDark} theme={theme} label="Sharpe Ratio" value={globalStats.sharpe.toFixed(2)} infoDesc="Rendimento risk-adjusted annualizzato" infoFormula="SR = (μ / σ) × √(N/anno)" signal={globalStats.sharpe >= 1 ? 'good' : globalStats.sharpe < 0 ? 'bad' : undefined} />
                <KPICard isDark={isDark} theme={theme} label="Sortino Ratio" value={globalStats.sortino === 999 ? 'MAX' : globalStats.sortino.toFixed(2)} infoDesc="Rendimento vs rischio ribassista ann." infoFormula="So = (μ / σ_down) × √(N/anno)" signal={globalStats.sortino >= 1.5 ? 'good' : globalStats.sortino < 0 ? 'bad' : undefined} />
                <KPICard isDark={isDark} theme={theme} label="Market Beta" value={globalStats.beta.toFixed(2)} infoDesc="Esposizione al rischio sistematico" infoFormula="β = Cov(R_p, R_m) / Var(R_m)" />
                <KPICard isDark={isDark} theme={theme} label="Corr. S&P500" value={globalStats.corr.toFixed(2)} infoDesc="Correlazione con il mercato" infoFormula="ρ = Cov(R_p, R_m) / (σ_p × σ_m)" />
                <KPICard isDark={isDark} theme={theme} label="Jarque-Bera" value={globalStats.jbTest.jb.toFixed(1)} subValue={globalStats.jbTest.isNormal ? 'Normale' : 'Non Normale'} infoDesc="Test normalità asintotica (χ²)" infoFormula="JB = (N/6) × (S² + K²/4)" signal={globalStats.jbTest.isNormal ? 'good' : 'bad'} />
                <KPICard isDark={isDark} theme={theme} label="And-Darling" value={globalStats.andDar.a2.toFixed(2)} subValue={globalStats.andDar.isNormal ? 'Normale' : 'Non Normale'} infoDesc="Test normalità sulle code" infoFormula="A² = -N - Σ(2i-1)/N × [ln(F_i) + ln(1-F_{N+1-i})]" signal={globalStats.andDar.isNormal ? 'good' : 'bad'} />
                <KPICard isDark={isDark} theme={theme} label="Max Consec. Win" value={globalStats.maxConsecWin} valueClass={theme.success} infoDesc="Numero massimo di vincite consecutive" infoFormula="max(streak  dove net_i > 0)" signal={globalStats.maxConsecWin >= 3 ? 'good' : undefined} />
                <KPICard isDark={isDark} theme={theme} label="Max Consec. Loss" value={globalStats.maxConsecLoss} valueClass={theme.danger} infoDesc="Numero massimo di perdite consecutive" infoFormula="max(streak  dove net_i ≤ 0)" signal={globalStats.maxConsecLoss <= 5 ? 'good' : 'bad'} />
                <KPICard isDark={isDark} theme={theme} label="Avg Settimanale" value={`€${globalStats.avgWeekly.toFixed(2)}`} infoDesc="Profitto medio per settimana" infoFormula="Σ NetWeek_i / N_settimane" signal={globalStats.avgWeekly > 0 ? 'good' : 'bad'} valueClass={globalStats.avgWeekly >= 0 ? theme.success : theme.danger} />
                <KPICard isDark={isDark} theme={theme} label="Avg Mensile" value={`€${globalStats.avgMonthly.toFixed(2)}`} infoDesc="Profitto medio per mese" infoFormula="Σ NetMonth_i / N_mesi" signal={globalStats.avgMonthly > 0 ? 'good' : 'bad'} valueClass={globalStats.avgMonthly >= 0 ? theme.success : theme.danger} />
              </div>

              <div className="flex flex-col gap-12 mb-14">
                <EquityChart data={globalStats.equitySequence} isDark={isDark} title="Equity Globale" theme={theme} spxData={spxData} initialCapital={globalStats.initialCapital} />
                <DrawdownChart data={globalStats.equitySequence} isDark={isDark} title="Drawdown Globale" theme={theme} />
              </div>

              <PnLBarCharts weeklyPnL={globalStats.weeklyPnL} monthlyPnL={globalStats.monthlyPnL} theme={theme} />

              <div className="mt-14 mb-14">
                <DayStatsCharts dayStats={globalStats.dayStats} isDark={isDark} theme={theme} />
              </div>

              <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                <CullenFreyPlot skew={globalStats.skew} kurt={globalStats.kurt} name="Globale" isDark={isDark} theme={theme} />
                <ChartDescription theme={theme} title="Cullen-Frey Plot" text="Mappa la distribuzione dei tuoi rendimenti nello spazio skewness-kurtosi. Mostra se i profitti seguono una distribuzione Normale, Lognormale, Beta, Gamma o Uniforme. Se il punto cade lontano dalla Normale i modelli basati su ipotesi gaussiane sono poco affidabili." />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                <DistributionChart data={globalStats.tradeProfits} title="Distribuzione Totale" type="all" isDark={isDark} theme={theme} />
                <DistributionChart data={globalStats.tradeProfits} title="Distribuzione (Solo Win)" type="win" isDark={isDark} theme={theme} />
                <DistributionChart data={globalStats.tradeProfits} title="Distribuzione (Solo Loss)" type="loss" isDark={isDark} theme={theme} />
              </div>
            </div>
          )}

          {/* ==== CLASSIFICA PERFORMANCE — visibile da menu 'rankings' ==== */}
          {globalStats && activeTab === 'analyzer' && analyzerView === 'rankings' && (
            <div className={`${theme.panel} rounded-lg border ${theme.border} p-10 lg:p-12 glow-panel animate-fade-in`}>
              {/* Rankings / Leaderboard */}
              {(rankings.assets.length > 0 || rankings.strategies.length > 0) && (
                <div className={`${theme.panel} border ${theme.borderLight} rounded-lg p-6 glow-panel`}>
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h3 className="font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 text-[#ffd740] font-mono">
                      <Trophy className="w-4 h-4" /> Classifica Performance
                    </h3>
                    <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-[var(--c-border)]">
                      {[
                        { key: 'week', label: 'Settimana' },
                        { key: 'month', label: 'Mese' },
                        { key: 'trimester', label: 'Trimestre' },
                        { key: 'year', label: 'Anno' },
                        { key: 'max', label: 'Max' },
                      ].map(p => (
                        <button
                          key={p.key}
                          onClick={() => setRankingPeriod(p.key)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all font-mono ${
                            rankingPeriod === p.key
                              ? 'bg-[#ffd740] text-black shadow-lg shadow-[#ffd740]/30'
                              : `${theme.textMuted} hover:text-white`
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Best Assets */}
                    {rankings.assets.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#64b5f6] mb-3 font-mono flex items-center gap-2">
                          <Award className="w-3.5 h-3.5" /> Migliori Asset
                        </h4>
                        <div className="space-y-1.5">
                          {rankings.assets.map((a, i) => (
                            <div key={a.name} className={`flex items-center justify-between px-3 py-2 rounded-md ${i === 0 ? 'bg-[#ffd740]/10 border border-[#ffd740]/20' : i === 1 ? 'bg-[#c0c0c0]/5 border border-[#c0c0c0]/10' : i === 2 ? 'bg-[#cd7f32]/5 border border-[#cd7f32]/10' : 'bg-black/20 border border-transparent'}`}>
                              <div className="flex items-center gap-3">
                                <span className={`text-[11px] font-black font-mono w-6 text-center ${i === 0 ? 'text-[#ffd740]' : i === 1 ? 'text-[#c0c0c0]' : i === 2 ? 'text-[#cd7f32]' : theme.textMuted}`}>
                                  #{i + 1}
                                </span>
                                <span className="text-[11px] font-bold font-mono text-[var(--c-text)]">{a.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[9px] font-mono text-[var(--c-muted)]">{a.trades} trades</span>
                                <span className="text-[9px] font-mono text-[var(--c-muted)]">WR {a.winRate.toFixed(0)}%</span>
                                <span className={`text-[9px] font-mono ${a.sharpe >= 1 ? 'text-[#00e676]' : a.sharpe < 0 ? 'text-[#ff1744]' : 'text-[var(--c-muted)]'}`}>SR {a.sharpe.toFixed(2)}</span>
                                <span className={`text-[11px] font-bold font-mono ${a.pnl >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
                                  {a.pnl >= 0 ? '+' : ''}€{a.pnl.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Best Strategies */}
                    {rankings.strategies.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#ce93d8] mb-3 font-mono flex items-center gap-2">
                          <Award className="w-3.5 h-3.5" /> Migliori Strategie
                        </h4>
                        <div className="space-y-1.5">
                          {rankings.strategies.map((s, i) => (
                            <div key={s.name} className={`flex items-center justify-between px-3 py-2 rounded-md ${i === 0 ? 'bg-[#ffd740]/10 border border-[#ffd740]/20' : i === 1 ? 'bg-[#c0c0c0]/5 border border-[#c0c0c0]/10' : i === 2 ? 'bg-[#cd7f32]/5 border border-[#cd7f32]/10' : 'bg-black/20 border border-transparent'}`}>
                              <div className="flex items-center gap-3">
                                <span className={`text-[11px] font-black font-mono w-6 text-center ${i === 0 ? 'text-[#ffd740]' : i === 1 ? 'text-[#c0c0c0]' : i === 2 ? 'text-[#cd7f32]' : theme.textMuted}`}>
                                  #{i + 1}
                                </span>
                                <span className="text-[11px] font-bold font-mono text-[var(--c-text)]">{s.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[9px] font-mono text-[var(--c-muted)]">{s.trades} trades</span>
                                <span className="text-[9px] font-mono text-[var(--c-muted)]">WR {s.winRate.toFixed(0)}%</span>
                                <span className={`text-[9px] font-mono ${s.sharpe >= 1 ? 'text-[#00e676]' : s.sharpe < 0 ? 'text-[#ff1744]' : 'text-[var(--c-muted)]'}`}>SR {s.sharpe.toFixed(2)}</span>
                                <span className={`text-[11px] font-bold font-mono ${s.pnl >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
                                  {s.pnl >= 0 ? '+' : ''}€{s.pnl.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analyzer' &&
            strategyStats
              .filter((s) => {
                if (analyzerView === 'global') return false;
                if (analyzerView === 'rankings') return false;
                const [kind, name] = analyzerView.split(':');
                return (kind === 'asset' && groupBy === 'Asset' && s.name === name)
                    || (kind === 'strategy' && groupBy === 'Strategy' && s.name === name);
              })
              .map((s, i) => (
              <div key={i} className={`${theme.panel} rounded-lg border ${theme.border} overflow-hidden glow-panel animate-fade-in`}>
                <div className="bg-[var(--c-card)] px-8 py-5 border-b border-[var(--c-border)] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-0.5 h-5 bg-[#ff8c00] rounded-full" />
                    <h4 className="font-bold text-sm text-[var(--c-text)] font-mono uppercase tracking-wider">{s.name}</h4>
                  </div>
                  <span className={`text-lg font-mono font-black ${s.netProfit >= 0 ? 'text-[#00e676] glow-green' : 'text-[#ff1744] glow-red'}`}>
                    {s.netProfit.toFixed(2)}
                  </span>
                </div>

                <div className="p-12 lg:p-14">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5 lg:gap-6 mb-20">
                    <KPICard isDark={isDark} theme={theme} label="Net Profit" value={`€${s.netProfit.toFixed(2)}`} valueClass={s.netProfit >= 0 ? theme.success : theme.danger} infoDesc="Profitto finale post costi" infoFormula="Net = Σ(Profit + Swap + Comm + Fee)" signal={s.netProfit > 0 ? 'good' : 'bad'} />
                    <KPICard isDark={isDark} theme={theme} label="Gross Profit" value={`+€${s.grossP.toFixed(2)}`} valueClass={theme.success} infoDesc="Somma dei trade vinti" infoFormula="Σ Profit_i  dove Profit_i > 0" />
                    <KPICard isDark={isDark} theme={theme} label="Gross Loss" value={`€${s.grossL.toFixed(2)}`} valueClass={theme.danger} infoDesc="Somma dei trade persi" infoFormula="Σ Profit_i  dove Profit_i < 0" />
                    <KPICard isDark={isDark} theme={theme} label="Costi Tot" value={`€${s.totCosti.toFixed(2)}`} valueClass="text-rose-500" infoDesc="Commissioni e Fee totali" infoFormula="Σ (Commission_i + Fee_i)" />
                    <KPICard isDark={isDark} theme={theme} label="Swap Tot" value={`€${s.totSwap.toFixed(2)}`} valueClass="text-amber-500" infoDesc="Tassi Swap Overnight" infoFormula="Σ Swap_i" />
                    <KPICard isDark={isDark} theme={theme} label="Profit Medio" value={`€${s.avgP.toFixed(2)}`} infoDesc="Expectancy per trade" infoFormula="E[X] = NetProfit / N" signal={s.avgP > 0 ? 'good' : 'bad'} />
                    <KPICard isDark={isDark} theme={theme} label="Dev. Std" value={`€${s.std.toFixed(2)}`} infoDesc="Volatilità dei ritorni" infoFormula="σ = √(Σ(x_i - μ)² / N)" />
                    <KPICard isDark={isDark} theme={theme} label="Max Drawdown" value={`€${s.maxDrawdown.toFixed(2)}`} valueClass={theme.danger} infoDesc="Peggior flessione equity" infoFormula="MDD = max(Peak_i - Equity_i)" signal="bad" />

                    <KPICard isDark={isDark} theme={theme} label="Trade Totali" value={s.count} infoDesc="Trade chiusi totali" infoFormula="N = count(MergedOut)" />
                    <KPICard isDark={isDark} theme={theme} label="Win Rate" value={`${s.winRate.toFixed(1)}%`} infoDesc="Percentuale successo" infoFormula="WR = (W / N) × 100" signal={s.winRate >= 50 ? 'good' : 'bad'} />
                    <KPICard isDark={isDark} theme={theme} label="Buy Vinti" value={s.wonBuy} valueClass={theme.success} infoDesc="Long in profitto" infoFormula="count(buy ∧ net > 0)" />
                    <KPICard isDark={isDark} theme={theme} label="Sell Vinti" value={s.wonSell} valueClass={theme.success} infoDesc="Short in profitto" infoFormula="count(sell ∧ net > 0)" />
                    <KPICard isDark={isDark} theme={theme} label="Sharpe" value={s.sharpe.toFixed(2)} infoDesc="Rendimento risk-adjusted ann." infoFormula="SR = (μ / σ) × √(N/anno)" signal={s.sharpe >= 1 ? 'good' : s.sharpe < 0 ? 'bad' : undefined} />
                    <KPICard isDark={isDark} theme={theme} label="Sortino" value={s.sortino === 999 ? 'MAX' : s.sortino.toFixed(2)} infoDesc="Rendimento vs rischio ribassista ann." infoFormula="So = (μ / σ_down) × √(N/anno)" signal={s.sortino >= 1.5 ? 'good' : s.sortino < 0 ? 'bad' : undefined} />
                    <KPICard isDark={isDark} theme={theme} label="Ulcer Idx" value={s.ulcerIndex.toFixed(2)} valueClass={theme.warning} infoDesc="Indice di stress (RMS % drawdown)" infoFormula="UI = √(Σ DD%_i² / N)" signal={s.ulcerIndex < 5 ? 'good' : 'bad'} />
                    <KPICard isDark={isDark} theme={theme} label="Beta Mkt" value={s.beta.toFixed(2)} infoDesc="Esposizione rischio sistematico" infoFormula="β = Cov(R_p, R_m) / Var(R_m)" />

                    <KPICard isDark={isDark} theme={theme} label="Corr Mkt" value={s.corr.toFixed(2)} infoDesc="Correlazione con il mercato" infoFormula="ρ = Cov(R_p, R_m) / (σ_p × σ_m)" />
                    <KPICard isDark={isDark} theme={theme} label="Avg Open" value={s.avgOpen} icon={Clock} infoDesc="Media oraria di entrata" infoFormula="mean(OpenTime_i)" />
                    <KPICard isDark={isDark} theme={theme} label="Avg Close" value={s.avgClose} icon={Clock} infoDesc="Media oraria di uscita" infoFormula="mean(CloseTime_i)" />
                    <KPICard isDark={isDark} theme={theme} label="Jarque-Bera" value={s.jbTest.jb.toFixed(1)} subValue={s.jbTest.isNormal ? 'Norm.' : 'Anomalo'} infoDesc="Test normalità asintotica (χ²)" infoFormula="JB = (N/6) × (S² + K²/4)" signal={s.jbTest.isNormal ? 'good' : 'bad'} />
                    <KPICard isDark={isDark} theme={theme} label="And-Darling" value={s.andDar.a2.toFixed(2)} subValue={s.andDar.isNormal ? 'Norm.' : 'Anomalo'} infoDesc="Test normalità sulle code" infoFormula="A² = -N - Σ(2i-1)/N × [ln(F_i) + ln(1-F_{N+1-i})]" signal={s.andDar.isNormal ? 'good' : 'bad'} />
                    <KPICard isDark={isDark} theme={theme} label="Max Consec. Win" value={s.maxConsecWin} valueClass={theme.success} infoDesc="Vincite consecutive massime" infoFormula="max(streak  dove net_i > 0)" signal={s.maxConsecWin >= 3 ? 'good' : undefined} />
                    <KPICard isDark={isDark} theme={theme} label="Max Consec. Loss" value={s.maxConsecLoss} valueClass={theme.danger} infoDesc="Perdite consecutive massime" infoFormula="max(streak  dove net_i ≤ 0)" signal={s.maxConsecLoss <= 5 ? 'good' : 'bad'} />
                    <KPICard isDark={isDark} theme={theme} label="Avg Settimanale" value={`€${s.avgWeekly.toFixed(2)}`} infoDesc="Profitto medio per settimana" infoFormula="Σ NetWeek_i / N_settimane" signal={s.avgWeekly > 0 ? 'good' : 'bad'} valueClass={s.avgWeekly >= 0 ? theme.success : theme.danger} />
                    <KPICard isDark={isDark} theme={theme} label="Avg Mensile" value={`€${s.avgMonthly.toFixed(2)}`} infoDesc="Profitto medio per mese" infoFormula="Σ NetMonth_i / N_mesi" signal={s.avgMonthly > 0 ? 'good' : 'bad'} valueClass={s.avgMonthly >= 0 ? theme.success : theme.danger} />
                  </div>

                  <div className="flex flex-col gap-16 mb-20">
                    <EquityChart data={s.equitySequence} isDark={isDark} title={`Equity Line (${s.name})`} theme={theme} spxData={spxData} initialCapital={s.initialCapital} />
                    <DrawdownChart data={s.equitySequence} isDark={isDark} title={`Drawdown (${s.name})`} theme={theme} />
                  </div>

                  <PnLBarCharts weeklyPnL={s.weeklyPnL} monthlyPnL={s.monthlyPnL} theme={theme} />

                  <div className="mt-20 mb-20">
                    <DayStatsCharts dayStats={s.dayStats} isDark={isDark} theme={theme} />
                  </div>

                  <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    <CullenFreyPlot skew={s.skew} kurt={s.kurt} name={s.name} isDark={isDark} theme={theme} />
                    <ChartDescription theme={theme} title="Cullen-Frey Plot" text="Mappa la distribuzione dei rendimenti nello spazio skewness-kurtosi. Mostra se i profitti seguono una Normale, Lognormale, Beta, Gamma o Uniforme." />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
                    <DistributionChart data={s.tradeProfits} title={`Distribuzione Totale (${s.name})`} type="all" isDark={isDark} theme={theme} />
                    <DistributionChart data={s.tradeProfits} title={`Distribuzione Solo Win (${s.name})`} type="win" isDark={isDark} theme={theme} />
                    <DistributionChart data={s.tradeProfits} title={`Distribuzione Solo Loss (${s.name})`} type="loss" isDark={isDark} theme={theme} />
                  </div>
                </div>
              </div>
            ))}

          {activeTab === 'analyzer' && analyzerView === 'global' && analyzedTrades.length > 0 && (
            <div className={`${theme.panel} rounded-lg border ${theme.border} p-10 lg:p-12 glow-panel animate-fade-in`}>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1 h-6 bg-[#ff8c00] rounded-full" />
                <Grid className="w-5 h-5 text-[#ff8c00]" />
                <h3 className="text-xs font-bold text-[#ff8c00] uppercase tracking-[0.2em] font-mono glow-orange">
                  CORRELATION MATRIX
                </h3>
              </div>

              <p className="text-[var(--c-muted)] text-[10px] mb-10 font-mono tracking-wide leading-6">
                Pearson correlation on daily net returns. Shows mathematical divergences between grouped entities.
              </p>

              <CorrelationHeatmap data={correlationData} isDark={isDark} theme={theme} />
            </div>
          )}

          {activeTab === 'analyzer' && analyzerView === 'global' && (monteCarloData || isMcLoading) && (
            <div className={`${theme.panel} rounded-lg border ${theme.border} p-10 lg:p-12 glow-panel animate-fade-in`}>
              <div className="flex justify-between items-center mb-10 border-b border-[var(--c-border)] pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-[#ff8c00] rounded-full" />
                  <Shuffle className="w-5 h-5 text-[#ff8c00]" />
                  <h3 className="text-xs font-bold text-[#ff8c00] uppercase tracking-[0.2em] font-mono glow-orange">
                    MONTE CARLO SIMULATION
                  </h3>
                  {isMcLoading && (
                    <span className="text-[10px] font-mono text-[#ff8c00] uppercase tracking-widest animate-pulse">
                      Computing...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold ${theme.textMuted}`}>Iterazioni:</span>
                  <select
                    value={mcIterations}
                    onChange={e => setMcIterations(Number(e.target.value))}
                    className={`p-2 rounded text-xs font-bold border outline-none cursor-pointer transition-colors ${theme.input} hover:border-white`}
                  >
                    <option value={10}>10 Percorsi</option>
                    <option value={25}>25 Percorsi</option>
                    <option value={50}>50 Percorsi</option>
                  </select>
                </div>
              </div>

              {monteCarloData && (
                <>
                  <p className={`${theme.textMuted} text-xs mb-10 font-mono leading-6`}>
                    Questo strumento simula {monteCarloData.iterations} futuri percorsi di equity basandosi sull&apos;estrazione casuale
                    (con reinserimento) dei tuoi {analyzedTrades.filter(t => t.IsMergedOut).length} trades storici analizzati.
                    La linea grossa tratteggiata rappresenta la Media Matematica calcolata.
                  </p>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-12">
                    <KPICard isDark={isDark} theme={theme} label="Iterazioni Simulate" value={monteCarloData.iterations} />
                    <KPICard isDark={isDark} theme={theme} label="Trade per Simulazione" value={analyzedTrades.filter(t => t.IsMergedOut).length} />
                    <KPICard
                      isDark={isDark}
                      theme={theme}
                      label="Prob. di Profitto"
                      value={`${monteCarloData.probProfit.toFixed(1)}%`}
                      valueClass={monteCarloData.probProfit > 80 ? theme.success : theme.danger}
                      infoDesc="Percentuale di simulazioni che terminano con saldo positivo"
                    />
                    <KPICard
                      isDark={isDark}
                      theme={theme}
                      label="PNL Medio Finale"
                      value={monteCarloData.avgEnd.toFixed(2)}
                      valueClass={monteCarloData.avgEnd >= 0 ? theme.success : theme.danger}
                      infoDesc="Il valore di arrivo matematicamente calcolato della media di tutte le simulazioni"
                    />
                  </div>

                  <div className="h-[560px] mt-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monteCarloData.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.chart.grid} />
                        <XAxis dataKey="trade" stroke={theme.chart.axis} />
                        <YAxis stroke={theme.chart.axis} />
                        <Tooltip
                          content={<MonteCarloTooltip theme={theme} hoveredKey={hoveredRunKey} />}
                          cursor={{ stroke: theme.chart.axis, strokeWidth: 1 }}
                        />

                        {Array.from({ length: Math.min(monteCarloData.iterations, 50) }).map((_, i) => {
                          const key = `run${i}`;
                          const isHovered = hoveredRunKey === key;
                          return (
                            <Line
                              key={i}
                              type="monotone"
                              dataKey={key}
                              stroke={dynLineColors[i % dynLineColors.length]}
                              strokeWidth={isHovered ? 2.5 : 1}
                              dot={false}
                              opacity={isHovered ? 1 : 0.15}
                              isAnimationActive={false}
                              activeDot={{ r: 4, strokeWidth: 0 }}
                              onMouseEnter={() => setHoveredRunKey(key)}
                              onMouseLeave={() => setHoveredRunKey(null)}
                            />
                          );
                        })}

                        <Line
                          type="monotone"
                          dataKey="average"
                          stroke={theme.accent2}
                          strokeWidth={5}
                          strokeDasharray="10 5"
                          dot={false}
                          isAnimationActive={false}
                          name="MEDIA (Valore Atteso)"
                          onMouseEnter={() => setHoveredRunKey('average')}
                          onMouseLeave={() => setHoveredRunKey(null)}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'regime' && <MarketRegime isDark={isDark} theme={theme} setActiveTab={setActiveTab} />}

          {activeTab === 'themes' && <MarketThemes isDark={isDark} theme={theme} />}

          {activeTab === 'volatility' && <VolatilityRegime isDark={isDark} theme={theme} />}

          {activeTab === 'analysts' && <AnalystEstimates isDark={isDark} theme={theme} />}

          {activeTab === 'accounts' && <TradingAccounts isDark={isDark} theme={theme} />}

          {activeTab === 'researcher' && <Researcher isDark={isDark} theme={theme} />}

          {activeTab === 'descrizione' && <ChiSono theme={theme} />}

          {activeTab === 'news' && <ComeFunziona theme={theme} />}
          </div>
        </div>
      </main>
    </div>
  );
}

function RowRangeModal({ totalRows, onConfirm }) {
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');

  const dataRows = Math.max(0, totalRows - 10);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(start || '', end || '');
  };

  return (
    <div className="fixed inset-0 z-[9000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-[var(--c-panel)] border border-[var(--c-border)] rounded-lg shadow-2xl overflow-hidden glow-panel">
        <div className="px-7 py-6 border-b border-[var(--c-border)]">
          <div className="flex items-center gap-2 mb-2">
            <TableIcon className="w-4 h-4 text-[#ff8c00]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8c00] font-mono glow-orange">
              ROW SELECTION
            </span>
          </div>

          <h2 className="text-sm font-bold text-[var(--c-text)] font-mono mt-2">
            Select analysis range
          </h2>

          <p className="text-[10px] text-[var(--c-muted)] mt-2 font-mono">
            Loaded file — <span className="text-[#ff8c00]">{dataRows}</span> data rows available
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.15em] font-semibold text-[var(--c-muted)] mb-2 font-mono">
                From row
              </label>
              <input
                type="number"
                min="1"
                placeholder="Start (e.g. 1)"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full h-11 px-3 rounded text-sm border border-[var(--c-border)] bg-[#000000] text-[var(--c-text)] focus:border-[#ff8c00]/40 focus:outline-none transition-colors font-mono placeholder:text-[#2d3a4a]"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-[0.15em] font-semibold text-[var(--c-muted)] mb-2 font-mono">
                To row
              </label>
              <input
                type="number"
                min="1"
                placeholder={`End (e.g. ${dataRows || '...'})`}
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full h-11 px-3 rounded text-sm border border-[var(--c-border)] bg-[#000000] text-[var(--c-text)] focus:border-[#ff8c00]/40 focus:outline-none transition-colors font-mono placeholder:text-[#2d3a4a]"
              />
            </div>
          </div>

          <p className="text-[10px] text-[var(--c-muted)] font-mono leading-5">
            Leave empty to include all available rows.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3.5 rounded text-xs font-bold uppercase tracking-[0.15em] bg-[#ff8c00] hover:bg-[#ff9f1c] text-black border border-[#ff8c00]/60 transition-all font-mono shadow-lg shadow-[#ff8c00]/15"
            >
              CONFIRM &amp; ANALYZE
            </button>

            <button
              type="button"
              onClick={() => onConfirm('', '')}
              className="px-5 py-3.5 rounded text-xs font-bold font-mono uppercase tracking-wider text-[var(--c-muted)] hover:text-[#ff8c00] border border-[var(--c-border)] hover:border-[#ff8c00]/20 bg-transparent transition-all"
            >
              ALL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}