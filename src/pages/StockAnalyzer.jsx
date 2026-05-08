import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Target, Zap, Calendar, BarChart3, Layers, DollarSign, Users } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Curated universe of instruments. type = stock | etf | index | bond | commodity | currency | crypto
// hasOptions = whether Yahoo options chain is available for this symbol
const INSTRUMENT_UNIVERSE = [
  // ============ US STOCKS ============
  { sym: 'AAPL',  name: 'Apple',            cat: 'us-stocks',  bucket: 'tech',          type: 'stock', hasOptions: true },
  { sym: 'MSFT',  name: 'Microsoft',        cat: 'us-stocks',  bucket: 'tech',          type: 'stock', hasOptions: true },
  { sym: 'NVDA',  name: 'NVIDIA',           cat: 'us-stocks',  bucket: 'tech',          type: 'stock', hasOptions: true },
  { sym: 'GOOGL', name: 'Alphabet',         cat: 'us-stocks',  bucket: 'tech',          type: 'stock', hasOptions: true },
  { sym: 'META',  name: 'Meta',             cat: 'us-stocks',  bucket: 'tech',          type: 'stock', hasOptions: true },
  { sym: 'AMZN',  name: 'Amazon',           cat: 'us-stocks',  bucket: 'discretionary', type: 'stock', hasOptions: true },
  { sym: 'TSLA',  name: 'Tesla',            cat: 'us-stocks',  bucket: 'discretionary', type: 'stock', hasOptions: true },
  { sym: 'HD',    name: 'Home Depot',       cat: 'us-stocks',  bucket: 'discretionary', type: 'stock', hasOptions: true },
  { sym: 'MCD',   name: "McDonald's",       cat: 'us-stocks',  bucket: 'discretionary', type: 'stock', hasOptions: true },
  { sym: 'JPM',   name: 'JPMorgan',         cat: 'us-stocks',  bucket: 'financials',    type: 'stock', hasOptions: true },
  { sym: 'BAC',   name: 'Bank of America',  cat: 'us-stocks',  bucket: 'financials',    type: 'stock', hasOptions: true },
  { sym: 'GS',    name: 'Goldman Sachs',    cat: 'us-stocks',  bucket: 'financials',    type: 'stock', hasOptions: true },
  { sym: 'XOM',   name: 'Exxon Mobil',      cat: 'us-stocks',  bucket: 'energy',        type: 'stock', hasOptions: true },
  { sym: 'CVX',   name: 'Chevron',          cat: 'us-stocks',  bucket: 'energy',        type: 'stock', hasOptions: true },
  { sym: 'JNJ',   name: 'Johnson & Johnson',cat: 'us-stocks',  bucket: 'healthcare',    type: 'stock', hasOptions: true },
  { sym: 'PFE',   name: 'Pfizer',           cat: 'us-stocks',  bucket: 'healthcare',    type: 'stock', hasOptions: true },
  { sym: 'UNH',   name: 'UnitedHealth',     cat: 'us-stocks',  bucket: 'healthcare',    type: 'stock', hasOptions: true },
  { sym: 'KO',    name: 'Coca-Cola',        cat: 'us-stocks',  bucket: 'staples',       type: 'stock', hasOptions: true },
  { sym: 'PEP',   name: 'PepsiCo',          cat: 'us-stocks',  bucket: 'staples',       type: 'stock', hasOptions: true },
  { sym: 'WMT',   name: 'Walmart',          cat: 'us-stocks',  bucket: 'staples',       type: 'stock', hasOptions: true },
  { sym: 'NEE',   name: 'NextEra Energy',   cat: 'us-stocks',  bucket: 'utilities',     type: 'stock', hasOptions: true },
  { sym: 'SO',    name: 'Southern Company', cat: 'us-stocks',  bucket: 'utilities',     type: 'stock', hasOptions: true },

  // ============ US INDICES / BROAD ETFs ============
  { sym: 'SPY',   name: 'S&P 500',          cat: 'us-indices', bucket: 'broad-us',      type: 'etf', hasOptions: true },
  { sym: 'QQQ',   name: 'Nasdaq 100',       cat: 'us-indices', bucket: 'tech',          type: 'etf', hasOptions: true },
  { sym: 'DIA',   name: 'Dow Jones',        cat: 'us-indices', bucket: 'broad-us',      type: 'etf', hasOptions: true },
  { sym: 'IWM',   name: 'Russell 2000',     cat: 'us-indices', bucket: 'small-cap',     type: 'etf', hasOptions: true },
  { sym: 'VTI',   name: 'Total US Market',  cat: 'us-indices', bucket: 'broad-us',      type: 'etf', hasOptions: true },
  { sym: 'RSP',   name: 'S&P 500 Equal-Weight', cat: 'us-indices', bucket: 'broad-us',  type: 'etf', hasOptions: true },

  // ============ EUROPE / WORLD INDICES ============
  { sym: 'EZU',   name: 'Eurozona',         cat: 'eu-indices', bucket: 'eu-broad',      type: 'etf', hasOptions: true },
  { sym: 'VGK',   name: 'Europe FTSE',      cat: 'eu-indices', bucket: 'eu-broad',      type: 'etf', hasOptions: true },
  { sym: 'EWG',   name: 'Germania',         cat: 'eu-indices', bucket: 'eu-broad',      type: 'etf', hasOptions: true },
  { sym: 'EWQ',   name: 'Francia',          cat: 'eu-indices', bucket: 'eu-broad',      type: 'etf', hasOptions: true },
  { sym: 'EWU',   name: 'Regno Unito',      cat: 'eu-indices', bucket: 'eu-broad',      type: 'etf', hasOptions: true },
  { sym: 'EWI',   name: 'Italia',           cat: 'eu-indices', bucket: 'eu-broad',      type: 'etf', hasOptions: true },
  { sym: 'EWP',   name: 'Spagna',           cat: 'eu-indices', bucket: 'eu-broad',      type: 'etf', hasOptions: true },
  { sym: 'EWN',   name: 'Olanda',           cat: 'eu-indices', bucket: 'eu-broad',      type: 'etf', hasOptions: true },
  { sym: 'EWD',   name: 'Svezia',           cat: 'eu-indices', bucket: 'eu-broad',      type: 'etf', hasOptions: false },
  { sym: 'EWL',   name: 'Svizzera',         cat: 'eu-indices', bucket: 'eu-broad',      type: 'etf', hasOptions: false },

  // ============ ASIA / EMERGING ============
  { sym: 'EWJ',   name: 'Giappone',         cat: 'asia-em',    bucket: 'asia-dev',      type: 'etf', hasOptions: true },
  { sym: 'MCHI',  name: 'Cina',             cat: 'asia-em',    bucket: 'em',            type: 'etf', hasOptions: true },
  { sym: 'FXI',   name: 'China Large-Cap',  cat: 'asia-em',    bucket: 'em',            type: 'etf', hasOptions: true },
  { sym: 'INDA',  name: 'India',            cat: 'asia-em',    bucket: 'em',            type: 'etf', hasOptions: true },
  { sym: 'EWY',   name: 'Corea del Sud',    cat: 'asia-em',    bucket: 'asia-dev',      type: 'etf', hasOptions: true },
  { sym: 'EWT',   name: 'Taiwan',           cat: 'asia-em',    bucket: 'asia-dev',      type: 'etf', hasOptions: true },
  { sym: 'EWZ',   name: 'Brasile',          cat: 'asia-em',    bucket: 'em',            type: 'etf', hasOptions: true },
  { sym: 'EEM',   name: 'Emerging Markets', cat: 'asia-em',    bucket: 'em',            type: 'etf', hasOptions: true },
  { sym: 'VWO',   name: 'EM ex-China',      cat: 'asia-em',    bucket: 'em',            type: 'etf', hasOptions: true },

  // ============ BONDS / TREASURIES ============
  { sym: 'TLT',   name: '20+Y Treasury',    cat: 'bonds',      bucket: 'long-duration', type: 'etf', hasOptions: true },
  { sym: 'IEF',   name: '7-10Y Treasury',   cat: 'bonds',      bucket: 'mid-duration',  type: 'etf', hasOptions: true },
  { sym: 'SHY',   name: '1-3Y Treasury',    cat: 'bonds',      bucket: 'short-duration',type: 'etf', hasOptions: true },
  { sym: 'BND',   name: 'Total Bond US',    cat: 'bonds',      bucket: 'mid-duration',  type: 'etf', hasOptions: true },
  { sym: 'AGG',   name: 'US Aggregate Bond',cat: 'bonds',      bucket: 'mid-duration',  type: 'etf', hasOptions: true },
  { sym: 'LQD',   name: 'Investment Grade Corp', cat: 'bonds', bucket: 'corp-ig',       type: 'etf', hasOptions: true },
  { sym: 'HYG',   name: 'High Yield Corp',  cat: 'bonds',      bucket: 'corp-hy',       type: 'etf', hasOptions: true },
  { sym: 'JNK',   name: 'High Yield (JNK)', cat: 'bonds',      bucket: 'corp-hy',       type: 'etf', hasOptions: true },
  { sym: 'TIP',   name: 'TIPS (Inflation-Linked)', cat: 'bonds', bucket: 'tips',        type: 'etf', hasOptions: true },
  { sym: 'EMB',   name: 'EM USD Bonds',     cat: 'bonds',      bucket: 'em-bonds',      type: 'etf', hasOptions: true },

  // ============ COMMODITIES ============
  { sym: 'GLD',   name: 'Oro',              cat: 'commodities', bucket: 'gold',         type: 'etf', hasOptions: true },
  { sym: 'IAU',   name: 'Oro (iShares)',    cat: 'commodities', bucket: 'gold',         type: 'etf', hasOptions: true },
  { sym: 'SLV',   name: 'Argento',          cat: 'commodities', bucket: 'silver',       type: 'etf', hasOptions: true },
  { sym: 'USO',   name: 'Petrolio (WTI)',   cat: 'commodities', bucket: 'oil',          type: 'etf', hasOptions: true },
  { sym: 'BNO',   name: 'Petrolio (Brent)', cat: 'commodities', bucket: 'oil',          type: 'etf', hasOptions: true },
  { sym: 'UNG',   name: 'Gas Naturale',     cat: 'commodities', bucket: 'natgas',       type: 'etf', hasOptions: true },
  { sym: 'DBA',   name: 'Agricoltura',      cat: 'commodities', bucket: 'agri',         type: 'etf', hasOptions: true },
  { sym: 'DBC',   name: 'Commodity Broad',  cat: 'commodities', bucket: 'broad-comm',   type: 'etf', hasOptions: true },
  { sym: 'CPER',  name: 'Rame',             cat: 'commodities', bucket: 'industrial-metals', type: 'etf', hasOptions: false },

  // ============ CURRENCIES / FOREX ============
  { sym: 'UUP',     name: 'Dollar Index',   cat: 'currencies', bucket: 'usd',           type: 'etf', hasOptions: true },
  { sym: 'FXE',     name: 'Euro',           cat: 'currencies', bucket: 'eur',           type: 'etf', hasOptions: true },
  { sym: 'FXY',     name: 'Yen',            cat: 'currencies', bucket: 'jpy',           type: 'etf', hasOptions: true },
  { sym: 'FXB',     name: 'Sterlina',       cat: 'currencies', bucket: 'gbp',           type: 'etf', hasOptions: false },
  { sym: 'EURUSD=X',name: 'EUR/USD',        cat: 'currencies', bucket: 'eur',           type: 'currency', hasOptions: false },
  { sym: 'GBPUSD=X',name: 'GBP/USD',        cat: 'currencies', bucket: 'gbp',           type: 'currency', hasOptions: false },
  { sym: 'USDJPY=X',name: 'USD/JPY',        cat: 'currencies', bucket: 'jpy',           type: 'currency', hasOptions: false },
  { sym: 'USDCHF=X',name: 'USD/CHF',        cat: 'currencies', bucket: 'chf',           type: 'currency', hasOptions: false },

  // ============ CRYPTO ============
  { sym: 'BTC-USD', name: 'Bitcoin',        cat: 'crypto',     bucket: 'crypto-major',  type: 'crypto', hasOptions: false },
  { sym: 'ETH-USD', name: 'Ethereum',       cat: 'crypto',     bucket: 'crypto-major',  type: 'crypto', hasOptions: false },
  { sym: 'SOL-USD', name: 'Solana',         cat: 'crypto',     bucket: 'crypto-alt',    type: 'crypto', hasOptions: false },
  { sym: 'IBIT',    name: 'Bitcoin ETF',    cat: 'crypto',     bucket: 'crypto-major',  type: 'etf', hasOptions: true },

  // ============ VOLATILITY ============
  { sym: '^VIX',  name: 'VIX',              cat: 'volatility', bucket: 'vol',           type: 'index',    hasOptions: false },
  { sym: 'VXX',   name: 'VIX Short-Term',   cat: 'volatility', bucket: 'vol',           type: 'etf',      hasOptions: true },
  { sym: 'UVXY',  name: 'VIX 1.5x Lev',     cat: 'volatility', bucket: 'vol',           type: 'etf',      hasOptions: true },
];

