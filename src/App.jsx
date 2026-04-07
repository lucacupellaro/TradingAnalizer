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
import { Info, Globe, TableIcon, ChevronUp, ChevronDown, Grid, Shuffle, Clock, Upload, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChiSono from './pages/ChiSono';

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

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('analyzer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingRows, setPendingRows] = useState(null);
  const [confirmedRows, setConfirmedRows] = useState([]);

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

    let netProfit = 0, pkEq = 0, mxDD = 0, sumSqDD = 0, grossP = 0, grossL = 0, totCosti = 0, totSwap = 0;
    let curEq = 0, wonBuy = 0, wonSell = 0;
    let maxConsecLoss = 0, curConsecLoss = 0;
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
        } else {
          curConsecLoss = 0;
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
          sumSqDD += Math.pow(pkEq - curEq, 2);
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
    const sortino = downDev > 0 ? avgP / downDev : avgP > 0 ? 999 : 0;

    const { beta, corr } = calcBetaCorr(pDly, spxData);
    const { skew, kurt } = skewnessAndKurtosis(pOnly, avgP, std);
    const jbTest = jarqueBeraTest(cC, skew, kurt);
    const andDar = adTest(pOnly, avgP, std);

    return {
      netProfit,
      rawProfit: netProfit - totCosti,
      grossP,
      grossL,
      totCosti,
      totSwap,
      sharpe: std > 0 ? avgP / std : 0,
      sortino,
      maxDrawdown: mxDD,
      ulcerIndex: Math.sqrt(sumSqDD / cC),
      winRate: (wns.length / cC) * 100,
      profitFactor: pf,
      avgProfit: avgP,
      stdDev: std,
      completedCount: cC,
      wonCount: wns.length,
      lostCount: lss.length,
      wonBuy,
      wonSell,
      dayStats: calculateDayStats(tDets),
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
        let curEq = 0, pkEq = 0, mxDD = 0, sumSqDD = 0, netProfit = 0, grossP = 0, grossL = 0, sC = 0, sSwap = 0;
        let wonBuy = 0, wonSell = 0, maxConsecLoss = 0, curConsecLoss = 0;
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
          } else {
            curConsecLoss = 0;
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
            sumSqDD += Math.pow(pkEq - curEq, 2);
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
        const ulcerIndex = c > 0 ? Math.sqrt(sumSqDD / c) : 0;
        const { beta, corr } = calcBetaCorr(pDly, spxData);
        const { skew, kurt } = skewnessAndKurtosis(pOnly, avgP, std);
        const jbTest = jarqueBeraTest(c, skew, kurt);
        const andDar = adTest(pOnly, avgP, std);

        return {
          name,
          count: c,
          winRate: c > 0 ? (wns.length / c) * 100 : 0,
          wonCount: wns.length,
          lostCount: lss.length,
          wonBuy,
          wonSell,
          sharpe: std > 0 ? avgP / std : 0,
          sortino: downDev > 0 ? avgP / downDev : 999,
          maxDrawdown: mxDD,
          netProfit,
          grossP,
          grossL,
          totCosti: sC,
          totSwap: sSwap,
          avgP,
          std,
          ulcerIndex,
          beta,
          corr,
          skew,
          kurt,
          jbTest,
          andDar,
          tradeProfits: pOnly,
          profitFactor: Math.abs(grossL) > 0 ? grossP / Math.abs(grossL) : 999,
          equitySequence: eqSeq,
          dayStats: calculateDayStats(tDets),
          avgOpen: getAvgTimeStr(opTs),
          avgClose: getAvgTimeStr(clTs),
          maxConsecLoss,
        };
      })
      .sort((a, b) => b.netProfit - a.netProfit);
  }, [analyzedTrades, groupBy, spxData]);

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
    <div className={`w-full min-h-screen ${theme.bg} ${theme.text} font-sans bloomberg-scanline`}>
      <style>{marqueeStyle}</style>

      <AnalysisLoader
        isAnalyzing={isAnalyzing}
        formulaIdx={formulaIdx}
        isDark={isDark}
        theme={theme}
        rowStart={tableFilters.rowStart}
        rowEnd={tableFilters.rowEnd}
      />

      {!authState.isAuthenticated && <LoginModal {...authState} theme={theme} />}

      {pendingRows && (
        <RowRangeModal totalRows={pendingRows.length} onConfirm={handleRowConfirm} />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => authState.setIsAuthenticated(false)}
      />

      <div className="sticky top-0 z-[100]">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1400px] px-8 lg:px-16 xl:px-20">
            <MarketTicker marketQuotes={marketQuotes} isDark={isDark} theme={theme} />
            <Navbar
              isDark={isDark}
              setIsDark={setIsDark}
              isLoading={isLoading}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              onFileUpload={handleFileUpload}
            />
          </div>
        </div>
      </div>

      <main className="w-full flex justify-center py-12 pb-28">
        <div className="w-full max-w-[1400px] px-8 lg:px-16 xl:px-20 py-12 space-y-16 pb-28">
          {parsedTrades.length === 0 && confirmedRows.length === 0 && activeTab === 'analyzer' && (
            <div className="flex flex-col items-center justify-center min-h-[62vh] text-center gap-8 animate-fade-in">
              <BarChart2 className="w-20 h-20 text-[#ff8c00] opacity-20" />
              <div>
                <h2 className="text-3xl font-black mb-3 text-[#e2e8f0] font-mono tracking-tight">
                  Nessun Report Caricato
                </h2>
                <p className="text-[#4a5568] text-sm max-w-md mx-auto font-mono leading-6">
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
              <BarChart2 className="w-16 h-16 text-[#ff8c00] opacity-30" />
              <div>
                <h2 className="text-2xl font-black mb-3 text-[#e2e8f0] font-mono tracking-tight">
                  Nessun Trade nel Range
                </h2>
                <p className="text-[#4a5568] text-sm max-w-md mx-auto font-mono leading-6">
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

          {parsedTrades.length > 0 && activeTab === 'analyzer' && (
            <div className="rounded-lg border border-[#1a2332] bg-[#0d1117] overflow-hidden glow-panel animate-fade-in">
              <div
                className="flex items-center justify-between px-8 py-4.5 border-b border-[#1a2332] cursor-pointer select-none hover:bg-[#111824]/50 transition-colors"
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

                <button className="p-2.5 rounded text-[#4a5568] hover:text-[#ff8c00] hover:bg-[#ff8c00]/5 transition-all">
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
                              className="w-full h-10 px-3 rounded text-xs border border-[#1a2332] bg-[#000000] text-[#8b9dc3] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
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
                              className="w-full h-10 px-3 rounded text-xs border border-[#1a2332] bg-[#000000] text-[#8b9dc3] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
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
                              className="w-full h-10 px-3 rounded text-xs border border-[#1a2332] bg-[#000000] text-[#8b9dc3] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
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
                              className="w-full h-10 px-3 rounded text-xs border border-[#1a2332] bg-[#000000] text-[#8b9dc3] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
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
                              className="w-full h-10 px-3 rounded text-xs border border-[#1a2332] bg-[#000000] text-[#8b9dc3] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
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
                              className="w-full h-10 px-3 rounded text-xs border border-[#1a2332] bg-[#000000] text-[#8b9dc3] font-mono focus:border-[#ff8c00]/40 focus:outline-none transition-colors"
                              value={tableFilters.rowEnd || ''}
                              onChange={e => setTableFilters({ ...tableFilters, rowEnd: e.target.value || '' })}
                            />
                          )
                        },
                      ].map(({ label, node }) => (
                        <div key={label}>
                          <label className="block text-[9px] uppercase tracking-[0.15em] font-semibold text-[#4a5568] mb-2 font-mono">
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

                          <div className="flex flex-wrap gap-2 p-4 rounded border border-[#1a2332] bg-[#000000]/60 min-h-[56px] max-h-32 overflow-y-auto">
                            {items.map(s => (
                              <button
                                key={s}
                                onClick={() => onToggle(s)}
                                className={`px-3 py-2 rounded text-xs font-mono font-semibold transition-all border ${
                                  selected.includes(s)
                                    ? 'bg-[#ff8c00]/15 text-[#ff8c00] border-[#ff8c00]/30'
                                    : 'bg-transparent text-[#4a5568] border-[#1a2332] hover:text-[#8b9dc3] hover:border-[#2d3a4a]'
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

                  <div className="rounded-lg border border-[#1a2332] overflow-hidden">
                    <div className="overflow-x-auto">
                      <div className="overflow-y-auto max-h-[560px]">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead className="sticky top-0 z-10 bg-[#111824]">
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
                                  className={`px-4 py-3.5 text-[9px] uppercase tracking-[0.15em] font-semibold text-[#4a5568] border-b border-[#1a2332] whitespace-nowrap ${
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
                                  className="hover:bg-[#111824]/60 transition-colors duration-100 group"
                                >
                                  <td className="px-4 py-3 text-[#4a5568] whitespace-nowrap">
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

                                  <td className="px-4 py-3 font-bold text-[#e2e8f0]">{t.Symbol}</td>
                                  <td className="px-4 py-3 text-[#4a5568] max-w-[180px] truncate">{t.Id}</td>

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

          {globalStats && activeTab === 'analyzer' && (
            <div className={`${theme.panel} rounded-lg border ${theme.border} p-10 lg:p-12 glow-panel animate-fade-in`}>
              <div className="flex items-center gap-3 mb-14">
                <div className="w-1 h-6 bg-[#ff8c00] rounded-full" />
                <h3 className="text-sm font-bold text-[#ff8c00] uppercase tracking-[0.2em] font-mono glow-orange">
                  GLOBAL STATISTICS
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5 lg:gap-6 mb-16">
                <KPICard isDark={isDark} theme={theme} label="Net Profit" value={globalStats.netProfit.toFixed(2)} valueClass={globalStats.netProfit >= 0 ? theme.success : theme.danger} infoDesc="Profitto finale post costi" infoFormula="Net = Gross + Swap + Commissioni" />
                <KPICard isDark={isDark} theme={theme} label="Gross Profit" value={`+${globalStats.grossP.toFixed(2)}`} valueClass={theme.success} infoDesc="Somma dei trade vinti" infoFormula="Σ Profitti (>0)" />
                <KPICard isDark={isDark} theme={theme} label="Gross Loss" value={globalStats.grossL.toFixed(2)} valueClass={theme.danger} infoDesc="Somma dei trade persi" infoFormula="Σ Perdite (<0)" />
                <KPICard isDark={isDark} theme={theme} label="Costi (Comm)" value={globalStats.totCosti.toFixed(2)} valueClass="text-rose-500" infoDesc="Commissioni e Fee" infoFormula="Σ (Commissioni + Fee)" />
                <KPICard isDark={isDark} theme={theme} label="Costi (Swap)" value={globalStats.totSwap.toFixed(2)} valueClass="text-amber-500" infoDesc="Tassi Swap Overnight" infoFormula="Σ Swap" />
                <KPICard isDark={isDark} theme={theme} label="Profit Medio" value={globalStats.avgProfit.toFixed(2)} infoDesc="Expectancy per trade" infoFormula="Net / N. Trade" />
                <KPICard isDark={isDark} theme={theme} label="Dev. Standard" value={globalStats.stdDev.toFixed(2)} infoDesc="Volatilità ritorni" infoFormula="σ" />
                <KPICard isDark={isDark} theme={theme} label="Profit Factor" value={globalStats.profitFactor === 999 ? 'MAX' : globalStats.profitFactor.toFixed(2)} infoDesc="Rapporto vincite/perdite assolute" infoFormula="GrossP / |GrossL|" />

                <KPICard isDark={isDark} theme={theme} label="Trade Totali" value={globalStats.completedCount} infoDesc="Numero ordini totali" />
                <KPICard isDark={isDark} theme={theme} label="Trade Vinti" value={globalStats.wonCount} valueClass={theme.success} />
                <KPICard isDark={isDark} theme={theme} label="Trade Persi" value={globalStats.lostCount} valueClass={theme.danger} />
                <KPICard isDark={isDark} theme={theme} label="Win Rate" value={`${globalStats.winRate.toFixed(1)}%`} infoDesc="Percentuale successo" infoFormula="(Vinti / Totali)*100" />
                <KPICard isDark={isDark} theme={theme} label="Buy Vinti" value={globalStats.wonBuy} valueClass={theme.success} infoDesc="Numero di operazioni Long in profitto" />
                <KPICard isDark={isDark} theme={theme} label="Sell Vinti" value={globalStats.wonSell} valueClass={theme.danger} infoDesc="Numero di operazioni Short in profitto" />
                <KPICard isDark={isDark} theme={theme} label="Avg Open Time" value={globalStats.avgOpen} icon={Clock} infoDesc="Media oraria di entrata" />
                <KPICard isDark={isDark} theme={theme} label="Avg Close Time" value={globalStats.avgClose} icon={Clock} infoDesc="Media oraria di uscita" />

                <KPICard isDark={isDark} theme={theme} label="Max Drawdown" value={globalStats.maxDrawdown.toFixed(2)} valueClass={theme.danger} infoDesc="Peggior flessione equity" />
                <KPICard isDark={isDark} theme={theme} label="Ulcer Index" value={globalStats.ulcerIndex.toFixed(2)} valueClass={theme.warning} infoDesc="Indice di stress (profondità/durata DD)" />
                <KPICard isDark={isDark} theme={theme} label="Sharpe Ratio" value={globalStats.sharpe.toFixed(2)} infoDesc="Rendimento vs Rischio Totale" />
                <KPICard isDark={isDark} theme={theme} label="Sortino Ratio" value={globalStats.sortino === 999 ? 'MAX' : globalStats.sortino.toFixed(2)} infoDesc="Rendimento vs Rischio Ribassista" />
                <KPICard isDark={isDark} theme={theme} label="Market Beta" value={globalStats.beta.toFixed(2)} infoDesc="Esposizione rischio sistematico Mkt" />
                <KPICard isDark={isDark} theme={theme} label="Corr. S&P500" value={globalStats.corr.toFixed(2)} infoDesc="Direzionalità rispetto al mercato" />
                <KPICard isDark={isDark} theme={theme} label="Jarque-Bera" value={globalStats.jbTest.jb.toFixed(1)} subValue={globalStats.jbTest.isNormal ? 'Normale' : 'Non Normale'} infoDesc="Test di Normalità asintotica (Chi-Square)" infoFormula="JB = (N/6)*(S² + K²/4)" />
                <KPICard isDark={isDark} theme={theme} label="And-Darling" value={globalStats.andDar.a2.toFixed(2)} subValue={globalStats.andDar.isNormal ? 'Normale' : 'Non Normale'} infoDesc="Test Normalità sulle code" />
                <KPICard isDark={isDark} theme={theme} label="Max Consec. Loss" value={globalStats.maxConsecLoss} valueClass={theme.danger} infoDesc="Numero massimo di perdite consecutive" />
              </div>

              <div className="flex flex-col gap-12 mb-14">
                <EquityChart data={globalStats.equitySequence} isDark={isDark} title="Equity Globale" theme={theme} />
                <DrawdownChart data={globalStats.equitySequence} isDark={isDark} title="Drawdown Globale" theme={theme} />
              </div>

              <div className="mt-14 mb-14">
                <DayStatsCharts dayStats={globalStats.dayStats} isDark={isDark} theme={theme} />
              </div>

              <div className="flex flex-col gap-16 mt-16">
                <CullenFreyPlot skew={globalStats.skew} kurt={globalStats.kurt} name="Globale" isDark={isDark} theme={theme} />
                <DistributionChart data={globalStats.tradeProfits} title="Distribuzione Totale" type="all" isDark={isDark} theme={theme} />
                <DistributionChart data={globalStats.tradeProfits} title="Distribuzione (Solo Win)" type="win" isDark={isDark} theme={theme} />
                <DistributionChart data={globalStats.tradeProfits} title="Distribuzione (Solo Loss)" type="loss" isDark={isDark} theme={theme} />
              </div>

              <div className="flex justify-between items-center mb-8 mt-16 border-b pb-6 border-[#1a2332]">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-[#ff8c00] rounded-full" />
                  <h2 className="text-xs font-bold text-[#ff8c00] uppercase tracking-[0.2em] font-mono glow-orange">
                    PERFORMANCE BREAKDOWN
                  </h2>
                </div>

                <div className="flex bg-[#000000] border border-[#1a2332] rounded-xl p-2 gap-3">
                  <button
                    onClick={() => setGroupBy('Strategy')}
                    className={`flex items-center justify-center px-7 h-12 rounded-lg text-sm font-bold font-mono uppercase tracking-[0.15em] transition-all ${
                      groupBy === 'Strategy'
                        ? 'bg-[#ff8c00] text-black shadow-lg shadow-[#ff8c00]/40 scale-105'
                        : 'text-[#4a5568] hover:text-[#ff8c00] hover:bg-[#ff8c00]/10'
                    }`}
                  >
                    Strategy
                  </button>

                  <button
                    onClick={() => setGroupBy('Asset')}
                    className={`flex items-center justify-center px-7 h-12 rounded-lg text-sm font-bold font-mono uppercase tracking-[0.15em] transition-all ${
                      groupBy === 'Asset'
                        ? 'bg-[#ff8c00] text-black shadow-lg shadow-[#ff8c00]/40 scale-105'
                        : 'text-[#4a5568] hover:text-[#ff8c00] hover:bg-[#ff8c00]/10'
                    }`}
                  >
                    Asset
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analyzer' &&
            strategyStats.map((s, i) => (
              <div key={i} className={`${theme.panel} rounded-lg border ${theme.border} overflow-hidden glow-panel animate-fade-in`}>
                <div className="bg-[#111824] px-8 py-5 border-b border-[#1a2332] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-0.5 h-5 bg-[#ff8c00] rounded-full" />
                    <h4 className="font-bold text-sm text-[#e2e8f0] font-mono uppercase tracking-wider">{s.name}</h4>
                  </div>
                  <span className={`text-lg font-mono font-black ${s.netProfit >= 0 ? 'text-[#00e676] glow-green' : 'text-[#ff1744] glow-red'}`}>
                    {s.netProfit.toFixed(2)}
                  </span>
                </div>

                <div className="p-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5 lg:gap-6 mb-14">
                    <KPICard isDark={isDark} theme={theme} label="Net Profit" value={s.netProfit.toFixed(2)} valueClass={s.netProfit >= 0 ? theme.success : theme.danger} />
                    <KPICard isDark={isDark} theme={theme} label="Gross Profit" value={`+${s.grossP.toFixed(2)}`} valueClass={theme.success} />
                    <KPICard isDark={isDark} theme={theme} label="Gross Loss" value={s.grossL.toFixed(2)} valueClass={theme.danger} />
                    <KPICard isDark={isDark} theme={theme} label="Costi Tot" value={s.totCosti.toFixed(2)} valueClass="text-rose-500" />
                    <KPICard isDark={isDark} theme={theme} label="Swap Tot" value={s.totSwap.toFixed(2)} valueClass="text-amber-500" />
                    <KPICard isDark={isDark} theme={theme} label="Profit Medio" value={s.avgP.toFixed(2)} />
                    <KPICard isDark={isDark} theme={theme} label="Dev. Std" value={s.std.toFixed(2)} />
                    <KPICard isDark={isDark} theme={theme} label="Max Drawdown" value={s.maxDrawdown.toFixed(2)} valueClass={theme.danger} />

                    <KPICard isDark={isDark} theme={theme} label="Trade Totali" value={s.count} />
                    <KPICard isDark={isDark} theme={theme} label="Win Rate" value={`${s.winRate.toFixed(1)}%`} />
                    <KPICard isDark={isDark} theme={theme} label="Buy Vinti" value={s.wonBuy} valueClass={theme.success} />
                    <KPICard isDark={isDark} theme={theme} label="Sell Vinti" value={s.wonSell} valueClass={theme.danger} />
                    <KPICard isDark={isDark} theme={theme} label="Sharpe" value={s.sharpe.toFixed(2)} />
                    <KPICard isDark={isDark} theme={theme} label="Sortino" value={s.sortino === 999 ? 'MAX' : s.sortino.toFixed(2)} />
                    <KPICard isDark={isDark} theme={theme} label="Ulcer Idx" value={s.ulcerIndex.toFixed(2)} valueClass={theme.warning} />
                    <KPICard isDark={isDark} theme={theme} label="Beta Mkt" value={s.beta.toFixed(2)} />

                    <KPICard isDark={isDark} theme={theme} label="Corr Mkt" value={s.corr.toFixed(2)} />
                    <KPICard isDark={isDark} theme={theme} label="Avg Open" value={s.avgOpen} icon={Clock} />
                    <KPICard isDark={isDark} theme={theme} label="Avg Close" value={s.avgClose} icon={Clock} />
                    <KPICard isDark={isDark} theme={theme} label="Jarque-Bera" value={s.jbTest.jb.toFixed(1)} subValue={s.jbTest.isNormal ? 'Norm.' : 'Anomalo'} />
                    <KPICard isDark={isDark} theme={theme} label="And-Darling" value={s.andDar.a2.toFixed(2)} subValue={s.andDar.isNormal ? 'Norm.' : 'Anomalo'} />
                    <KPICard isDark={isDark} theme={theme} label="Max Consec. Loss" value={s.maxConsecLoss} valueClass={theme.danger} infoDesc="Perdite consecutive massime" />
                  </div>

                  <div className="flex flex-col gap-12 mb-14">
                    <EquityChart data={s.equitySequence} isDark={isDark} title={`Equity Line (${s.name})`} theme={theme} />
                    <DrawdownChart data={s.equitySequence} isDark={isDark} title={`Drawdown (${s.name})`} theme={theme} />
                  </div>

                  <div className="mt-14 mb-14">
                    <DayStatsCharts dayStats={s.dayStats} isDark={isDark} theme={theme} />
                  </div>

                  <div className="flex flex-col gap-16 mt-16">
                    <CullenFreyPlot skew={s.skew} kurt={s.kurt} name={s.name} isDark={isDark} theme={theme} />
                    <DistributionChart data={s.tradeProfits} title={`Distribuzione Totale (${s.name})`} type="all" isDark={isDark} theme={theme} />
                    <DistributionChart data={s.tradeProfits} title={`Distribuzione Solo Win (${s.name})`} type="win" isDark={isDark} theme={theme} />
                    <DistributionChart data={s.tradeProfits} title={`Distribuzione Solo Loss (${s.name})`} type="loss" isDark={isDark} theme={theme} />
                  </div>
                </div>
              </div>
            ))}

          {activeTab === 'analyzer' && analyzedTrades.length > 0 && (
            <div className={`${theme.panel} rounded-lg border ${theme.border} p-10 lg:p-12 glow-panel animate-fade-in`}>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1 h-6 bg-[#ff8c00] rounded-full" />
                <Grid className="w-5 h-5 text-[#ff8c00]" />
                <h3 className="text-xs font-bold text-[#ff8c00] uppercase tracking-[0.2em] font-mono glow-orange">
                  CORRELATION MATRIX
                </h3>
              </div>

              <p className="text-[#4a5568] text-[10px] mb-10 font-mono tracking-wide leading-6">
                Pearson correlation on daily net returns. Shows mathematical divergences between grouped entities.
              </p>

              <CorrelationHeatmap data={correlationData} isDark={isDark} theme={theme} />
            </div>
          )}

          {activeTab === 'analyzer' && (monteCarloData || isMcLoading) && (
            <div className={`${theme.panel} rounded-lg border ${theme.border} p-10 lg:p-12 glow-panel animate-fade-in`}>
              <div className="flex justify-between items-center mb-10 border-b border-[#1a2332] pb-6">
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

          {activeTab === 'descrizione' && <ChiSono theme={theme} />}

          {activeTab === 'news' && (
            <div className={`${theme.panel} rounded-lg border ${theme.border} p-10 text-center glow-panel animate-fade-in`}>
              <Globe className="w-12 h-12 mx-auto mb-5 text-[#ff8c00]" />
              <h2 className="text-xl font-black mb-5 text-[#e2e8f0] font-mono uppercase tracking-wider">
                Market News Feed
              </h2>
              <p className="text-[#4a5568] max-w-2xl mx-auto font-mono text-sm leading-6">
                Module under construction.
              </p>
            </div>
          )}
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
      <div className="w-full max-w-md bg-[#0d1117] border border-[#1a2332] rounded-lg shadow-2xl overflow-hidden glow-panel">
        <div className="px-7 py-6 border-b border-[#1a2332]">
          <div className="flex items-center gap-2 mb-2">
            <TableIcon className="w-4 h-4 text-[#ff8c00]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8c00] font-mono glow-orange">
              ROW SELECTION
            </span>
          </div>

          <h2 className="text-sm font-bold text-[#e2e8f0] font-mono mt-2">
            Select analysis range
          </h2>

          <p className="text-[10px] text-[#4a5568] mt-2 font-mono">
            Loaded file — <span className="text-[#ff8c00]">{dataRows}</span> data rows available
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.15em] font-semibold text-[#4a5568] mb-2 font-mono">
                From row
              </label>
              <input
                type="number"
                min="1"
                placeholder="Start (e.g. 1)"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full h-11 px-3 rounded text-sm border border-[#1a2332] bg-[#000000] text-[#e2e8f0] focus:border-[#ff8c00]/40 focus:outline-none transition-colors font-mono placeholder:text-[#2d3a4a]"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-[0.15em] font-semibold text-[#4a5568] mb-2 font-mono">
                To row
              </label>
              <input
                type="number"
                min="1"
                placeholder={`End (e.g. ${dataRows || '...'})`}
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full h-11 px-3 rounded text-sm border border-[#1a2332] bg-[#000000] text-[#e2e8f0] focus:border-[#ff8c00]/40 focus:outline-none transition-colors font-mono placeholder:text-[#2d3a4a]"
              />
            </div>
          </div>

          <p className="text-[10px] text-[#4a5568] font-mono leading-5">
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
              className="px-5 py-3.5 rounded text-xs font-bold font-mono uppercase tracking-wider text-[#4a5568] hover:text-[#ff8c00] border border-[#1a2332] hover:border-[#ff8c00]/20 bg-transparent transition-all"
            >
              ALL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}