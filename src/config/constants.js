// API Configuration
export const EMAILJS_SERVICE_ID = "service_7p5udhx";
export const EMAILJS_TEMPLATE_ID = "template_0ewlpu8";
export const EMAILJS_PUBLIC_KEY = "ISW5UXft6nTZO2dRJ";

// Week Days
export const WEEK_DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

// Initial Filters
export const INITIAL_FILTERS = {
  dir: 'all',
  tradeType: 'all',
  symbols: [],
  strategies: [],
  dateStart: '',
  dateEnd: '',
  rowStart: '',
  rowEnd: ''
};

// Formulas for Analysis Display
export const ANALYSIS_FORMULAS = [
  "Σ = E[(X-μ)(X-μ)ᵀ]",
  "D = sup_x |F_n(x) - F(x)|",
  "dS = μS dt + σS dW",
  "S = (R_p - R_f) / σ_p",
  "A² = -N - Σ(2i-1)/N * ln(F(Y_i))",
  "JB = (N/6)*(S² + (K²)/4)"
];

// Column Configuration Defaults
export const DEFAULT_COL_CONFIG = {
  headerRowIdx: -1,
  symIdx: -1,
  typeIdx: -1,
  dirIdx: -1,
  posIdx: -1,
  commIdx: -1,
  feeIdx: -1,
  swapIdx: -1,
  profitIdx: -1,
  balanceIdx: -1,
  idIdx: -1
};

// Jarque-Bera Critical Value (95% confidence)
export const JB_CRITICAL_VALUE = 5.99;

// Anderson-Darling Critical Value
export const AD_CRITICAL_VALUE = 0.752;

// Market Data URLs
export const MARKET_URLS = {
  spx: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=10y',
};

// Ticker symbols and display names for the market ticker
export const TICKER_SYMBOLS = [
  { symbol: '^GSPC',   name: 'S&P 500' },
  { symbol: '^IXIC',   name: 'NASDAQ' },
  { symbol: '^GDAXI',  name: 'GER 40' },
  { symbol: '^FCHI',   name: 'CAC 40' },
  { symbol: 'GC=F',    name: 'GOLD' },
  { symbol: 'CL=F',    name: 'CRUDE OIL' },
  { symbol: 'BTC-USD', name: 'BTC' },
  { symbol: 'EURUSD=X',name: 'EUR/USD' },
];

// Script URLs
export const SCRIPT_URLS = {
  xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  emailjs: 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
};