const CATEGORIES = [
  { id: 'all',          label: 'Tutti' },
  { id: 'us-stocks',    label: 'Azioni USA' },
  { id: 'us-indices',   label: 'Indici USA' },
  { id: 'eu-indices',   label: 'Europa' },
  { id: 'asia-em',      label: 'Asia / EM' },
  { id: 'bonds',        label: 'Bond' },
  { id: 'commodities',  label: 'Commodity' },
  { id: 'currencies',   label: 'Forex' },
  { id: 'crypto',       label: 'Crypto' },
  { id: 'volatility',   label: 'Volatilità' },
];

const BUCKET_LABEL = {
  // Equity sectors
  tech: 'Tecnologia', discretionary: 'Consumi Discrezionali', financials: 'Finanziari', energy: 'Energia',
  healthcare: 'Sanità', staples: 'Beni Prima Necessità', utilities: 'Utility',
  // Equity broad
  'broad-us': 'Mercato USA', 'small-cap': 'Small Cap USA',
  'eu-broad': 'Europa', 'asia-dev': 'Asia Sviluppata', em: 'Emerging Markets',
  // Bonds
  'long-duration': 'Treasury Lungo Termine', 'mid-duration': 'Treasury Medio', 'short-duration': 'Treasury Breve',
  'corp-ig': 'Corporate Investment Grade', 'corp-hy': 'High Yield', tips: 'TIPS (Inflation-Linked)', 'em-bonds': 'EM Bonds',
  // Commodities
  gold: 'Oro', silver: 'Argento', oil: 'Petrolio', natgas: 'Gas Naturale',
  agri: 'Agricoltura', 'broad-comm': 'Commodity Broad', 'industrial-metals': 'Metalli Industriali',
  // Currencies
  usd: 'Dollar Index', eur: 'Euro', jpy: 'Yen', gbp: 'Sterlina', chf: 'Franco Svizzero',
  // Crypto
  'crypto-major': 'Crypto Major', 'crypto-alt': 'Altcoin',
  // Vol
  vol: 'Volatilità',
};

// Macro fit table: rows = regime, cols = bucket (0..100)
// Higher = better expected performance under that regime
const MACRO_FIT = {
  ESPANSIONE: {
    tech: 85, discretionary: 90, financials: 80, energy: 70, healthcare: 50, staples: 35, utilities: 30,
    'broad-us': 75, 'small-cap': 85, 'eu-broad': 70, 'asia-dev': 70, em: 80,
    'long-duration': 25, 'mid-duration': 35, 'short-duration': 50, 'corp-ig': 55, 'corp-hy': 75, tips: 50, 'em-bonds': 70,
    gold: 35, silver: 50, oil: 75, natgas: 60, agri: 55, 'broad-comm': 70, 'industrial-metals': 80,
    usd: 35, eur: 60, jpy: 30, gbp: 60, chf: 40,
    'crypto-major': 75, 'crypto-alt': 80,
    vol: 20,
  },
  GOLDILOCKS: {
    tech: 80, discretionary: 75, financials: 70, energy: 55, healthcare: 60, staples: 50, utilities: 50,
    'broad-us': 80, 'small-cap': 75, 'eu-broad': 70, 'asia-dev': 65, em: 65,
    'long-duration': 60, 'mid-duration': 65, 'short-duration': 55, 'corp-ig': 70, 'corp-hy': 65, tips: 45, 'em-bonds': 65,
    gold: 50, silver: 55, oil: 50, natgas: 45, agri: 50, 'broad-comm': 50, 'industrial-metals': 60,
    usd: 45, eur: 55, jpy: 40, gbp: 55, chf: 50,
    'crypto-major': 70, 'crypto-alt': 65,
    vol: 25,
  },
  REFLAZIONE: {
    tech: 50, discretionary: 55, financials: 75, energy: 90, healthcare: 50, staples: 55, utilities: 35,
    'broad-us': 60, 'small-cap': 65, 'eu-broad': 65, 'asia-dev': 60, em: 75,
    'long-duration': 25, 'mid-duration': 35, 'short-duration': 55, 'corp-ig': 50, 'corp-hy': 65, tips: 80, 'em-bonds': 65,
    gold: 75, silver: 80, oil: 90, natgas: 80, agri: 75, 'broad-comm': 85, 'industrial-metals': 80,
    usd: 35, eur: 60, jpy: 35, gbp: 60, chf: 50,
    'crypto-major': 65, 'crypto-alt': 60,
    vol: 50,
  },
  STAGFLAZIONE: {
    tech: 30, discretionary: 25, financials: 35, energy: 80, healthcare: 65, staples: 70, utilities: 60,
    'broad-us': 30, 'small-cap': 25, 'eu-broad': 30, 'asia-dev': 35, em: 45,
    'long-duration': 20, 'mid-duration': 30, 'short-duration': 50, 'corp-ig': 40, 'corp-hy': 35, tips: 85, 'em-bonds': 40,
    gold: 90, silver: 80, oil: 80, natgas: 75, agri: 75, 'broad-comm': 80, 'industrial-metals': 60,
    usd: 60, eur: 45, jpy: 50, gbp: 40, chf: 70,
    'crypto-major': 45, 'crypto-alt': 30,
    vol: 75,
  },
  RECESSIONE: {
    tech: 30, discretionary: 20, financials: 25, energy: 35, healthcare: 75, staples: 80, utilities: 80,
    'broad-us': 25, 'small-cap': 20, 'eu-broad': 25, 'asia-dev': 25, em: 20,
    'long-duration': 85, 'mid-duration': 75, 'short-duration': 65, 'corp-ig': 55, 'corp-hy': 25, tips: 60, 'em-bonds': 30,
    gold: 80, silver: 50, oil: 25, natgas: 30, agri: 50, 'broad-comm': 30, 'industrial-metals': 25,
    usd: 75, eur: 40, jpy: 75, gbp: 35, chf: 80,
    'crypto-major': 25, 'crypto-alt': 15,
    vol: 90,
  },
  'RISK-OFF': {
    tech: 35, discretionary: 30, financials: 30, energy: 40, healthcare: 70, staples: 75, utilities: 75,
    'broad-us': 30, 'small-cap': 25, 'eu-broad': 30, 'asia-dev': 30, em: 25,
    'long-duration': 75, 'mid-duration': 70, 'short-duration': 60, 'corp-ig': 55, 'corp-hy': 30, tips: 55, 'em-bonds': 30,
    gold: 75, silver: 55, oil: 35, natgas: 40, agri: 50, 'broad-comm': 40, 'industrial-metals': 30,
    usd: 75, eur: 45, jpy: 75, gbp: 40, chf: 80,
    'crypto-major': 30, 'crypto-alt': 20,
    vol: 80,
  },
  TRANSIZIONE: {
    tech: 50, discretionary: 50, financials: 50, energy: 50, healthcare: 55, staples: 55, utilities: 55,
    'broad-us': 50, 'small-cap': 45, 'eu-broad': 50, 'asia-dev': 50, em: 50,
    'long-duration': 50, 'mid-duration': 50, 'short-duration': 55, 'corp-ig': 55, 'corp-hy': 50, tips: 55, 'em-bonds': 50,
    gold: 55, silver: 55, oil: 50, natgas: 50, agri: 50, 'broad-comm': 50, 'industrial-metals': 50,
    usd: 50, eur: 50, jpy: 50, gbp: 50, chf: 55,
    'crypto-major': 50, 'crypto-alt': 45,
    vol: 50,
  },
};

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

