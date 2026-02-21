import React, { useState, useMemo } from 'react';
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
import { Info, Globe, TableIcon, ChevronUp, ChevronDown, Grid, Shuffle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('analyzer');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const theme = getTheme(isDark);

  // Auth
  const authState = useAuth();

  // File Upload
  const { rawRows, headers, colConfig, isLoading, error, handleFileUpload } = useFileUpload();

  // Analysis & Data
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
  } = useAnalysis(rawRows, colConfig);

  // Market Data
  const { spxData, marketQuotes } = useMarketData();

  // Global Statistics Calculation
  const globalStats = useMemo(() => {
    if (!analyzedTrades.length) return null;

    let netProfit = 0, pkEq = 0, mxDD = 0, sumSqDD = 0, grossP = 0, grossL = 0, totCosti = 0, totSwap = 0;
    let curEq = 0, wonBuy = 0, wonSell = 0;
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

    const wns = tDets.filter(t => t.net > 0),
      lss = tDets.filter(t => t.net <= 0);
    const pOnly = tDets.map(t => t.net),
      avgP = pOnly.reduce((a, b) => a + b, 0) / cC,
      std = Math.sqrt(pOnly.reduce((a, b) => a + Math.pow(b - avgP, 2), 0) / cC);
    const pf = Math.abs(grossL) > 0 ? grossP / Math.abs(grossL) : 999;

    const lssOnly = lss.map(t => t.net);
    const downDev = Math.sqrt(lssOnly.length > 0 ? lssOnly.reduce((a, b) => a + Math.pow(b, 2), 0) / lssOnly.length : 0);
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
      avgClose: getAvgTimeStr(clT)
    };
  }, [analyzedTrades, spxData]);

  // Strategy Statistics
  const strategyStats = useMemo(() => {
    if (!analyzedTrades.length) return [];
    const grp = analyzedTrades.filter(t => t.IsMergedOut).reduce((acc, t) => {
      const k = groupBy === 'Asset' ? t.Symbol : t.Id;
      if (groupBy === 'Strategy' && k === 'Senza Commento') return acc;
      if (!acc[k]) acc[k] = [];
      acc[k].push(t);
      return acc;
    }, {});

    return Object.keys(grp).map(name => {
      const deals = grp[name].sort((a, b) => a.TimeMs - b.TimeMs);
      let curEq = 0, pkEq = 0, mxDD = 0, sumSqDD = 0, netProfit = 0, grossP = 0, grossL = 0, sC = 0, sSwap = 0;
      let wonBuy = 0, wonSell = 0;
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

        if (d.OpenTimeMs) opTs.push(d.OpenTimeMs);
        if (d.CloseTimeMs) clTs.push(d.CloseTimeMs);
        if (d.TimeMs) {
          const dKey = new Date(d.TimeMs).toISOString().split('T')[0];
          pDly[dKey] = (pDly[dKey] || 0) + net;
        }

        if (curEq > pkEq)
          pkEq = curEq;
        else {
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
      const wns = tDets.filter(t => t.net > 0),
        lss = tDets.filter(t => t.net <= 0);
      const pOnly = tDets.map(t => t.net);
      const avgP = c > 0 ? netProfit / c : 0,
        std = Math.sqrt(c > 0 ? tDets.reduce((a, b) => a + Math.pow(b.net - avgP, 2), 0) / c : 0);
      const lssOnly = lss.map(t => t.net),
        downDev = Math.sqrt(lssOnly.length > 0 ? lssOnly.reduce((a, b) => a + Math.pow(b, 2), 0) / lssOnly.length : 0);
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
        avgClose: getAvgTimeStr(clTs)
      };
    }).sort((a, b) => b.netProfit - a.netProfit);
  }, [analyzedTrades, groupBy, spxData]);

  // Correlation Matrix
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
    const entities = Array.from(new Set(trades.map(t => groupBy === 'Asset' ? t.Symbol : t.Id)))
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
          const v1 = dayData[e1] || 0, v2 = dayData[e2] || 0;
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
        const num = pSum - (sum1 * sum2 / n), den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
        row[e2] = den === 0 ? 0 : num / den;
      });
      return row;
    });
    return { entities, matrix };
  }, [analyzedTrades, groupBy]);

  // Monte Carlo Simulation
  const monteCarloData = useMemo(() => {
    if (!analyzedTrades.length) return null;
    const trades = analyzedTrades
      .filter(t => t.IsMergedOut)
      .map(t => t.Profit + t.Commission + t.Fee + t.Swap + t.inComm + t.inFee + t.inSwap);
    if (trades.length < 5) return null;

    const iterations = mcIterations, numTrades = trades.length, mcData = [], endEquities = [];
    for (let j = 0; j <= numTrades; j++) mcData.push({ trade: j, average: 0 });

    for (let i = 0; i < iterations; i++) {
      let eq = 0;
      for (let j = 1; j <= numTrades; j++) {
        eq += trades[Math.floor(Math.random() * trades.length)];
        mcData[j][`run${i}`] = eq;
        mcData[j].average += eq;
        if (j === numTrades) endEquities.push(eq);
      }
    }
    for (let j = 1; j <= numTrades; j++) mcData[j].average = mcData[j].average / iterations;

    return {
      data: mcData,
      iterations,
      probProfit: (endEquities.filter(e => e > 0).length / iterations) * 100,
      avgEnd: mcData[numTrades].average
    };
  }, [analyzedTrades, mcIterations]);

  const getLineColors = (isDark) => [
    isDark ? '#00ff00' : '#16a34a',
    isDark ? '#ffffff' : '#0ea5e9',
    isDark ? '#ffcc00' : '#d97706',
    isDark ? '#ff00ff' : '#c026d3',
    isDark ? '#ff3333' : '#dc2626',
    '#3399ff',
    '#ff9933',
    '#cc66ff',
    '#33cc99',
    isDark ? '#00ffff' : '#0f172a',
    '#ff66b2',
    '#99ff33',
    '#00bfff',
    '#ff9999',
    '#cccc00'
  ];

  const dynLineColors = getLineColors(isDark);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans pb-20 transition-colors duration-300 overflow-x-hidden`}>
      <style>{marqueeStyle}</style>

      {/* Analysis Loader */}
      <AnalysisLoader isAnalyzing={isAnalyzing} formulaIdx={formulaIdx} isDark={isDark} theme={theme} />

      {/* Login Modal */}
      {!authState.isAuthenticated && <LoginModal {...authState} theme={theme} />}

      {/* Market Ticker */}
      <MarketTicker marketQuotes={marketQuotes} isDark={isDark} />

      {/* Sidebar */}
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

      {/* Navbar */}
      <Navbar isDark={isDark} setIsDark={setIsDark} isLoading={isLoading} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} onFileUpload={handleFileUpload} theme={theme} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8">
        {/* Filter & Table Section */}
        {parsedTrades.length > 0 && activeTab === 'analyzer' && (
          <div className={`${theme.panel} rounded-xl border ${theme.border} p-6 shadow-xl`}>
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowTable(!showTable)}>
              <h3 className={`text-lg font-bold ${theme.textBold} flex items-center gap-2`}>
                <TableIcon className={`w-5 h-5 ${theme.accent2}`} /> Controlli e Registro Deal ({filteredTableTrades.length})
              </h3>
              <button className={`p-2 ${theme.card} rounded ${theme.textMuted}`}>
                {showTable ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {showTable && (
              <div className="mt-6 space-y-4">
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-3 ${theme.card} p-4 rounded border ${theme.borderLight}`}>
                  <div className="col-span-1">
                    <label className={`block text-[10px] uppercase font-bold ${theme.textMuted} mb-1`}>Dir.</label>
                    <select
                      className={`w-full p-1.5 rounded text-xs border ${theme.input}`}
                      value={tableFilters.dir}
                      onChange={e => setTableFilters({ ...tableFilters, dir: e.target.value })}
                    >
                      <option value="all">TUTTE</option>
                      <option value="in">IN</option>
                      <option value="out">OUT</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className={`block text-[10px] uppercase font-bold ${theme.textMuted} mb-1`}>Tipo</label>
                    <select
                      className={`w-full p-1.5 rounded text-xs border ${theme.input}`}
                      value={tableFilters.tradeType}
                      onChange={e => setTableFilters({ ...tableFilters, tradeType: e.target.value })}
                    >
                      <option value="all">TUTTI</option>
                      <option value="buy">BUY</option>
                      <option value="sell">SELL</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className={`block text-[10px] uppercase font-bold ${theme.textMuted} mb-1`}>Da Data</label>
                    <input
                      type="date"
                      className={`w-full p-1.5 rounded text-xs border ${theme.input}`}
                      value={tableFilters.dateStart}
                      onChange={e => setTableFilters({ ...tableFilters, dateStart: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className={`block text-[10px] uppercase font-bold ${theme.textMuted} mb-1`}>A Data</label>
                    <input
                      type="date"
                      className={`w-full p-1.5 rounded text-xs border ${theme.input}`}
                      value={tableFilters.dateEnd}
                      onChange={e => setTableFilters({ ...tableFilters, dateEnd: e.target.value })}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className={`block text-[10px] uppercase font-bold ${theme.textMuted} mb-1 flex justify-between`}>
                      Simboli{' '}
                      <span
                        className="lowercase font-normal opacity-70 cursor-pointer hover:underline"
                        onClick={() => setTableFilters({ ...tableFilters, symbols: [] })}
                      >
                        Azzera
                      </span>
                    </label>
                    <div className={`flex flex-wrap gap-1 overflow-y-auto max-h-24 p-2 rounded border ${theme.input}`}>
                      {uniqueSymbols.map(s => (
                        <button
                          key={s}
                          onClick={() =>
                            setTableFilters({
                              ...tableFilters,
                              symbols: tableFilters.symbols.includes(s) ? tableFilters.symbols.filter(x => x !== s) : [...tableFilters.symbols, s]
                            })
                          }
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
                            tableFilters.symbols.includes(s) ? theme.accentBg : theme.panel
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <label className={`block text-[10px] uppercase font-bold ${theme.textMuted} mb-1 flex justify-between`}>
                      Strategie{' '}
                      <span
                        className="lowercase font-normal opacity-70 cursor-pointer hover:underline"
                        onClick={() => setTableFilters({ ...tableFilters, strategies: [] })}
                      >
                        Azzera
                      </span>
                    </label>
                    <div className={`flex flex-wrap gap-1 overflow-y-auto max-h-24 p-2 rounded border ${theme.input}`}>
                      {uniqueStrategies.map(s => (
                        <button
                          key={s}
                          onClick={() =>
                            setTableFilters({
                              ...tableFilters,
                              strategies: tableFilters.strategies.includes(s) ? tableFilters.strategies.filter(x => x !== s) : [...tableFilters.strategies, s]
                            })
                          }
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
                            tableFilters.strategies.includes(s) ? theme.accentBg : theme.panel
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={triggerAnalysis}
                    className={`w-full lg:col-span-8 font-black py-3 rounded uppercase text-xs mt-2 ${theme.accentBg}`}
                  >
                    Applica Filtri e Aggiorna Analisi
                  </button>
                </div>

                <FilterBadge filters={appliedFilters} isDark={isDark} theme={theme} />

                {/* Trades Table */}
                <div className={`overflow-x-auto max-h-[400px] border ${theme.border} rounded shadow-inner ${theme.panel}`}>
                  <table className="w-full text-left text-[10px] font-mono whitespace-nowrap">
                    <thead className={`sticky top-0 ${theme.card} shadow-md z-10`}>
                      <tr>
                        <th className={`p-3 border-b ${theme.border} ${theme.textMuted}`}>Open Time</th>
                        <th className={`p-3 border-b ${theme.border} ${theme.textMuted}`}>Dir</th>
                        <th className={`p-3 border-b ${theme.border} ${theme.textMuted}`}>Type</th>
                        <th className={`p-3 border-b ${theme.border} ${theme.textMuted}`}>Symbol</th>
                        <th className={`p-3 border-b ${theme.border} ${theme.textMuted}`}>Strategy / ID</th>
                        <th className={`p-3 border-b ${theme.border} text-right ${theme.textMuted}`}>Gross Profit</th>
                        <th className={`p-3 border-b ${theme.border} text-right ${theme.textMuted}`}>Swap</th>
                        <th className={`p-3 border-b ${theme.border} text-right ${theme.textMuted}`}>Commissioni</th>
                        <th className={`p-3 border-b ${theme.border} text-right ${theme.textMuted}`}>Net PNL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTableTrades.map((t, idx) => {
                        const swap = t.Swap + t.inSwap;
                        const comms = t.Commission + t.Fee + t.inComm + t.inFee;
                        const netto = t.Profit + swap + comms;
                        return (
                          <tr key={idx} className={`border-b ${theme.borderLight} ${theme.cardHover}`}>
                            <td className={`p-2 border-r ${theme.borderLight}`}>
                              {t.OpenTimeMs ? new Date(t.OpenTimeMs).toLocaleString() : '-'}
                            </td>
                            <td className={`p-2 border-r ${theme.borderLight}`}>
                              <span className={`px-1.5 py-0.5 rounded ${t.Direction === 'in' ? 'bg-blue-500/20 text-blue-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                {t.Direction.toUpperCase()}
                              </span>
                            </td>
                            <td className={`p-2 border-r ${theme.borderLight}`}>
                              <span className={`px-1.5 py-0.5 rounded ${t.Type === 'buy' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                {t.Type.toUpperCase()}
                              </span>
                            </td>
                            <td className={`p-2 border-r ${theme.borderLight} font-bold`}>{t.Symbol}</td>
                            <td className={`p-2 border-r ${theme.borderLight}`}>{t.Id}</td>
                            <td className={`p-2 border-r ${theme.borderLight} text-right ${t.Profit >= 0 ? theme.success : theme.danger}`}>
                              {t.Profit.toFixed(2)}
                            </td>
                            <td className={`p-2 border-r ${theme.borderLight} text-right text-amber-500`}>{swap.toFixed(2)}</td>
                            <td className={`p-2 border-r ${theme.borderLight} text-right text-rose-500`}>{comms.toFixed(2)}</td>
                            <td className={`p-2 text-right font-black ${netto >= 0 ? theme.success : theme.danger}`}>
                              {netto.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Statistics */}
        {globalStats && activeTab === 'analyzer' && (
          <div className={`${theme.panel} rounded-xl border ${theme.border} p-6 shadow-2xl relative`}>
            <h3 className={`text-xl font-bold ${theme.textBold} mb-6 uppercase tracking-wider`}>Recap Statistico Globale</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <EquityChart data={globalStats.equitySequence} isDark={isDark} title="Equity Globale" theme={theme} />
              <DrawdownChart data={globalStats.equitySequence} isDark={isDark} title="Drawdown Globale" theme={theme} />
            </div>

            <DayStatsCharts dayStats={globalStats.dayStats} isDark={isDark} theme={theme} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <CullenFreyPlot skew={globalStats.skew} kurt={globalStats.kurt} name="Globale" isDark={isDark} theme={theme} />
              <DistributionChart data={globalStats.tradeProfits} title="Distribuzione Totale" type="all" isDark={isDark} theme={theme} />
              <DistributionChart data={globalStats.tradeProfits} title="Distribuzione (Solo Win)" type="win" isDark={isDark} theme={theme} />
              <DistributionChart data={globalStats.tradeProfits} title="Distribuzione (Solo Loss)" type="loss" isDark={isDark} theme={theme} />
            </div>

            <div className="flex justify-between items-center mb-4 mt-12 border-b pb-4 border-slate-800">
              <h2 className={`text-xl font-black uppercase tracking-widest ${theme.textBold}`}>Performance Dettagliate</h2>
              <div className={`flex bg-[#111] border border-[#333] rounded-lg p-1`}>
                <button
                  onClick={() => setGroupBy('Strategy')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    groupBy === 'Strategy' ? theme.accentBg : 'text-[#888] hover:text-white'
                  }`}
                >
                  Per Strategia
                </button>
                <button
                  onClick={() => setGroupBy('Asset')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${groupBy === 'Asset' ? theme.accentBg : 'text-[#888] hover:text-white'}`}
                >
                  Per Asset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Details */}
        {activeTab === 'analyzer' &&
          strategyStats.map((s, i) => (
            <div key={i} className={`${theme.panel} rounded-xl border ${theme.border} mb-12 overflow-hidden shadow-lg`}>
              <div className={`${theme.card} p-5 border-b ${theme.border} flex justify-between items-center`}>
                <h4 className="font-bold text-lg">{s.name}</h4>
                <span className={`text-xl font-mono font-black ${s.netProfit >= 0 ? theme.success : theme.danger}`}>
                  {s.netProfit.toFixed(2)}
                </span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <EquityChart data={s.equitySequence} isDark={isDark} title={`Equity Line (${s.name})`} theme={theme} />
                  <DrawdownChart data={s.equitySequence} isDark={isDark} title={`Drawdown (${s.name})`} theme={theme} />
                </div>

                <DayStatsCharts dayStats={s.dayStats} isDark={isDark} theme={theme} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <CullenFreyPlot skew={s.skew} kurt={s.kurt} name={s.name} isDark={isDark} theme={theme} />
                  <DistributionChart data={s.tradeProfits} title={`Distribuzione Totale (${s.name})`} type="all" isDark={isDark} theme={theme} />
                  <DistributionChart data={s.tradeProfits} title={`Distribuzione Solo Win (${s.name})`} type="win" isDark={isDark} theme={theme} />
                  <DistributionChart data={s.tradeProfits} title={`Distribuzione Solo Loss (${s.name})`} type="loss" isDark={isDark} theme={theme} />
                </div>
              </div>
            </div>
          ))}

        {/* Correlation Matrix */}
        {activeTab === 'analyzer' && analyzedTrades.length > 0 && (
          <div className={`${theme.panel} rounded-xl border ${theme.border} p-6 shadow-2xl mt-8`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold ${theme.textBold} flex items-center gap-2`}>
                <Grid className={`w-6 h-6 ${theme.accent1}`} /> Matrice Correlazioni Pearson
              </h3>
            </div>
            <p className={`${theme.textMuted} text-xs mb-6 font-mono`}>
              Correlazione calcolata sui rendimenti netti giornalieri. Indica le divergenze matematiche tra le entità raggruppate attualmente selezionate.
            </p>
            <CorrelationHeatmap data={correlationData} isDark={isDark} theme={theme} />
          </div>
        )}

        {/* Monte Carlo Simulator */}
        {activeTab === 'analyzer' && monteCarloData && (
          <div className={`${theme.panel} rounded-xl border ${theme.border} p-6 shadow-2xl mt-8`}>
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className={`text-xl font-bold ${theme.textBold} flex items-center gap-2`}>
                <Shuffle className={`w-6 h-6 ${theme.accent1}`} /> Simulazione Monte Carlo (Markov Chain)
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold ${theme.textMuted}`}>Iterazioni:</span>
                <select
                  value={mcIterations}
                  onChange={e => setMcIterations(Number(e.target.value))}
                  className={`p-1.5 rounded text-xs font-bold border outline-none cursor-pointer transition-colors ${theme.input} hover:border-white`}
                >
                  <option value={10}>10 Percorsi</option>
                  <option value={50}>50 Percorsi</option>
                  <option value={100}>100 Percorsi</option>
                  <option value={200}>200 Percorsi</option>
                  <option value={500}>500 Percorsi</option>
                </select>
              </div>
            </div>
            <p className={`${theme.textMuted} text-xs mb-6 font-mono`}>
              Questo strumento simula {monteCarloData.iterations} futuri percorsi di equity basandosi sull'estrazione casuale (con reinserimento) dei tuoi{' '}
              {analyzedTrades.filter(t => t.IsMergedOut).length} trades storici analizzati. La linea grossa tratteggiata rappresenta la Media Matematica calcolata.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

            <div className="h-[500px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monteCarloData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.chart.grid} />
                  <XAxis dataKey="trade" stroke={theme.chart.axis} />
                  <YAxis stroke={theme.chart.axis} />
                  <Tooltip contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText, border: `1px solid ${theme.chart.tooltipBorder}` }} labelFormatter={() => ''} />

                  {Array.from({ length: monteCarloData.iterations }).map((_, i) => (
                    <Line key={i} type="monotone" dataKey={`run${i}`} stroke={dynLineColors[i % dynLineColors.length]} strokeWidth={1} dot={false} opacity={0.15} isAnimationActive={false} />
                  ))}

                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke={theme.accent2}
                    strokeWidth={5}
                    strokeDasharray="10 5"
                    dot={false}
                    isAnimationActive={false}
                    name="MEDIA (Valore Atteso)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'descrizione' && (
          <div className={`${theme.panel} rounded-xl border ${theme.border} p-8 text-center`}>
            <Info className={`w-12 h-12 mx-auto mb-4 ${theme.accent1}`} />
            <h2 className="text-2xl font-black mb-4">Informazioni Sistema</h2>
            <p className={`${theme.textMuted} max-w-2xl mx-auto`}>
              Piattaforma di analisi quantitativa sviluppata per il parsing nativo dei report MetaTrader 5.
            </p>
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className={`${theme.panel} rounded-xl border ${theme.border} p-8 text-center`}>
            <Globe className={`w-12 h-12 mx-auto mb-4 ${theme.accent2}`} />
            <h2 className="text-2xl font-black mb-4">Feed News Finanziarie</h2>
            <p className={`${theme.textMuted} max-w-2xl mx-auto`}>Modulo notizie macroeconomiche in costruzione.</p>
          </div>
        )}
      </div>
    </div>
  );
}
