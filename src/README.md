# 📊 Quant Terminal - Architettura Modulare

## Struttura del Progetto

```
src/
├── App.jsx                      # Componente principale (refactorizzato)
├── config/                      # Configurazioni globali
│   ├── constants.js            # Costanti (API, URL, formule)
│   └── themes.js               # Sistema tematico (dark/light)
├── utils/                       # Utility functions
│   ├── index.js                # Export barrel
│   ├── math.js                 # Funzioni matematiche (erf, normalCDF, percentili)
│   ├── statistics.js           # Funzioni statistiche (skewness, kurtosis, test di normalità)
│   ├── formatting.js           # Formattazione dati e date
│   └── data-parsing.js         # Parsing file Excel e dati trade
├── hooks/                       # Custom React hooks
│   ├── index.js                # Export barrel
│   ├── useAuth.js              # Logica autenticazione con EmailJS
│   ├── useFileUpload.js        # Gestione upload file
│   ├── useAnalysis.js          # Stato analisi, filtri, dati
│   └── useMarketData.js        # Fetch dati di mercato (SPX, ticker)
├── components/                  # Componenti React
│   ├── index.js                # Export barrel
│   ├── cards/                  # Componenti card piccoli
│   │   ├── KPICard.jsx         # Card metrica con tooltip
│   │   └── FilterBadge.jsx     # Badge filtri applicati
│   ├── charts/                 # Componenti grafici (Recharts)
│   │   ├── EquityChart.jsx     # Grafico linea equity
│   │   ├── DrawdownChart.jsx   # Grafico area drawdown
│   │   ├── DistributionChart.jsx # Grafico distribuzione (istogramma)
│   │   ├── CullenFreyPlot.jsx  # Scatter plot Cullen & Frey
│   │   ├── DayStatsCharts.jsx  # Box plot & media giornaliera
│   │   ├── CorrelationHeatmap.jsx # Matrice correlazioni
│   │   └── CustomBoxPlotTooltip.jsx # Tooltip custom
│   ├── layout/                 # Componenti layout
│   │   ├── Navbar.jsx          # Barra superiore
│   │   ├── Sidebar.jsx         # Menu laterale
│   │   └── MarketTicker.jsx    # Ticker mercato live
│   ├── auth/                   # Autenticazione
│   │   └── LoginModal.jsx      # Modal login OTP
│   └── sections/               # Sezioni complesse
│       └── AnalysisLoader.jsx  # Loader analisi
└── styles/                      # CSS utilities
    └── marquee.js              # Stili animazione marquee
```

## Flusso Dati

```
App.jsx
├─ useAuth() → AuthState
├─ useFileUpload() → RawRows + ColConfig
├─ useAnalysis(rawRows, colConfig) → ParsedTrades, Filters
└─ useMarketData() → SPXData, MarketQuotes

GlobalStats (useMemo)
├─ Calcolato da: analyzedTrades + spxData
├─ Contiene: metriche, statistiche, test di normalità
└─ Aggiornato quando: appliedFilters cambia

StrategyStats (useMemo)
├─ Gruppo trade per: Symbol o Strategy
├─ Un item per strategia/asset
└─ Include: statistiche, equity line, day stats

CorrelationMatrix (useMemo)
├─ Calcolata da: daily PNL
├─ Pearson correlation: Σ(x-μx)(y-μy) / √[Σ(x-μx)² × Σ(y-μy)²]
└─ Matrice N×N

MonteCarloData (useMemo)
├─ Simulazione: estrazione casuale trade storici (con reinserimento)
├─ N percorsi per: mcIterations
└─ Output: prob profitto finale + media equity
```

## Hook Personalizzati

### useAuth()
Gestisce login con verifica OTP via EmailJS
```javascript
{
  isAuthenticated,
  loginStep,      // 'input' | 'verify'
  handleLoginSubmit,
  handleVerifySubmit
}
```

### useFileUpload()
Carica file Excel e estrae intestazioni e dati
```javascript
{
  rawRows,        // Array di array (sheet)
  headers,        // Intestazioni colonne
  colConfig,      // Indici colonne
  isLoading,
  error
}
```

### useAnalysis()
Gestisce stato analisi, filtri e dati parsed
```javascript
{
  parsedTrades,         // Tutti i trade parsed
  filteredTableTrades,  // Trade per tabella
  analyzedTrades,       // Trade con filtri applicati
  showTable, groupBy, tableFilters, appliedFilters,
  triggerAnalysis       // Funzione per lanciare analisi
}
```

### useMarketData()
Fetch dati stoici SPX e ticker live
```javascript
{
  spxData,        // { date: return, ... }
  marketQuotes    // Array ticker con prezzo
}
```

## Funzioni Utility Principali

### Math
- `erf(x)` - Error function (Gauss)
- `normalCDF(x, mean, std)` - Cumulative distribution
- `getPercentile(data, q)` - Percentile custom

### Statistics
- `skewnessAndKurtosis()` - Asimmetria e curtosi
- `jarqueBeraTest()` - Test normalità Chi-square
- `adTest()` - Anderson-Darling test
- `calcBetaCorr()` - Beta e correlazione S&P500
- `calculateDayStats()` - Statistiche per giorno della settimana

### Data Parsing
- `findHeaderRowIndex()` - Individua intestazione tabella
- `parseTrades()` - Converte raw data in trade objects
- `filterTrades()` - Applica filtri a trade array