const fetchStockHistory = async (symbol) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2y`;
  const json = await fetchJson(url);
  const result = json.chart?.result?.[0];
  if (!result) return null;
  const ts = result.timestamp || [];
  const q = result.indicators.quote[0] || {};
  const closes = q.close || [], opens = q.open || [], highs = q.high || [], lows = q.low || [], vols = q.volume || [];
  const data = [];
  for (let i = 0; i < ts.length; i++) {
    if (closes[i] != null) {
      data.push({
        date: new Date(ts[i] * 1000),
        open: opens[i] ?? closes[i],
        high: highs[i] ?? closes[i],
        low:  lows[i]  ?? closes[i],
        close: closes[i],
        volume: vols[i] ?? 0,
      });
    }
  }
  return data;
};

// Fetch fundamentals + analyst data via quoteSummary
// v7/quote endpoint — more permissive through CORS proxies than v10/quoteSummary
// Returns: PE, forwardPE, P/B, dividend yield, EPS, target prices, analyst recommendations
const fetchQuoteSnapshot = async (symbol) => {
  const candidates = [
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
  ];
  for (const url of candidates) {
    try {
      const json = await fetchJson(url);
      const r = json?.quoteResponse?.result?.[0];
      if (!r) continue;
      // averageAnalystRating is e.g. "1.8 - Buy" → parse the numeric part
      let recMean = null, recKey = null;
      if (typeof r.averageAnalystRating === 'string') {
        const m = r.averageAnalystRating.match(/^([\d.]+)\s*-?\s*(.+)?/);
        if (m) {
          recMean = parseFloat(m[1]);
          recKey = (m[2] || '').toLowerCase().trim();
        }
      }
      return {
        pe: r.trailingPE ?? null,
        forwardPe: r.forwardPE ?? null,
        pb: r.priceToBook ?? null,
        marketCap: r.marketCap ?? null,
        // Yahoo gives yield as decimal (0.025) → convert to percentage
        dividendYield: r.dividendYield != null ? r.dividendYield * 100 : (r.trailingAnnualDividendYield != null ? r.trailingAnnualDividendYield * 100 : null),
        eps: r.epsTrailingTwelveMonths ?? null,
        forwardEps: r.epsForward ?? null,
        bookValue: r.bookValue ?? null,
        // Analyst data
        targetMeanPrice: r.targetMeanPrice ?? null,
        targetHighPrice: r.targetHighPrice ?? null,
        targetLowPrice: r.targetLowPrice ?? null,
        recommendationMean: recMean,
        recommendationKey: recKey,
        numberOfAnalysts: r.numberOfAnalystOpinions ?? null,
        // 52w range for context
        fiftyTwoWeekHigh: r.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: r.fiftyTwoWeekLow ?? null,
      };
    } catch {
      continue;
    }
  }
  return null;
};

const fetchFundamentals = async (symbol) => {
  // 1. Always try v7/quote first — most reliable through CORS proxies
  const quoteData = await fetchQuoteSnapshot(symbol);

  // 2. Try v10/quoteSummary for deeper fundamentals (ROE, margins, debt, growth)
  //    Often blocked by Yahoo crumb requirement, but we try
  let summaryData = null;
  const modules = 'summaryDetail,financialData,defaultKeyStatistics,recommendationTrend';
  const candidates = [
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`,
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`,
  ];
  for (const url of candidates) {
    try {
      const json = await fetchJson(url);
      const r = json?.quoteSummary?.result?.[0];
      if (!r) continue;
      const sd = r.summaryDetail || {};
      const fd = r.financialData || {};
      const ks = r.defaultKeyStatistics || {};
      const rt = r.recommendationTrend?.trend?.[0] || {};
      const get = (o, k) => o?.[k]?.raw != null ? o[k].raw : (typeof o?.[k] === 'number' ? o[k] : null);
      summaryData = {
        profitMargin: get(fd, 'profitMargins'),
        roe: get(fd, 'returnOnEquity'),
        de: get(fd, 'debtToEquity'),
        revenueGrowth: get(fd, 'revenueGrowth'),
        earningsGrowth: get(fd, 'earningsGrowth'),
        recommendationMean: get(fd, 'recommendationMean'),
        targetMeanPrice: get(fd, 'targetMeanPrice'),
        numberOfAnalysts: get(fd, 'numberOfAnalystOpinions'),
        strongBuy: rt.strongBuy ?? 0,
        buy: rt.buy ?? 0,
        hold: rt.hold ?? 0,
        sell: rt.sell ?? 0,
        strongSell: rt.strongSell ?? 0,
      };
      break;
    } catch {
      continue;
    }
  }

  // Merge — summaryData overrides quoteData where it has a value
  if (!quoteData && !summaryData) return null;
  const merged = { ...(quoteData || {}) };
  if (summaryData) {
    Object.entries(summaryData).forEach(([k, v]) => {
      if (v != null) merged[k] = v;
    });
  }
  // Sanity check: at least PE or analyst recommendation present
  if (merged.pe == null && merged.recommendationMean == null && merged.targetMeanPrice == null) return null;
  return merged;
};

// Fundamentals → 0..100 score
const computeFundamentalsScore = (f) => {
  if (!f) return null;
  let score = 50, factors = 0;
  if (f.pe != null) {
    if (f.pe < 0) score -= 10;
    else if (f.pe < 15) score += 12;
    else if (f.pe < 22) score += 5;
    else if (f.pe > 35) score -= 8;
    factors++;
  }
  if (f.forwardPe != null && f.pe != null && f.pe > 0) {
    if (f.forwardPe < f.pe) score += 6;
    else if (f.forwardPe > f.pe * 1.2) score -= 6;
    factors++;
  }
  if (f.roe != null) {
    if (f.roe > 0.20) score += 12;
    else if (f.roe > 0.10) score += 5;
    else if (f.roe < 0) score -= 12;
    factors++;
  }
  if (f.profitMargin != null) {
    if (f.profitMargin > 0.20) score += 8;
    else if (f.profitMargin < 0) score -= 10;
    factors++;
  }
  if (f.de != null) {
    if (f.de < 50) score += 6;
    else if (f.de > 200) score -= 8;
    factors++;
  }
  if (f.revenueGrowth != null) {
    if (f.revenueGrowth > 0.15) score += 10;
    else if (f.revenueGrowth > 0.05) score += 4;
    else if (f.revenueGrowth < 0) score -= 8;
    factors++;
  }
  if (f.earningsGrowth != null) {
    if (f.earningsGrowth > 0.20) score += 8;
    else if (f.earningsGrowth < 0) score -= 8;
    factors++;
  }
  // Price/Book — works without quoteSummary
  if (f.pb != null && f.pb > 0) {
    if (f.pb < 1.5) score += 8;
    else if (f.pb < 3) score += 3;
    else if (f.pb > 6) score -= 8;
    factors++;
  }
  // Dividend yield — bonus for income (only adds, never subtracts)
  if (f.dividendYield != null && f.dividendYield > 0) {
    if (f.dividendYield > 4) score += 5;
    else if (f.dividendYield > 2) score += 2;
    factors++;
  }
  // EPS positive vs negative
  if (f.eps != null) {
    if (f.eps > 0) score += 3;
    else score -= 8;
    factors++;
  }
  if (factors === 0) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Analyst score → 0..100
const computeAnalystScore = (f, currentPrice) => {
  if (!f) return null;
  if (f.recommendationMean == null && f.targetMeanPrice == null) return null;
  let score = 50;
  if (f.recommendationMean != null) {
    // 1=strong buy, 5=sell. Map: 1→+30, 3→0, 5→-30
    score += (3 - f.recommendationMean) * 15;
  }
  if (f.targetMeanPrice != null && currentPrice != null && currentPrice > 0) {
    const upside = ((f.targetMeanPrice - currentPrice) / currentPrice) * 100;
    score += Math.max(-15, Math.min(25, upside / 2));
  }
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Fetch options chain — tries query1 then query2; returns null if all fail
const fetchOptions = async (symbol) => {
  const candidates = [
    `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}`,
    `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}`,
  ];
  for (const url of candidates) {
    try {
      const json = await fetchJson(url);
      const result = json?.optionChain?.result?.[0];
      if (!result) continue;
      const opt = result.options?.[0];
      if (!opt) continue;
      const calls = (opt.calls || []).map(c => ({
        strike: c.strike, oi: c.openInterest || 0, vol: c.volume || 0, iv: c.impliedVolatility || 0,
      }));
      const puts = (opt.puts || []).map(p => ({
        strike: p.strike, oi: p.openInterest || 0, vol: p.volume || 0, iv: p.impliedVolatility || 0,
      }));
      if (calls.length === 0 && puts.length === 0) continue;
      return {
        expiry: opt.expirationDate ? new Date(opt.expirationDate * 1000) : null,
        spot: result.quote?.regularMarketPrice ?? null,
        calls,
        puts,
      };
    } catch {
      continue;
    }
  }
  return null;
};

// Aggregate options into actionable levels
const computeOptionLevels = (chain) => {
  if (!chain) return null;
  const { calls, puts, spot } = chain;

  // Aggregate OI by strike (combined view for chart)
  const byStrike = {};
  calls.forEach(c => { byStrike[c.strike] = byStrike[c.strike] || { strike: c.strike, callOi: 0, putOi: 0 }; byStrike[c.strike].callOi += c.oi; });
  puts.forEach(p => { byStrike[p.strike] = byStrike[p.strike] || { strike: p.strike, callOi: 0, putOi: 0 }; byStrike[p.strike].putOi += p.oi; });
  const strikes = Object.values(byStrike).sort((a, b) => a.strike - b.strike);

  // Top resistance/support levels
  const topCalls = [...calls].sort((a, b) => b.oi - a.oi).slice(0, 5);
  const topPuts = [...puts].sort((a, b) => b.oi - a.oi).slice(0, 5);

  // Max Pain: strike that minimizes total dollar loss to option writers
  let maxPain = null, minLoss = Infinity;
  strikes.forEach(s => {
    let loss = 0;
    calls.forEach(c => { if (s.strike > c.strike) loss += (s.strike - c.strike) * c.oi; });
    puts.forEach(p => { if (s.strike < p.strike) loss += (p.strike - s.strike) * p.oi; });
    if (loss < minLoss) { minLoss = loss; maxPain = s.strike; }
  });

  // Put/Call ratio
  const totalCallOi = calls.reduce((a, b) => a + b.oi, 0);
  const totalPutOi = puts.reduce((a, b) => a + b.oi, 0);
  const pcRatio = totalCallOi > 0 ? totalPutOi / totalCallOi : null;

  // ATM IV (avg of closest strike calls and puts)
  const atmCall = calls.reduce((best, c) => Math.abs(c.strike - spot) < Math.abs(best.strike - spot) ? c : best, calls[0] || { strike: 0, iv: 0 });
  const atmPut = puts.reduce((best, p) => Math.abs(p.strike - spot) < Math.abs(best.strike - spot) ? p : best, puts[0] || { strike: 0, iv: 0 });
  const atmIv = atmCall && atmPut ? ((atmCall.iv + atmPut.iv) / 2) * 100 : null;

  return { strikes, topCalls, topPuts, maxPain, pcRatio, atmIv, spot, totalCallOi, totalPutOi };
};

// Lightweight per-row summary used in the overview tables
const computeRowSummary = (history, regimeLabel, bucket) => {
  if (!history || history.length < 30) return null;
  const closes = history.map(d => d.close);
  const last = closes[closes.length - 1];
  const ago = (n) => closes.length > n ? closes[closes.length - 1 - n] : null;
  const pct = (a, b) => (a != null && b != null) ? ((a - b) / b) * 100 : null;
  const r1d = pct(last, ago(1));
  const r1w = pct(last, ago(5));
  const r1m = pct(last, ago(21));

  // Momentum: annualized avg of last 60 daily returns (proxy for trend strength)
  const last60 = closes.slice(-60);
  let dailySum = 0, n = 0;
  for (let i = 1; i < last60.length; i++) {
    dailySum += (last60[i] - last60[i - 1]) / last60[i - 1];
    n++;
  }
  const momentum = n > 0 ? (dailySum / n) * 252 * 100 : 0;

  // Reuse main analysis for score
  const analysis = computeAnalysis(history, regimeLabel, bucket);
  if (!analysis) return null;

  // Sparkline: last 30 closes normalized
  const sparkline = closes.slice(-30).map((c, i) => ({ i, c }));
  const sparkUp = sparkline.length > 1 && sparkline[sparkline.length - 1].c >= sparkline[0].c;

  return {
    last,
    score: analysis.score,
    action: analysis.action,
    actionColor: analysis.actionColor,
    r1d, r1w, r1m,
    momentum,
    sparkline,
    sparkColor: sparkUp ? '#00e676' : '#ff1744',
  };
};

const sma = (arr, period) => {
  if (arr.length < period) return null;
  const slice = arr.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
};

const stdDev = (arr) => {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
};

// Wilder's RSI (simplified)
const computeRSI = (closes, period = 14) => {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += -diff;
  }
  const avgG = gains / period;
  const avgL = losses / period;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - (100 / (1 + rs));
};

const computeAnalysis = (history, regimeLabel, bucket, fundamentals = null) => {
  if (!history || history.length < 60) return null;
  const closes = history.map(d => d.close);
  const last = closes[closes.length - 1];

  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const rsi = computeRSI(closes, 14);

  // Trend windows (trading days approx)
  const ago = (n) => closes.length > n ? closes[closes.length - 1 - n] : null;
  const trendShort  = ago(21)  ? ((last - ago(21))  / ago(21))  * 100 : null; // ~1 month
  const trendMedium = ago(63)  ? ((last - ago(63))  / ago(63))  * 100 : null; // ~3 months
  const trendLong   = ago(252) ? ((last - ago(252)) / ago(252)) * 100 : null; // ~12 months

  const classifyTrend = (pct) => {
    if (pct == null) return { label: 'N/D', strength: 'neutral', color: '#a0a0a0' };
    if (pct > 15)  return { label: 'FORTE RIALZO',    strength: 'strong-up', color: '#00e676' };
    if (pct > 5)   return { label: 'RIALZO',          strength: 'up',        color: '#66bb6a' };
    if (pct > -5)  return { label: 'LATERALE',        strength: 'flat',      color: '#a0a0a0' };
    if (pct > -15) return { label: 'RIBASSO',         strength: 'down',      color: '#ef5350' };
    return { label: 'FORTE RIBASSO', strength: 'strong-down', color: '#ff1744' };
  };

  // ---------- Sub-scores 0..100 ----------
  // Technical: SMA, momentum, RSI position
  let technical = 50;
  if (sma50 != null) technical += last > sma50 ? 10 : -10;
  if (sma200 != null) technical += last > sma200 ? 15 : -15;
  if (sma50 != null && sma200 != null) technical += sma50 > sma200 ? 10 : -10;
  if (rsi > 70) technical -= 10; // overbought
  else if (rsi < 30) technical += 5; // oversold (potential bounce)
  else if (rsi > 50) technical += 5;
  technical = Math.max(0, Math.min(100, technical));

  // Macro fit: based on regime + bucket
  const macroTable = MACRO_FIT[regimeLabel] || MACRO_FIT.TRANSIZIONE;
  const macro = macroTable[bucket] ?? 50;

  // Seasonality: avg return for current calendar month over history
  const currentMonth = new Date().getMonth();
  const monthlyByMonth = Array.from({ length: 12 }, () => []);
  for (let i = 21; i < history.length; i++) {
    const m = history[i].date.getMonth();
    const prev = history[Math.max(0, i - 21)].close;
    const ret = ((history[i].close - prev) / prev) * 100;
    monthlyByMonth[m].push(ret);
  }
  const avgMonthly = monthlyByMonth.map(arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const currentMonthAvg = avgMonthly[currentMonth] || 0;
  let seasonality = 50 + currentMonthAvg * 6; // amplify
  seasonality = Math.max(0, Math.min(100, seasonality));

  // Fundamentals & Analyst (only if available — typically stocks)
  const fundamentalsScore = computeFundamentalsScore(fundamentals);
  const analystScore = computeAnalystScore(fundamentals, last);

  // Composite weighted score — re-distributes weights based on which categories are available
  const factors = [
    { key: 'macro',         val: macro,           w: 0.30 },
    { key: 'technical',     val: technical,       w: 0.25 },
    { key: 'fundamentals',  val: fundamentalsScore, w: 0.20 },
    { key: 'analyst',       val: analystScore,    w: 0.15 },
    { key: 'seasonality',   val: seasonality,     w: 0.10 },
  ];
  const available = factors.filter(f => f.val != null);
  const totalW = available.reduce((a, b) => a + b.w, 0) || 1;
  const score = Math.round(available.reduce((a, b) => a + b.val * (b.w / totalW), 0));

  let action, actionColor, actionDesc;
  if (score >= 75)      { action = 'STRONG BUY'; actionColor = '#00e676'; actionDesc = 'Setup molto favorevole su tutti i fattori.'; }
  else if (score >= 60) { action = 'BUY';        actionColor = '#66bb6a'; actionDesc = 'Contesto positivo, accumulo graduale.'; }
  else if (score >= 45) { action = 'HOLD';       actionColor = '#ffa726'; actionDesc = 'Segnali misti, mantenere posizioni esistenti.'; }
  else if (score >= 30) { action = 'SELL';       actionColor = '#ef5350'; actionDesc = 'Contesto sfavorevole, ridurre esposizione.'; }
  else                  { action = 'STRONG SELL';actionColor = '#ff1744'; actionDesc = 'Setup molto negativo, evitare o shortare.'; }

  // Attention levels
  const attention = [];
  if (rsi > 75) attention.push({ level: 'high', text: `RSI ${rsi.toFixed(0)}: ipercomprato, possibile correzione` });
  if (rsi < 25) attention.push({ level: 'high', text: `RSI ${rsi.toFixed(0)}: ipervenduto, possibile rimbalzo` });
  if (sma50 && sma200 && Math.abs(sma50 - sma200) / sma200 < 0.01) {
    attention.push({ level: 'medium', text: 'SMA50 ≈ SMA200: possibile cambio di trend imminente' });
  }
  if (trendShort != null && trendMedium != null && Math.sign(trendShort) !== Math.sign(trendMedium)) {
    attention.push({ level: 'medium', text: 'Divergenza trend breve vs medio termine' });
  }
  if (macro >= 75) attention.push({ level: 'low', text: `${BUCKET_LABEL[bucket] || bucket} favorito dal regime corrente` });
  if (macro <= 35) attention.push({ level: 'high', text: `${BUCKET_LABEL[bucket] || bucket} sfavorito dal regime corrente` });
  if (currentMonthAvg < -2) attention.push({ level: 'medium', text: `Mese storicamente debole (${currentMonthAvg.toFixed(1)}%/mo)` });
  if (currentMonthAvg > 2) attention.push({ level: 'low', text: `Mese storicamente positivo (+${currentMonthAvg.toFixed(1)}%/mo)` });

  // Build chart data with OHLCV
  const window = Math.min(252, history.length);
  const priceChart = history.slice(-window).map(d => ({
    date: d.date.toISOString().split('T')[0],
    open: d.open, high: d.high, low: d.low, close: d.close,
    volume: d.volume || 0,
  }));

  // Add SMA50/200 + Bollinger Bands (20, 2σ)
  for (let i = 0; i < priceChart.length; i++) {
    const idx = history.length - priceChart.length + i;
    const slice50 = closes.slice(Math.max(0, idx - 49), idx + 1);
    const slice200 = closes.slice(Math.max(0, idx - 199), idx + 1);
    const slice20 = closes.slice(Math.max(0, idx - 19), idx + 1);
    priceChart[i].sma50 = slice50.length === 50 ? slice50.reduce((a, b) => a + b, 0) / 50 : null;
    priceChart[i].sma200 = slice200.length === 200 ? slice200.reduce((a, b) => a + b, 0) / 200 : null;
    if (slice20.length === 20) {
      const m = slice20.reduce((a, b) => a + b, 0) / 20;
      const v = slice20.reduce((a, b) => a + (b - m) ** 2, 0) / 20;
      const sd = Math.sqrt(v);
      priceChart[i].bbMid = m;
      priceChart[i].bbUp = m + 2 * sd;
      priceChart[i].bbLo = m - 2 * sd;
    }
  }

  // Forecast cone: linear regression on last 60 days, project 30 days forward
  const forecastWindow = 60;
  const projectDays = 30;
  const recent = history.slice(-forecastWindow);
  let slope = 0, intercept = last;
  if (recent.length >= 10) {
    const n = recent.length;
    const xs = Array.from({ length: n }, (_, i) => i);
    const ys = recent.map(d => d.close);
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (ys[i] - meanY); den += (xs[i] - meanX) ** 2; }
    slope = den !== 0 ? num / den : 0;
    intercept = meanY - slope * meanX;
  }
  // Daily volatility for cone width
  const dailyRets = [];
  for (let i = 1; i < recent.length; i++) dailyRets.push((recent[i].close - recent[i - 1].close) / recent[i - 1].close);
  const meanRet = dailyRets.length ? dailyRets.reduce((a, b) => a + b, 0) / dailyRets.length : 0;
  const sigma = dailyRets.length > 1
    ? Math.sqrt(dailyRets.reduce((a, b) => a + (b - meanRet) ** 2, 0) / dailyRets.length)
    : 0;
  // Build forecast points
  const lastDate = priceChart[priceChart.length - 1].date;
  const lastDt = new Date(lastDate);
  const forecast = [];
  // Add an anchor point connecting to the last actual price
  forecast.push({ date: lastDate, fcMid: last, fcUp: last, fcLo: last });
  for (let k = 1; k <= projectDays; k++) {
    const projected = intercept + slope * (recent.length - 1 + k);
    const widening = sigma * Math.sqrt(k) * 2; // 2-sigma cone
    const dt = new Date(lastDt);
    dt.setDate(dt.getDate() + k);
    forecast.push({
      date: dt.toISOString().split('T')[0],
      fcMid: projected,
      fcUp: projected * (1 + widening),
      fcLo: projected * (1 - widening),
    });
  }
  // Combine: priceChart + forecast (forecast keys won't conflict with price keys)
  const combinedChart = [...priceChart];
  forecast.slice(1).forEach(f => combinedChart.push({ date: f.date, fcMid: f.fcMid, fcUp: f.fcUp, fcLo: f.fcLo }));
  // Backfill the last actual point with forecast anchor so the line connects
  if (combinedChart.length > forecast.length - 1) {
    const lastIdx = priceChart.length - 1;
    combinedChart[lastIdx].fcMid = last;
    combinedChart[lastIdx].fcUp = last;
    combinedChart[lastIdx].fcLo = last;
  }

  const monthNames = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  const seasonalityChart = avgMonthly.map((v, i) => ({
    month: monthNames[i],
    avgReturn: parseFloat(v.toFixed(2)),
    isCurrent: i === currentMonth,
  }));

  // Sub-action labels for the rating cards
  const ratingLabel = (val) => {
    if (val == null) return { label: 'N/D',           color: '#555555' };
    if (val >= 75) return { label: 'STRONG BUY',  color: '#00e676' };
    if (val >= 60) return { label: 'BUY',         color: '#66bb6a' };
    if (val >= 45) return { label: 'HOLD',        color: '#ffa726' };
    if (val >= 30) return { label: 'SELL',        color: '#ef5350' };
    return         { label: 'STRONG SELL', color: '#ff1744' };
  };
  const macroRating       = ratingLabel(macro);
  const technicalRating   = ratingLabel(technical);
  const seasonalityRating = ratingLabel(seasonality);
  const fundamentalsRating = ratingLabel(fundamentalsScore);
  const analystRatingObj  = ratingLabel(analystScore);

  // Statistical opportunities — flag confluence / mean-reversion / value gaps
  const opportunities = [];
  const positiveScores = [macro, technical, seasonality, fundamentalsScore, analystScore].filter(s => s != null && s >= 60).length;
  const totalScored = [macro, technical, seasonality, fundamentalsScore, analystScore].filter(s => s != null).length;

  if (totalScored >= 4 && positiveScores >= 4) {
    opportunities.push({
      strength: 'high', kind: 'confluenza',
      title: 'Confluenza Forte',
      reason: `${positiveScores} fattori su ${totalScored} sopra 60. Setup statisticamente robusto: macro, tecnico e fondamentali allineati.`,
    });
  }

  if (rsi < 30 && macro >= 55) {
    opportunities.push({
      strength: 'medium', kind: 'mean-reversion',
      title: 'Mean Reversion Setup',
      reason: `RSI ${rsi.toFixed(0)} ipervenduto in regime macro favorevole (${BUCKET_LABEL[bucket] || bucket}): rimbalzo statisticamente probabile.`,
    });
  }

  if (fundamentalsScore != null && fundamentalsScore >= 70 && technical < 50) {
    opportunities.push({
      strength: 'high', kind: 'value',
      title: 'Value Opportunity',
      reason: `Fondamentali forti (${fundamentalsScore}/100) ma tecnico debole (${technical}/100): possibile entry su mispricing.`,
    });
  }

  if (analystScore != null && fundamentals?.targetMeanPrice && last > 0) {
    const upside = ((fundamentals.targetMeanPrice - last) / last) * 100;
    if (upside > 15) {
      opportunities.push({
        strength: upside > 25 ? 'high' : 'medium', kind: 'analyst-upside',
        title: 'Target Analisti Distante',
        reason: `Target medio analisti $${fundamentals.targetMeanPrice.toFixed(2)} = +${upside.toFixed(1)}% di upside vs prezzo attuale.`,
      });
    }
  }

  if (seasonality >= 65 && technical >= 55 && (macro >= 50)) {
    opportunities.push({
      strength: 'medium', kind: 'seasonal',
      title: 'Stagionalità Favorevole',
      reason: `Mese storicamente forte (+${currentMonthAvg.toFixed(1)}%/mo medio) con tecnico positivo e macro neutrale.`,
    });
  }

  // Breakout: price above max of last 60 days
  const last60Max = Math.max(...closes.slice(-60));
  const last60MinusBuffer = closes.slice(-60, -1);
  if (last60MinusBuffer.length > 0 && last >= Math.max(...last60MinusBuffer) * 0.998) {
    opportunities.push({
      strength: 'medium', kind: 'breakout',
      title: 'Breakout 60 giorni',
      reason: `Prezzo ai massimi degli ultimi 60 giorni ($${last60Max.toFixed(2)}): possibile prosecuzione del trend.`,
    });
  }

  // Z-score deviation from SMA50
  if (sma50 != null) {
    const dev = ((last - sma50) / sma50) * 100;
    if (dev < -10 && macro >= 55) {
      opportunities.push({
        strength: 'medium', kind: 'pullback',
        title: 'Pullback su Trend',
        reason: `Prezzo ${Math.abs(dev).toFixed(1)}% sotto SMA50 ma macro favorevole: possibile occasione su retracement.`,
      });
    }
  }

  return {
    last,
    sma50, sma200, rsi,
    trendShort: { value: trendShort, ...classifyTrend(trendShort) },
    trendMedium: { value: trendMedium, ...classifyTrend(trendMedium) },
    trendLong: { value: trendLong, ...classifyTrend(trendLong) },
    technical: Math.round(technical), technicalRating,
    macro: Math.round(macro), macroRating,
    seasonality: Math.round(seasonality), seasonalityRating,
    fundamentalsScore, fundamentalsRating,
    analystScore, analystRating: analystRatingObj,
    fundamentals, // raw data for display
    opportunities,
    combinedChart,
    currentMonthAvg,
    score,
    action, actionColor, actionDesc,
    attention,
    priceChart,
    seasonalityChart,
  };
};

const ScoreGauge = ({ score, action, color, theme }) => {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" stroke={theme === 'dark' ? '#1a1a1a' : '#e5e7eb'} strokeWidth="10" fill="none" />
          <motion.circle
            cx="60" cy="60" r="50"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${pct * 3.14} 314`}
            initial={{ strokeDasharray: '0 314' }}
            animate={{ strokeDasharray: `${pct * 3.14} 314` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}99)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black font-mono" style={{ color }}>{score}</span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#555]">/ 100</span>
        </div>
      </div>
      <div
        className="px-4 py-2 rounded font-mono font-black uppercase tracking-widest text-sm border"
        style={{ color, borderColor: `${color}66`, background: `${color}15` }}
      >
        {action}
      </div>
    </div>
  );
};

