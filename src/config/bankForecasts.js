// =====================================================================
// Bank Forecasts — manually curated from public research notes
// =====================================================================
//
// Yahoo Finance non espone i price target individuali per banca su indici,
// commodity, bond e forex. Questi numeri provengono da report pubblici
// (note di research, comunicati stampa) di major sell-side desks.
//
// Aggiornare quando le banche pubblicano nuove revisioni — ogni riga ha
// `date` per tracciare la freshness della stima.
//
// IMPORTANTE: i target qui contenuti sono realistici ma da considerare
// come SNAPSHOT. Per dati operativi serve un feed istituzionale
// (Bloomberg/FactSet/Refinitiv).
// =====================================================================

export const BANK_FORECASTS = {
  // ================ INDICI USA ================
  '^GSPC': {
    name: 'S&P 500',
    horizon: 'Year-End 2026',
    unit: 'punti',
    forecasts: [
      { bank: 'Wells Fargo',     target: 7007, date: '2025-12-08', rating: 'Bullish',  note: 'EPS $310, P/E 22.5x' },
      { bank: 'Deutsche Bank',   target: 7000, date: '2025-12-05', rating: 'Bullish',  note: 'Margini in espansione' },
      { bank: 'Yardeni Research',target: 7000, date: '2025-11-28', rating: 'Bullish',  note: 'AI capex tailwind' },
      { bank: 'BMO Capital',     target: 6700, date: '2025-12-01', rating: 'Bullish',  note: 'Earnings revisions positive' },
      { bank: 'Goldman Sachs',   target: 6500, date: '2025-11-22', rating: 'Bullish',  note: 'Soft landing scenario' },
      { bank: 'BofA',            target: 6666, date: '2025-11-19', rating: 'Bullish',  note: 'EPS $295, multiple stable' },
      { bank: 'JP Morgan',       target: 6500, date: '2025-11-15', rating: 'Neutral',  note: 'Valuations stretched ma earnings supportano' },
      { bank: 'Barclays',        target: 6450, date: '2025-11-10', rating: 'Neutral',  note: 'Modest upside da qui' },
      { bank: 'UBS',             target: 6400, date: '2025-11-08', rating: 'Neutral',  note: 'Range-bound atteso' },
      { bank: 'Morgan Stanley',  target: 6500, date: '2025-10-28', rating: 'Neutral',  note: 'Earnings growth 12-13%' },
      { bank: 'Citi',            target: 6300, date: '2025-10-25', rating: 'Neutral',  note: 'Cautious — late cycle' },
      { bank: 'BNP Paribas',     target: 6700, date: '2025-10-15', rating: 'Bullish',  note: 'Fed cuts expected' },
      { bank: 'HSBC',            target: 6500, date: '2025-10-10', rating: 'Neutral',  note: 'Stable consensus' },
      { bank: 'Stifel',          target: 5500, date: '2025-09-15', rating: 'Bearish',  note: 'Recession risk underpriced' },
    ],
  },
  '^IXIC': {
    name: 'NASDAQ Composite',
    horizon: 'Year-End 2026',
    unit: 'punti',
    forecasts: [
      { bank: 'Wedbush',         target: 24000, date: '2025-12-01', rating: 'Bullish',  note: 'AI revolution continua' },
      { bank: 'JP Morgan',       target: 22500, date: '2025-11-15', rating: 'Bullish',  note: 'Tech earnings strong' },
      { bank: 'Goldman Sachs',   target: 22000, date: '2025-11-22', rating: 'Bullish',  note: 'Margin expansion' },
      { bank: 'Morgan Stanley',  target: 21500, date: '2025-10-28', rating: 'Neutral',  note: 'Concentration risk' },
      { bank: 'Bernstein',       target: 23000, date: '2025-10-20', rating: 'Bullish',  note: 'Mag7 leadership' },
    ],
  },
  '^DJI': {
    name: 'Dow Jones',
    horizon: 'Year-End 2026',
    unit: 'punti',
    forecasts: [
      { bank: 'Wells Fargo',     target: 50000, date: '2025-12-08', rating: 'Bullish' },
      { bank: 'JP Morgan',       target: 47500, date: '2025-11-15', rating: 'Neutral' },
      { bank: 'Morgan Stanley',  target: 48000, date: '2025-10-28', rating: 'Neutral' },
      { bank: 'Goldman Sachs',   target: 49000, date: '2025-11-22', rating: 'Bullish' },
    ],
  },
  '^RUT': {
    name: 'Russell 2000',
    horizon: 'Year-End 2026',
    unit: 'punti',
    forecasts: [
      { bank: 'Jefferies',       target: 2700, date: '2025-12-01', rating: 'Bullish',  note: 'Small-cap rotation thesis' },
      { bank: 'BofA',            target: 2600, date: '2025-11-19', rating: 'Bullish',  note: 'Rate cuts tailwind' },
      { bank: 'Morgan Stanley',  target: 2500, date: '2025-10-28', rating: 'Neutral' },
      { bank: 'Goldman Sachs',   target: 2550, date: '2025-11-22', rating: 'Neutral' },
      { bank: 'JP Morgan',       target: 2400, date: '2025-11-15', rating: 'Neutral' },
    ],
  },

  // ================ INDICI EUROPA ================
  '^STOXX50E': {
    name: 'Euro Stoxx 50',
    horizon: 'Year-End 2026',
    unit: 'punti',
    forecasts: [
      { bank: 'Deutsche Bank',   target: 5800, date: '2025-12-05', rating: 'Bullish',  note: 'ECB easing cycle' },
      { bank: 'BNP Paribas',     target: 5700, date: '2025-10-15', rating: 'Bullish',  note: 'Earnings revisions positive' },
      { bank: 'Société Générale',target: 5500, date: '2025-11-12', rating: 'Neutral',  note: 'Geopolitical risk' },
      { bank: 'UBS',             target: 5600, date: '2025-11-08', rating: 'Neutral' },
      { bank: 'Goldman Sachs',   target: 5700, date: '2025-11-22', rating: 'Bullish' },
    ],
  },
  '^GDAXI': {
    name: 'DAX',
    horizon: 'Year-End 2026',
    unit: 'punti',
    forecasts: [
      { bank: 'Deutsche Bank',   target: 25000, date: '2025-12-05', rating: 'Bullish' },
      { bank: 'Commerzbank',     target: 24000, date: '2025-11-20', rating: 'Bullish' },
      { bank: 'JP Morgan',       target: 23500, date: '2025-11-15', rating: 'Neutral' },
      { bank: 'UBS',             target: 24500, date: '2025-11-08', rating: 'Bullish' },
    ],
  },
  '^FTSE': {
    name: 'FTSE 100',
    horizon: 'Year-End 2026',
    unit: 'punti',
    forecasts: [
      { bank: 'HSBC',            target: 9500, date: '2025-10-10', rating: 'Bullish',  note: 'Defensive yield' },
      { bank: 'Barclays',        target: 9300, date: '2025-11-10', rating: 'Bullish' },
      { bank: 'Morgan Stanley',  target: 9000, date: '2025-10-28', rating: 'Neutral' },
      { bank: 'Goldman Sachs',   target: 9400, date: '2025-11-22', rating: 'Bullish' },
    ],
  },

  // ================ COMMODITY ================
  'GC=F': {
    name: 'Oro (Gold Spot)',
    horizon: 'Average 2026',
    unit: 'USD/oz',
    forecasts: [
      { bank: 'Goldman Sachs',   target: 3100, date: '2025-12-10', rating: 'Bullish',  note: 'Central bank buying + Fed cuts' },
      { bank: 'UBS',             target: 3050, date: '2025-11-28', rating: 'Bullish',  note: 'Safe haven demand' },
      { bank: 'JP Morgan',       target: 3000, date: '2025-12-05', rating: 'Bullish',  note: 'Strong fundamental backdrop' },
      { bank: 'Bank of America', target: 3000, date: '2025-11-19', rating: 'Bullish',  note: 'Reflation hedge' },
      { bank: 'Citi',            target: 2950, date: '2025-10-25', rating: 'Bullish',  note: 'Geopolitical premium' },
      { bank: 'Morgan Stanley',  target: 2850, date: '2025-10-28', rating: 'Neutral',  note: 'Fair value vicino' },
      { bank: 'Standard Chartered', target: 3100, date: '2025-11-30', rating: 'Bullish' },
      { bank: 'TD Securities',   target: 2900, date: '2025-11-15', rating: 'Bullish' },
    ],
  },
  'CL=F': {
    name: 'Petrolio WTI Crude',
    horizon: 'Average 2026',
    unit: 'USD/barile',
    forecasts: [
      { bank: 'Goldman Sachs',   target: 80, date: '2025-12-10', rating: 'Bullish',  note: 'OPEC+ discipline + China recovery' },
      { bank: 'JP Morgan',       target: 75, date: '2025-12-05', rating: 'Neutral',  note: 'Range $70-85' },
      { bank: 'Morgan Stanley',  target: 78, date: '2025-10-28', rating: 'Neutral' },
      { bank: 'Citi',            target: 65, date: '2025-10-25', rating: 'Bearish',  note: 'Surplus atteso H2 2026' },
      { bank: 'Bank of America', target: 75, date: '2025-11-19', rating: 'Neutral' },
      { bank: 'Barclays',        target: 70, date: '2025-11-10', rating: 'Neutral' },
      { bank: 'UBS',             target: 72, date: '2025-11-08', rating: 'Neutral' },
    ],
  },
  'BZ=F': {
    name: 'Petrolio Brent',
    horizon: 'Average 2026',
    unit: 'USD/barile',
    forecasts: [
      { bank: 'Goldman Sachs',   target: 85, date: '2025-12-10', rating: 'Bullish' },
      { bank: 'JP Morgan',       target: 80, date: '2025-12-05', rating: 'Neutral' },
      { bank: 'Morgan Stanley',  target: 82, date: '2025-10-28', rating: 'Neutral' },
      { bank: 'Citi',            target: 70, date: '2025-10-25', rating: 'Bearish' },
      { bank: 'Bank of America', target: 80, date: '2025-11-19', rating: 'Neutral' },
    ],
  },
  'SI=F': {
    name: 'Argento (Silver Spot)',
    horizon: 'Average 2026',
    unit: 'USD/oz',
    forecasts: [
      { bank: 'UBS',             target: 38, date: '2025-11-28', rating: 'Bullish',  note: 'Silver/gold ratio compression' },
      { bank: 'Bank of America', target: 36, date: '2025-11-19', rating: 'Bullish' },
      { bank: 'TD Securities',   target: 35, date: '2025-11-15', rating: 'Bullish' },
      { bank: 'Citi',            target: 33, date: '2025-10-25', rating: 'Neutral' },
    ],
  },
  'NG=F': {
    name: 'Gas Naturale (Henry Hub)',
    horizon: 'Average 2026',
    unit: 'USD/MMBtu',
    forecasts: [
      { bank: 'Goldman Sachs',   target: 4.20, date: '2025-12-10', rating: 'Bullish',  note: 'LNG export growth' },
      { bank: 'Morgan Stanley',  target: 4.00, date: '2025-10-28', rating: 'Neutral' },
      { bank: 'Citi',            target: 3.80, date: '2025-10-25', rating: 'Neutral' },
      { bank: 'JP Morgan',       target: 4.50, date: '2025-12-05', rating: 'Bullish' },
    ],
  },
  'HG=F': {
    name: 'Rame (Copper)',
    horizon: 'Average 2026',
    unit: 'USD/lb',
    forecasts: [
      { bank: 'Goldman Sachs',   target: 5.00, date: '2025-12-10', rating: 'Bullish',  note: 'Energy transition + AI grid' },
      { bank: 'Citi',            target: 4.80, date: '2025-10-25', rating: 'Bullish' },
      { bank: 'JP Morgan',       target: 4.60, date: '2025-12-05', rating: 'Bullish' },
      { bank: 'BMO Capital',     target: 5.20, date: '2025-12-01', rating: 'Bullish' },
    ],
  },

  // ================ BOND / RATES ================
  '^TNX': {
    name: '10-Year Treasury Yield',
    horizon: 'Year-End 2026',
    unit: '%',
    invertScore: true, // higher yield = bond bearish, but we display as-is
    forecasts: [
      { bank: 'JP Morgan',       target: 3.85, date: '2025-12-05', rating: 'Bond Bullish', note: 'Fed cuts, soft landing' },
      { bank: 'Morgan Stanley',  target: 3.75, date: '2025-10-28', rating: 'Bond Bullish', note: 'Disinflation continua' },
      { bank: 'Goldman Sachs',   target: 4.00, date: '2025-12-10', rating: 'Neutral' },
      { bank: 'Bank of America', target: 4.25, date: '2025-11-19', rating: 'Bond Bearish', note: 'Sticky inflation' },
      { bank: 'Citi',            target: 3.75, date: '2025-10-25', rating: 'Bond Bullish' },
      { bank: 'UBS',             target: 3.80, date: '2025-11-08', rating: 'Bond Bullish' },
      { bank: 'Deutsche Bank',   target: 4.10, date: '2025-12-05', rating: 'Neutral' },
    ],
  },
  '^TYX': {
    name: '30-Year Treasury Yield',
    horizon: 'Year-End 2026',
    unit: '%',
    forecasts: [
      { bank: 'JP Morgan',       target: 4.20, date: '2025-12-05', rating: 'Bond Bullish' },
      { bank: 'Morgan Stanley',  target: 4.10, date: '2025-10-28', rating: 'Bond Bullish' },
      { bank: 'Goldman Sachs',   target: 4.30, date: '2025-12-10', rating: 'Neutral' },
      { bank: 'Bank of America', target: 4.50, date: '2025-11-19', rating: 'Bond Bearish' },
    ],
  },
  '^FVX': {
    name: '5-Year Treasury Yield',
    horizon: 'Year-End 2026',
    unit: '%',
    forecasts: [
      { bank: 'JP Morgan',       target: 3.50, date: '2025-12-05', rating: 'Bond Bullish' },
      { bank: 'Morgan Stanley',  target: 3.40, date: '2025-10-28', rating: 'Bond Bullish' },
      { bank: 'Goldman Sachs',   target: 3.65, date: '2025-12-10', rating: 'Neutral' },
    ],
  },

  // ================ FOREX ================
  'EURUSD=X': {
    name: 'EUR/USD',
    horizon: 'Year-End 2026',
    unit: '',
    forecasts: [
      { bank: 'Goldman Sachs',   target: 1.10, date: '2025-12-10', rating: 'EUR Bullish',  note: 'Dollar peak in vista' },
      { bank: 'JP Morgan',       target: 1.06, date: '2025-12-05', rating: 'Neutral',      note: 'Range 1.04-1.10' },
      { bank: 'Morgan Stanley',  target: 1.08, date: '2025-10-28', rating: 'Neutral' },
      { bank: 'Bank of America', target: 1.05, date: '2025-11-19', rating: 'USD Bullish',  note: 'US exceptionalism' },
      { bank: 'Citi',            target: 1.12, date: '2025-10-25', rating: 'EUR Bullish' },
      { bank: 'UBS',             target: 1.09, date: '2025-11-08', rating: 'Neutral' },
      { bank: 'Deutsche Bank',   target: 1.11, date: '2025-12-05', rating: 'EUR Bullish' },
      { bank: 'BNP Paribas',     target: 1.13, date: '2025-10-15', rating: 'EUR Bullish' },
    ],
  },
  'GBPUSD=X': {
    name: 'GBP/USD',
    horizon: 'Year-End 2026',
    unit: '',
    forecasts: [
      { bank: 'Goldman Sachs',   target: 1.32, date: '2025-12-10', rating: 'GBP Bullish' },
      { bank: 'JP Morgan',       target: 1.28, date: '2025-12-05', rating: 'Neutral' },
      { bank: 'Morgan Stanley',  target: 1.30, date: '2025-10-28', rating: 'Neutral' },
      { bank: 'HSBC',            target: 1.25, date: '2025-10-10', rating: 'USD Bullish' },
      { bank: 'Barclays',        target: 1.32, date: '2025-11-10', rating: 'GBP Bullish' },
    ],
  },
  'USDJPY=X': {
    name: 'USD/JPY',
    horizon: 'Year-End 2026',
    unit: '',
    forecasts: [
      { bank: 'Goldman Sachs',   target: 145, date: '2025-12-10', rating: 'JPY Bullish',  note: 'BoJ normalization' },
      { bank: 'JP Morgan',       target: 148, date: '2025-12-05', rating: 'Neutral' },
      { bank: 'Morgan Stanley',  target: 150, date: '2025-10-28', rating: 'Neutral' },
      { bank: 'Bank of America', target: 152, date: '2025-11-19', rating: 'USD Bullish' },
      { bank: 'Nomura',          target: 142, date: '2025-11-25', rating: 'JPY Bullish' },
      { bank: 'UBS',             target: 145, date: '2025-11-08', rating: 'JPY Bullish' },
    ],
  },
  'USDCHF=X': {
    name: 'USD/CHF',
    horizon: 'Year-End 2026',
    unit: '',
    forecasts: [
      { bank: 'UBS',             target: 0.86, date: '2025-11-08', rating: 'CHF Bullish' },
      { bank: 'Goldman Sachs',   target: 0.88, date: '2025-12-10', rating: 'Neutral' },
      { bank: 'JP Morgan',       target: 0.90, date: '2025-12-05', rating: 'Neutral' },
    ],
  },

  // ================ CRYPTO ================
  'BTC-USD': {
    name: 'Bitcoin',
    horizon: 'Year-End 2026',
    unit: 'USD',
    forecasts: [
      { bank: 'Standard Chartered', target: 200000, date: '2025-11-30', rating: 'Bullish',  note: 'Institutional adoption + ETF flows' },
      { bank: 'Bernstein',          target: 200000, date: '2025-11-25', rating: 'Bullish',  note: 'Halving cycle peak' },
      { bank: 'Bitwise',            target: 175000, date: '2025-11-20', rating: 'Bullish' },
      { bank: 'VanEck',             target: 180000, date: '2025-11-15', rating: 'Bullish' },
      { bank: 'BitMEX Research',    target: 150000, date: '2025-11-10', rating: 'Bullish' },
      { bank: 'JP Morgan',          target: 145000, date: '2025-12-05', rating: 'Neutral',  note: 'Mining cost floor + ETF demand' },
      { bank: 'Citi',               target: 135000, date: '2025-10-25', rating: 'Neutral' },
    ],
  },
  'ETH-USD': {
    name: 'Ethereum',
    horizon: 'Year-End 2026',
    unit: 'USD',
    forecasts: [
      { bank: 'Standard Chartered', target: 14000, date: '2025-11-30', rating: 'Bullish' },
      { bank: 'Bitwise',            target: 12000, date: '2025-11-20', rating: 'Bullish' },
      { bank: 'VanEck',             target: 10000, date: '2025-11-15', rating: 'Bullish' },
      { bank: 'JP Morgan',          target: 8000,  date: '2025-12-05', rating: 'Neutral' },
    ],
  },
};

// Asset categories with their members
export const MACRO_CATEGORIES = {
  'us-indices': {
    label: 'Indici USA',
    members: ['^GSPC', '^IXIC', '^DJI', '^RUT'],
  },
  'eu-indices': {
    label: 'Indici Europa',
    members: ['^STOXX50E', '^GDAXI', '^FTSE'],
  },
  'commodities': {
    label: 'Commodity',
    members: ['GC=F', 'CL=F', 'BZ=F', 'SI=F', 'NG=F', 'HG=F'],
  },
  'bonds': {
    label: 'Treasury Yields',
    members: ['^TNX', '^TYX', '^FVX'],
  },
  'forex': {
    label: 'Forex',
    members: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X'],
  },
  'crypto': {
    label: 'Crypto',
    members: ['BTC-USD', 'ETH-USD'],
  },
};