const SubScoreBar = ({ label, value, color, theme }) => (
  <div>
    <div className="flex justify-between mb-1.5">
      <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>{label}</span>
      <span className="text-xs font-mono font-bold" style={{ color }}>{value}/100</span>
    </div>
    <div className="h-2 rounded-full bg-black/30 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}aa` }}
      />
    </div>
  </div>
);

const TrendBadge = ({ label, trend, theme }) => (
  <div className={`${theme.card} border ${theme.borderLight} rounded p-3 flex flex-col gap-1.5`}>
    <span className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>{label}</span>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-black font-mono" style={{ color: trend.color }}>
        {trend.value != null ? `${trend.value >= 0 ? '+' : ''}${trend.value.toFixed(1)}%` : 'N/D'}
      </span>
    </div>
    <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: trend.color }}>
      {trend.label}
    </span>
  </div>
);

// 0-100 colored scale strip with arrow indicator
const ScoreScaleBar = ({ score }) => {
  const buckets = [
    { v: 10, c: '#ff1744' }, { v: 20, c: '#ff5722' }, { v: 30, c: '#ff7043' },
    { v: 40, c: '#ffa726' }, { v: 50, c: '#ffd54f' }, { v: 60, c: '#cddc39' },
    { v: 70, c: '#9ccc65' }, { v: 80, c: '#66bb6a' }, { v: 90, c: '#00e676' },
  ];
  const activeIdx = Math.max(0, Math.min(8, Math.floor(score / 10)));
  return (
    <div className="flex flex-col items-center gap-1.5 mt-3">
      <div className="flex gap-0.5">
        {buckets.map((b, i) => (
          <span
            key={b.v}
            className={`w-7 h-5 flex items-center justify-center text-[9px] font-mono font-bold rounded-sm transition-all ${i === activeIdx ? 'ring-1 ring-white/60 scale-110' : ''}`}
            style={{ background: b.c, color: '#000', opacity: i === activeIdx ? 1 : 0.45 }}
          >
            {b.v}
          </span>
        ))}
      </div>
      <span className="text-[8px] font-mono uppercase tracking-widest text-[#555] -mt-1">
        ▲ {score} / 100
      </span>
    </div>
  );
};

// Card per macro / tecnico / stagionalità rating
const RatingCard = ({ icon, title, label, action, color, rating, theme }) => {
  const naCard = rating == null;
  return (
    <div className={`${theme.panel} border ${theme.border} rounded-lg overflow-hidden glow-panel ${naCard ? 'opacity-60' : ''}`}>
      <div className="px-5 pt-4 pb-3 border-b border-[var(--c-border)]">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted}`}>{title}</span>
        </div>
      </div>
      <div className="px-5 py-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          <span className="font-mono font-black text-xl" style={{ color }}>{action}</span>
        </div>
        <div className={`text-xs font-mono ${theme.textMuted}`}>
          Rating: <span className={theme.textBold}>{naCard ? 'N/D' : `${rating}/100`}</span>
        </div>
      </div>
      <div className="px-5 pb-4">
        <p className={`text-[11px] font-mono ${theme.textMuted} leading-relaxed text-center italic`}>{label}</p>
      </div>
    </div>
  );
};

// Statistical opportunity panel — highlights confluence / mean-reversion / value gaps
const OpportunityPanel = ({ opportunities, theme }) => {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className={`${theme.panel} border ${theme.border} rounded-lg p-5 glow-panel`}>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-[#555]" />
          <h4 className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted}`}>
            Vantaggio Statistico
          </h4>
        </div>
        <p className={`text-xs font-mono italic ${theme.textMuted}`}>
          Nessuna opportunità statistica rilevante in questo momento. Nessun setup di confluenza, mean-reversion o value gap soddisfa i criteri.
        </p>
      </div>
    );
  }
  return (
    <div className={`${theme.panel} border ${theme.border} rounded-lg p-5 glow-panel`}
      style={{ borderColor: opportunities.some(o => o.strength === 'high') ? '#00e67655' : '#ffa72655' }}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-[#00e676]" />
        <h4 className="text-[11px] font-mono uppercase tracking-widest font-bold text-[#00e676]">
          Vantaggio Statistico · {opportunities.length} segnale{opportunities.length === 1 ? '' : 'i'}
        </h4>
      </div>
      <div className="space-y-3">
        {opportunities.map((o, i) => {
          const c = o.strength === 'high' ? '#00e676' : '#ffa726';
          return (
            <div key={i} className="flex items-start gap-3 pb-3 border-b border-[var(--c-border)] last:border-b-0 last:pb-0">
              <div className="flex items-center justify-center w-7 h-7 rounded flex-shrink-0 mt-0.5"
                style={{ background: `${c}15`, border: `1px solid ${c}55` }}>
                <Zap className="w-3.5 h-3.5" style={{ color: c }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-sm" style={{ color: c }}>{o.title}</span>
                  <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold"
                    style={{ background: `${c}15`, color: c }}>
                    {o.strength === 'high' ? 'FORTE' : 'MEDIO'}
                  </span>
                </div>
                <p className={`mt-1 text-xs font-mono leading-relaxed ${theme.textMuted}`}>{o.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Advanced price chart with Bollinger Bands, SMAs, optional forecast cone, volume
const AdvancedPriceChart = ({ data, showForecast, theme }) => {
  // Compute volume max for scaling (volume in lower band)
  const maxVol = Math.max(...data.map(d => d.volume || 0));
  const volScale = (v) => maxVol > 0 ? v / maxVol : 0;
  // Use ComposedChart-like setup with two line series and area for BBs
  return (
    <div className="h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} interval={Math.floor(data.length / 10)} />
          <YAxis tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} domain={['auto', 'auto']} width={55} />
          <Tooltip
            contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText, border: `1px solid ${theme.chart.tooltipBorder}`, fontSize: 11 }}
            itemStyle={{ color: theme.chart.tooltipText }}
            labelStyle={{ color: theme.chart.tooltipText }}
            formatter={(v) => v != null ? `$${Number(v).toFixed(2)}` : '—'}
          />
          {/* Bollinger Bands */}
          <Line type="monotone" dataKey="bbUp" stroke="#ec407a" strokeOpacity={0.6} dot={false} strokeWidth={1} isAnimationActive={false} name="BB Up" />
          <Line type="monotone" dataKey="bbLo" stroke="#26c6da" strokeOpacity={0.6} dot={false} strokeWidth={1} isAnimationActive={false} name="BB Low" />
          {/* Price */}
          <Line type="monotone" dataKey="close" stroke="#ff8c00" dot={false} strokeWidth={2} isAnimationActive={false} name="Prezzo" />
          {/* SMAs */}
          <Line type="monotone" dataKey="sma50" stroke="#64b5f6" dot={false} strokeWidth={1} strokeDasharray="4 2" isAnimationActive={false} name="SMA50" />
          <Line type="monotone" dataKey="sma200" stroke="#a78bfa" dot={false} strokeWidth={1} strokeDasharray="6 3" isAnimationActive={false} name="SMA200" />
          {/* Forecast cone */}
          {showForecast && <Line type="monotone" dataKey="fcMid" stroke="#ffd740" strokeDasharray="4 4" dot={false} strokeWidth={1.5} isAnimationActive={false} connectNulls={false} name="Forecast" />}
          {showForecast && <Line type="monotone" dataKey="fcUp"  stroke="#ec407a" strokeDasharray="2 3" strokeOpacity={0.6} dot={false} strokeWidth={1} isAnimationActive={false} connectNulls={false} name="Cone Up" />}
          {showForecast && <Line type="monotone" dataKey="fcLo"  stroke="#26c6da" strokeDasharray="2 3" strokeOpacity={0.6} dot={false} strokeWidth={1} isAnimationActive={false} connectNulls={false} name="Cone Low" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Compact sparkline rendered as inline SVG (no Recharts needed)
const Sparkline = ({ data, color, width = 100, height = 28 }) => {
  if (!data || data.length < 2) return null;
  const ys = data.map(d => d.c);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const path = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d.c - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${color}66)` }} />
    </svg>
  );
};

// Pct cell with up/down arrow
const PctCell = ({ value }) => {
  if (value == null || isNaN(value)) return <span className="text-[#555] font-mono text-xs">—</span>;
  const positive = value >= 0;
  const color = positive ? '#00e676' : '#ff1744';
  return (
    <span className="font-mono text-xs font-bold inline-flex items-center gap-1" style={{ color }}>
      {positive ? '+' : ''}{value.toFixed(2)}%
      <span className="text-[10px]">{positive ? '↑' : '↓'}</span>
    </span>
  );
};

const ActionBadge = ({ action, color }) => (
  <span
    className="inline-block px-3 py-1 rounded text-[10px] font-mono font-black uppercase tracking-widest"
    style={{ background: color, color: '#000' }}
  >
    {action}
  </span>
);

const RowSkeleton = ({ theme }) => (
  <tr className={`border-t ${theme.borderLight}`}>
    <td colSpan={7} className="px-4 py-3">
      <div className="h-4 bg-[var(--c-card)] rounded animate-pulse w-full" />
    </td>
  </tr>
);

// Section table with rows of analyzed instruments
const SectionTable = ({ title, items, analyses, isLoading, onSelect, selectedSym, theme }) => {
  if (!items || items.length === 0) return null;
  const rows = items.map(item => ({ item, summary: analyses[item.sym] }));
  // Sort rows: with summary first (by score desc), then loading
  rows.sort((a, b) => {
    if (a.summary && !b.summary) return -1;
    if (!a.summary && b.summary) return 1;
    if (a.summary && b.summary) return b.summary.score - a.summary.score;
    return 0;
  });

  return (
    <div className="mb-6">
      {title && (
        <h4 className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted} mb-3 flex items-center gap-2`}>
          <span className="h-px flex-1 bg-[var(--c-border)]" />
          <span>{title}</span>
          <span className="opacity-60">{items.length}</span>
          <span className="h-px flex-1 bg-[var(--c-border)]" />
        </h4>
      )}
      <div className={`${theme.panel} border ${theme.border} rounded-lg overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
              <th className="px-4 py-3 text-left font-semibold">Strumento</th>
              <th className="px-4 py-3 text-center font-semibold">Posizionamento</th>
              <th className="px-4 py-3 text-center font-semibold">SniperScore</th>
              <th className="px-4 py-3 text-right font-semibold">1D %</th>
              <th className="px-4 py-3 text-right font-semibold">1W %</th>
              <th className="px-4 py-3 text-right font-semibold">1M %</th>
              <th className="px-4 py-3 text-right font-semibold">Momentum</th>
              <th className="px-4 py-3 text-right font-semibold">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, summary }) => {
              const active = selectedSym === item.sym;
              if (!summary) {
                return (
                  <tr
                    key={item.sym}
                    onClick={() => onSelect(item)}
                    className={`border-t ${theme.borderLight} cursor-pointer transition-colors ${active ? 'bg-[#ff8c00]/5' : `${theme.cardHover}`}`}
                  >
                    <td className="px-4 py-3 text-sm font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${theme.textBold}`}>{item.sym}</span>
                        <span className={`text-[10px] ${theme.textMuted}`}>{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center" colSpan={7}>
                      <span className={`text-[10px] font-mono italic ${theme.textMuted}`}>
                        {isLoading ? 'Caricamento...' : 'Dati non disponibili'}
                      </span>
                    </td>
                  </tr>
                );
              }
              const momentumColor = summary.momentum >= 0 ? '#00e676' : '#ff1744';
              return (
                <tr
                  key={item.sym}
                  onClick={() => onSelect(item)}
                  className={`border-t ${theme.borderLight} cursor-pointer transition-colors ${active ? 'bg-[#ff8c00]/10' : `${theme.cardHover}`}`}
                >
                  <td className="px-4 py-3 text-sm font-mono">
                    <div className="flex flex-col">
                      <span className={`font-bold ${theme.textBold}`}>{item.sym}</span>
                      <span className={`text-[10px] ${theme.textMuted}`}>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ActionBadge action={summary.action} color={summary.actionColor} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-block min-w-[42px] px-2 py-1 rounded text-xs font-mono font-black"
                      style={{ background: `${summary.actionColor}15`, color: summary.actionColor, border: `1px solid ${summary.actionColor}40` }}
                    >
                      {summary.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right"><PctCell value={summary.r1d} /></td>
                  <td className="px-4 py-3 text-right"><PctCell value={summary.r1w} /></td>
                  <td className="px-4 py-3 text-right"><PctCell value={summary.r1m} /></td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-xs font-bold" style={{ color: momentumColor }}>
                      {summary.momentum >= 0 ? '+' : ''}{summary.momentum.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex">
                      <Sparkline data={summary.sparkline} color={summary.sparkColor} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && isLoading && (
              <>
                <RowSkeleton theme={theme} />
                <RowSkeleton theme={theme} />
                <RowSkeleton theme={theme} />
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function StockAnalyzer({ regimeLabel, isDark, theme }) {
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(null);
  const [options, setOptions] = useState(null);
  const [fundamentals, setFundamentals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('us-indices');
  const [showForecast, setShowForecast] = useState(false);
  // Cache: { [symbol]: { history: [...], summary: {...} } }
  const [cache, setCache] = useState({});
  const [batchLoading, setBatchLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return INSTRUMENT_UNIVERSE.filter(s => {
      if (activeCategory !== 'all' && s.cat !== activeCategory) return false;
      if (q && !s.sym.includes(q) && !s.name.toUpperCase().includes(q)) return false;
      return true;
    });
  }, [search, activeCategory]);

  // Group filtered results by [category →] bucket for ordered display
  const groupedFiltered = useMemo(() => {
    const groups = new Map();
    filtered.forEach(item => {
      // Use category label when "all" is active, bucket label otherwise
      const key = activeCategory === 'all' ? item.cat : item.bucket;
      const label = activeCategory === 'all'
        ? (CATEGORIES.find(c => c.id === item.cat)?.label || item.cat)
        : (BUCKET_LABEL[item.bucket] || item.bucket);
      if (!groups.has(key)) groups.set(key, { label, items: [] });
      groups.get(key).items.push(item);
    });
    return Array.from(groups.values());
  }, [filtered, activeCategory]);

  const load = useCallback(async (instrument) => {
    setLoading(true);
    setError(null);
    setHistory(null);
    setOptions(null);
    setFundamentals(null);
    try {
      const histPromise = fetchStockHistory(instrument.sym);
      const optsPromise = instrument.hasOptions
        ? fetchOptions(instrument.sym).catch(() => null)
        : Promise.resolve(null);
      // Only stocks have meaningful fundamentals; ETFs, forex, crypto skip this
      const fundPromise = instrument.type === 'stock'
        ? fetchFundamentals(instrument.sym).catch(() => null)
        : Promise.resolve(null);
      const [data, opts, fund] = await Promise.all([histPromise, optsPromise, fundPromise]);
      if (!data || data.length < 60) throw new Error('Dati insufficienti');
      setHistory(data);
      setOptions(opts);
      setFundamentals(fund);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) load(selected);
  }, [selected, load]);

  const analysis = useMemo(
    () => selected && history ? computeAnalysis(history, regimeLabel, selected.bucket, fundamentals) : null,
    [history, regimeLabel, selected, fundamentals]
  );

  const optionLevels = useMemo(() => computeOptionLevels(options), [options]);

  // Pre-fetch all instruments in the active category for the table view
  useEffect(() => {
    let cancelled = false;
    const toFetch = filtered.filter(i => !cache[i.sym]);
    if (toFetch.length === 0) {
      setBatchLoading(false);
      return;
    }
    setBatchLoading(true);
    // Process in chunks of 6 to avoid overloading the proxy chain
    const chunkSize = 6;
    (async () => {
      for (let i = 0; i < toFetch.length; i += chunkSize) {
        if (cancelled) return;
        const chunk = toFetch.slice(i, i + chunkSize);
        const results = await Promise.allSettled(
          chunk.map(async (item) => {
            const data = await fetchStockHistory(item.sym);
            return { item, data };
          })
        );
        if (cancelled) return;
        const updates = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value.data) {
            const summary = computeRowSummary(r.value.data, regimeLabel, r.value.item.bucket);
            updates[r.value.item.sym] = { history: r.value.data, summary };
          } else if (r.status === 'fulfilled') {
            updates[r.value.item.sym] = { history: null, summary: null };
          }
        });
        setCache(prev => ({ ...prev, ...updates }));
      }
      if (!cancelled) setBatchLoading(false);
    })();
    return () => { cancelled = true; };
  }, [filtered, regimeLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-compute summaries when regime changes (without re-fetching)
  useEffect(() => {
    setCache(prev => {
      const next = {};
      Object.entries(prev).forEach(([sym, entry]) => {
        if (entry.history) {
          const inst = INSTRUMENT_UNIVERSE.find(i => i.sym === sym);
          const summary = inst ? computeRowSummary(entry.history, regimeLabel, inst.bucket) : null;
          next[sym] = { ...entry, summary };
        } else {
          next[sym] = entry;
        }
      });
      return next;
    });
  }, [regimeLabel]);

  // Build summary lookup for tables
  const analyses = useMemo(() => {
    const out = {};
    Object.entries(cache).forEach(([sym, entry]) => {
      if (entry.summary) out[sym] = entry.summary;
    });
    return out;
  }, [cache]);

  return (
    <div className={`${theme.panel} border ${theme.border} rounded-lg p-6 glow-panel`}>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-[#ff8c00]" />
          <div>
            <h3 className="text-[11px] uppercase tracking-widest font-mono font-bold text-[#ff8c00]">
              Multi-Asset Screener
            </h3>
            <p className={`text-sm ${theme.textMuted} font-mono`}>
              {INSTRUMENT_UNIVERSE.length} strumenti · score basato su macro · tecnico · stagionalità · regime <span className="text-[#ff8c00] font-bold">{regimeLabel}</span>
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            type="text"
            placeholder="Cerca ticker / nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`pl-9 pr-3 py-2 rounded text-xs font-mono border ${theme.border} bg-[#000000] text-[#e0e0e0] placeholder:text-[#555] focus:border-[#ff8c00]/50 focus:outline-none w-56`}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map(c => {
          const active = activeCategory === c.id;
          const count = c.id === 'all'
            ? INSTRUMENT_UNIVERSE.length
            : INSTRUMENT_UNIVERSE.filter(i => i.cat === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border transition-all ${
                active
                  ? 'bg-[#ff8c00]/15 text-[#ff8c00] border-[#ff8c00]/40'
                  : `${theme.card} ${theme.textMuted} border-[var(--c-border)] hover:text-[#e0e0e0] hover:border-[#ff8c00]/20`
              }`}
            >
              {c.label} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Instrument tables — grouped by section */}
      <div className="mb-6">
        {groupedFiltered.length === 0 && (
          <span className={`text-xs font-mono ${theme.textMuted}`}>Nessuno strumento corrisponde alla ricerca.</span>
        )}
        {batchLoading && Object.keys(analyses).length === 0 && (
          <div className={`flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
            <RefreshCw className="w-3 h-3 animate-spin" />
            Caricamento dati di mercato...
          </div>
        )}
        {groupedFiltered.map(group => (
          <SectionTable
            key={group.label}
            title={group.label}
            items={group.items}
            analyses={analyses}
            isLoading={batchLoading}
            onSelect={setSelected}
            selectedSym={selected?.sym}
            theme={theme}
          />
        ))}
      </div>

      {!selected && (
        <div className={`text-center py-8 ${theme.textMuted} text-sm font-mono italic border-t ${theme.border}`}>
          Clicca una riga per aprire l&apos;analisi dettagliata dello strumento.
        </div>
      )}

      {selected && loading && (
        <div className="flex flex-col items-center py-12 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#ff8c00]" />
          <span className={`text-xs font-mono uppercase tracking-widest ${theme.textMuted}`}>
            Caricamento {selected.sym}...
          </span>
        </div>
      )}

      {selected && error && (
        <div className="p-4 rounded border border-[#ff1744]/40 bg-[#ff1744]/10 text-[#ff1744] text-sm font-mono">
          {error}
        </div>
      )}

      {selected && analysis && !loading && (
        <motion.div
          key={selected.sym}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-baseline justify-between flex-wrap gap-3 pb-4 border-b border-[var(--c-border)]">
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl font-black font-mono text-[#ff8c00]">{selected.sym}</span>
                <span className={`text-sm ${theme.textBold}`}>{selected.name}</span>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
                  {BUCKET_LABEL[selected.bucket] || selected.bucket}
                </span>
                <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border ${theme.border} ${theme.textMuted}`}>
                  {selected.type}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className={`text-3xl font-black font-mono ${theme.textBold}`}>
                  ${analysis.last.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-[#555]">
                  RSI {analysis.rsi.toFixed(0)} · SMA50 ${analysis.sma50?.toFixed(2)} · SMA200 ${analysis.sma200?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Big chart + SniperScore gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-stretch">
            <div className={`${theme.panel} border ${theme.border} rounded-lg p-4 glow-panel`}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#ff8c00]">
                  Grafico avanzato · Bollinger Bands · SMA50/200
                </span>
                <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showForecast}
                    onChange={(e) => setShowForecast(e.target.checked)}
                    className="accent-[#ffd740]"
                  />
                  <span className={showForecast ? 'text-[#ffd740]' : theme.textMuted}>Mostra previsione</span>
                </label>
              </div>
              <AdvancedPriceChart data={analysis.combinedChart} showForecast={showForecast} theme={theme} />
            </div>
            <div className={`${theme.panel} border ${theme.border} rounded-lg p-5 glow-panel flex flex-col items-center justify-center`}>
              <h4 className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted} mb-1 self-start`}>
                SniperScore
              </h4>
              <div className="h-px w-full bg-[#ff8c00]/30 mb-3" />
              <span
                className="font-mono font-black text-2xl uppercase tracking-widest mb-2"
                style={{ color: analysis.actionColor }}
              >
                {analysis.action}
              </span>
              <ScoreGauge score={analysis.score} action="" color={analysis.actionColor} theme={isDark ? 'dark' : 'light'} />
              <ScoreScaleBar score={analysis.score} />
              <p className={`mt-3 text-[10px] font-mono leading-relaxed text-center ${theme.textMuted}`}>
                Basato sul rating tecnico, fondamentali macro e stagionalità.
              </p>
            </div>
          </div>

          {/* 5 Rating Cards: MACRO / TECNICO / FONDAMENTALE / ANALISTI / STAGIONALITÀ */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <RatingCard
              icon={<Layers className="w-3.5 h-3.5 text-[#ff8c00]" />}
              title="MACRO"
              action={regimeLabel}
              color={analysis.macroRating.color}
              rating={analysis.macro}
              label="Rating basato sul regime macroeconomico e fit settoriale."
              theme={theme}
            />
            <RatingCard
              icon={<BarChart3 className="w-3.5 h-3.5 text-[#ff8c00]" />}
              title="TECNICO"
              action={analysis.technicalRating.label}
              color={analysis.technicalRating.color}
              rating={analysis.technical}
              label="Calcolato dai livelli e trend tecnici (SMA, RSI)."
              theme={theme}
            />
            <RatingCard
              icon={<DollarSign className="w-3.5 h-3.5 text-[#ff8c00]" />}
              title="FONDAMENTALE"
              action={analysis.fundamentalsRating.label}
              color={analysis.fundamentalsRating.color}
              rating={analysis.fundamentalsScore}
              label={analysis.fundamentalsScore != null
                ? "P/E, ROE, margini, debito, crescita ricavi/utili."
                : "Non applicabile a indici, ETF, commodity, forex."}
              theme={theme}
            />
            <RatingCard
              icon={<Users className="w-3.5 h-3.5 text-[#ff8c00]" />}
              title="ANALISTI"
              action={analysis.analystRating.label}
              color={analysis.analystRating.color}
              rating={analysis.analystScore}
              label={analysis.analystScore != null
                ? `Consensus ${analysis.fundamentals?.numberOfAnalysts || '–'} analisti${analysis.fundamentals?.targetMeanPrice ? ` · target $${analysis.fundamentals.targetMeanPrice.toFixed(2)}` : ''}.`
                : "Coverage analisti non disponibile."}
              theme={theme}
            />
            <RatingCard
              icon={<Calendar className="w-3.5 h-3.5 text-[#ff8c00]" />}
              title="STAGIONALITÀ"
              action={analysis.seasonalityRating.label}
              color={analysis.seasonalityRating.color}
              rating={analysis.seasonality}
              label={`Mese corrente: media storica ${analysis.currentMonthAvg >= 0 ? '+' : ''}${analysis.currentMonthAvg.toFixed(2)}%/mo.`}
              theme={theme}
            />
          </div>

          {/* Vantaggio Statistico — opportunity flags */}
          <OpportunityPanel opportunities={analysis.opportunities} theme={theme} />

          {/* Trends */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#ff8c00] font-bold mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Trend per orizzonte
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <TrendBadge label="Breve · 1M" trend={analysis.trendShort} theme={theme} />
              <TrendBadge label="Medio · 3M" trend={analysis.trendMedium} theme={theme} />
              <TrendBadge label="Lungo · 12M" trend={analysis.trendLong} theme={theme} />
            </div>
          </div>

          {/* Attention */}
          {analysis.attention.length > 0 && (
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#ff8c00] font-bold mb-3">
                Livelli di attenzione
              </h4>
              <div className="space-y-2">
                {analysis.attention.map((a, i) => {
                  const c = a.level === 'high' ? '#ff1744' : a.level === 'medium' ? '#ffa726' : '#00e676';
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs font-mono" style={{ color: c }}>
                      <span className="mt-0.5">●</span>
                      <span>{a.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stagionalità */}
          <div>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#ff8c00] font-bold mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Stagionalità · ritorno medio mensile (2Y)
              </h4>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.seasonalityChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} />
                    <YAxis tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText, border: `1px solid ${theme.chart.tooltipBorder}`, fontSize: 11 }}
                      itemStyle={{ color: theme.chart.tooltipText }}
                      labelStyle={{ color: theme.chart.tooltipText }}
                      formatter={(v) => `${Number(v).toFixed(2)}%`}
                    />
                    <ReferenceLine y={0} stroke={theme.chart.axis} />
                    <Bar dataKey="avgReturn" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                      {analysis.seasonalityChart.map((d, i) => (
                        <Cell
                          key={i}
                          fill={d.isCurrent ? '#ff8c00' : d.avgReturn >= 0 ? '#00e676' : '#ff1744'}
                          fillOpacity={d.isCurrent ? 1 : 0.7}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className={`text-[10px] font-mono ${theme.textMuted} mt-2 text-center`}>
                Mese corrente in <span className="text-[#ff8c00] font-bold">arancione</span> · media storica {analysis.currentMonthAvg.toFixed(2)}%
              </p>
            </div>

          {/* Options levels (only if instrument has options + chain loaded) */}
          {selected.hasOptions && optionLevels && (
            <OptionsPanel levels={optionLevels} expiry={options?.expiry} theme={theme} />
          )}
          {selected.hasOptions && !optionLevels && !loading && (
            <div className={`text-xs font-mono ${theme.textMuted} italic px-3 py-2 border-l-2 border-[#ff8c00]/30`}>
              Catena opzioni non disponibile per questo strumento.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// =============================================================
// Options Panel — Open Interest levels, Max Pain, P/C ratio, IV
// =============================================================
function OptionsPanel({ levels, expiry, theme }) {
  const { strikes, topCalls, topPuts, maxPain, pcRatio, atmIv, spot } = levels;

  // Limit chart to ±25% around spot for readability
  const minStrike = spot * 0.75;
  const maxStrike = spot * 1.25;
  const chartData = strikes
    .filter(s => s.strike >= minStrike && s.strike <= maxStrike)
    .map(s => ({ strike: s.strike, callOi: s.callOi, putOi: -s.putOi })); // negative for diverging chart

  const pcRatioColor = pcRatio == null ? '#a0a0a0' : pcRatio > 1.2 ? '#ff1744' : pcRatio < 0.7 ? '#00e676' : '#ffa726';
  const pcRatioLabel = pcRatio == null ? 'N/D' : pcRatio > 1.2 ? 'BEARISH' : pcRatio < 0.7 ? 'BULLISH' : 'NEUTRO';

  return (
    <div className="space-y-5 pt-5 border-t border-[var(--c-border)]">
      <div className="flex items-center gap-3">
        <Layers className="w-5 h-5 text-[#ff8c00]" />
        <div>
          <h4 className="text-[11px] uppercase tracking-widest font-mono font-bold text-[#ff8c00]">
            Livelli Opzioni · Open Interest
          </h4>
          <p className={`text-xs font-mono ${theme.textMuted}`}>
            Scadenza: <span className={theme.textBold}>{expiry?.toLocaleDateString('it-IT') || 'N/D'}</span>
            {' · '}Spot: <span className={theme.textBold}>${spot?.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`${theme.card} border ${theme.borderLight} rounded p-3`}>
          <div className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>Max Pain</div>
          <div className="font-mono font-black text-lg text-[#ffa726]">${maxPain?.toFixed(2) || 'N/D'}</div>
          <div className={`text-[10px] font-mono ${theme.textMuted}`}>Strike di massimo dolore</div>
        </div>
        <div className={`${theme.card} border ${theme.borderLight} rounded p-3`}>
          <div className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>Put/Call OI Ratio</div>
          <div className="font-mono font-black text-lg" style={{ color: pcRatioColor }}>
            {pcRatio != null ? pcRatio.toFixed(2) : 'N/D'}
          </div>
          <div className="text-[10px] font-mono font-bold" style={{ color: pcRatioColor }}>{pcRatioLabel}</div>
        </div>
        <div className={`${theme.card} border ${theme.borderLight} rounded p-3`}>
          <div className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>ATM Implied Vol</div>
          <div className="font-mono font-black text-lg text-[#64b5f6]">
            {atmIv != null ? `${atmIv.toFixed(1)}%` : 'N/D'}
          </div>
          <div className={`text-[10px] font-mono ${theme.textMuted}`}>Volatilità attesa</div>
        </div>
        <div className={`${theme.card} border ${theme.borderLight} rounded p-3`}>
          <div className={`text-[9px] font-mono uppercase tracking-widest ${theme.textMuted}`}>OI Totale</div>
          <div className="font-mono font-bold text-sm">
            <span className="text-[#00e676]">C: {(levels.totalCallOi / 1000).toFixed(1)}K</span>{' / '}
            <span className="text-[#ff1744]">P: {(levels.totalPutOi / 1000).toFixed(1)}K</span>
          </div>
          <div className={`text-[10px] font-mono ${theme.textMuted}`}>Open interest cumulato</div>
        </div>
      </div>

      {/* OI per strike chart */}
      <div>
        <h5 className={`text-[10px] font-mono uppercase tracking-widest font-bold mb-2 ${theme.textMuted}`}>
          Open Interest per Strike (±25% dallo spot)
        </h5>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
              <XAxis dataKey="strike" tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} tickFormatter={(v) => `$${v}`} />
              <YAxis tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} tickFormatter={(v) => Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(0)}K` : Math.abs(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText, border: `1px solid ${theme.chart.tooltipBorder}`, fontSize: 11 }}
                itemStyle={{ color: theme.chart.tooltipText }}
                labelStyle={{ color: theme.chart.tooltipText }}
                formatter={(v, name) => [Math.abs(v).toLocaleString(), name === 'callOi' ? 'Call OI' : 'Put OI']}
                labelFormatter={(v) => `Strike $${v}`}
              />
              <ReferenceLine y={0} stroke={theme.chart.axis} />
              <ReferenceLine x={spot} stroke="#ff8c00" strokeDasharray="3 3" label={{ value: 'Spot', fill: '#ff8c00', fontSize: 10, position: 'top' }} />
              {maxPain && (
                <ReferenceLine x={maxPain} stroke="#ffa726" strokeDasharray="2 2" label={{ value: 'Max Pain', fill: '#ffa726', fontSize: 10, position: 'top' }} />
              )}
              <Bar dataKey="callOi" name="Call OI" fill="#00e676" fillOpacity={0.8} />
              <Bar dataKey="putOi" name="Put OI" fill="#ff1744" fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top strikes lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-[10px] font-mono uppercase tracking-widest font-bold mb-2 text-[#00e676]">
            Top Call Strikes · Resistenze
          </h5>
          <div className={`${theme.card} border ${theme.borderLight} rounded overflow-hidden`}>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className={`${theme.textMuted} text-[9px] uppercase tracking-widest`}>
                  <th className="px-3 py-2 text-left">Strike</th>
                  <th className="px-3 py-2 text-right">OI</th>
                  <th className="px-3 py-2 text-right">Vol</th>
                  <th className="px-3 py-2 text-right">IV</th>
                </tr>
              </thead>
              <tbody>
                {topCalls.map((c, i) => (
                  <tr key={i} className={`border-t ${theme.borderLight}`}>
                    <td className="px-3 py-1.5 font-bold text-[#00e676]">${c.strike.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right">{c.oi.toLocaleString()}</td>
                    <td className={`px-3 py-1.5 text-right ${theme.textMuted}`}>{c.vol.toLocaleString()}</td>
                    <td className={`px-3 py-1.5 text-right ${theme.textMuted}`}>{(c.iv * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h5 className="text-[10px] font-mono uppercase tracking-widest font-bold mb-2 text-[#ff1744]">
            Top Put Strikes · Supporti
          </h5>
          <div className={`${theme.card} border ${theme.borderLight} rounded overflow-hidden`}>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className={`${theme.textMuted} text-[9px] uppercase tracking-widest`}>
                  <th className="px-3 py-2 text-left">Strike</th>
                  <th className="px-3 py-2 text-right">OI</th>
                  <th className="px-3 py-2 text-right">Vol</th>
                  <th className="px-3 py-2 text-right">IV</th>
                </tr>
              </thead>
              <tbody>
                {topPuts.map((p, i) => (
                  <tr key={i} className={`border-t ${theme.borderLight}`}>
                    <td className="px-3 py-1.5 font-bold text-[#ff1744]">${p.strike.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right">{p.oi.toLocaleString()}</td>
                    <td className={`px-3 py-1.5 text-right ${theme.textMuted}`}>{p.vol.toLocaleString()}</td>
                    <td className={`px-3 py-1.5 text-right ${theme.textMuted}`}>{(p.iv * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={`text-[11px] font-mono ${theme.textMuted} italic`}>
        Strike con maggior open interest = livelli "magnetici": call walls fanno da resistenza, put walls da supporto.
        Max Pain = strike a cui scade il maggior numero di opzioni out-of-money.
      </div>
    </div>
  );
}
