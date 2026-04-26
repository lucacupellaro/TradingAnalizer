# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server (HMR).
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the built `dist/`.
- `npm run lint` — ESLint over the repo (config in [eslint.config.js](eslint.config.js); `dist` is ignored).

There is no test runner configured.

## Stack

React 19 + Vite 7, Tailwind CSS v4 (via `@tailwindcss/postcss`), Recharts for charts, Framer Motion, Lucide icons, EmailJS for OTP login. UI strings are in Italian; user-facing copy should stay Italian unless the user says otherwise.

## Architecture

Single-page React app for analyzing MetaTrader-style trading reports (Excel). Entry: [src/main.jsx](src/main.jsx) → [src/App.jsx](src/App.jsx). [src/App.jsx](src/App.jsx) is intentionally a large (~1700-line) orchestrator: it composes the hooks, derives all `useMemo` analytics, and renders every section. Most refactor work should pull pieces *out* of `App.jsx` into `components/` or `hooks/` rather than growing it further.

### Data flow (the central pipeline)

1. **[useFileUpload](src/hooks/useFileUpload.js)** — reads an `.xlsx` via the `XLSX` global (loaded from CDN at runtime, not bundled — see `SCRIPT_URLS.xlsx` in [src/config/constants.js](src/config/constants.js)). Calls [findHeaderRowIndex](src/utils/data-parsing.js) to locate the "Deals/Operazioni" section, then sets a `colConfig` with hard-coded column indices (`symIdx: 2, typeIdx: 3, …`) that match the MT5 export layout. If the header layout changes, this is the single place to update.
2. **[useAnalysis(rawRows, colConfig)](src/hooks/useAnalysis.js)** — owns filter state. Two filter objects exist: `tableFilters` (live, controls the table) and `appliedFilters` (committed by `triggerAnalysis`, drives all heavy memos). The split is deliberate — never recompute analytics on every keystroke; only after the user clicks "Applica". `triggerAnalysis` also runs a 1.5s "loader" animation cycling through `ANALYSIS_FORMULAS`.
3. **Memos in [src/App.jsx](src/App.jsx)** — `GlobalStats`, `StrategyStats`, `CorrelationMatrix`, `MonteCarloData`, etc. are derived purely from `analyzedTrades` + `spxData`. Keep these as memos; do not move state into them.
4. **[useMarketData](src/hooks/useMarketData.js)** — fetches Yahoo Finance via a chain of public CORS proxies (`allorigins`, `corsproxy.io`, `codetabs`) with automatic fallback. If quotes stop loading, the proxies are usually the cause, not the call sites.
5. **[useAuth](src/hooks/useAuth.js)** — EmailJS OTP login. `admin@admin.com` / `admin` bypasses OTP. Verified emails are cached in `localStorage` under `verified_<email>`. EmailJS keys live in [src/config/constants.js](src/config/constants.js) and are committed (public-key model).

### Monte Carlo

Bootstrapped equity simulation runs in a Web Worker: [src/workers/monteCarlo.worker.js](src/workers/monteCarlo.worker.js), imported via Vite's `?worker` suffix in [src/App.jsx](src/App.jsx). Always keep the simulation in the worker — running it on the main thread will freeze the UI for `iterations × trades` random draws.

### Statistics layer

[src/utils/statistics.js](src/utils/statistics.js) and [src/utils/math.js](src/utils/math.js) implement skewness/kurtosis, Jarque-Bera (`JB_CRITICAL_VALUE = 5.99`), Anderson-Darling (`AD_CRITICAL_VALUE = 0.752`), beta/correlation vs. S&P 500, percentiles, and `erf`/`normalCDF`. Critical values are constants in [src/config/constants.js](src/config/constants.js).

### Theming

[src/config/themes.js](src/config/themes.js) returns a `theme` object of pre-baked Tailwind class strings for dark/light. Components receive `theme` as a prop and concatenate its strings — they do not import Tailwind classes directly. Two visual identities: dark = Bloomberg-terminal orange (`#ff8c00`), light = corporate blue (`#2563eb`).

### Module structure

Re-exports are centralized in barrel files: [src/components/index.js](src/components/index.js), [src/hooks/index.js](src/hooks/index.js), [src/utils/index.js](src/utils/index.js). Add new exports there so [src/App.jsx](src/App.jsx)'s flat import block keeps working. Component subfolders are organized by role (`cards/`, `charts/`, `layout/`, `auth/`, `sections/`), not by feature.

## Conventions

- ESLint rule `no-unused-vars` ignores identifiers matching `^[A-Z_]` — a long Recharts import line in [src/App.jsx](src/App.jsx) relies on this and has an `// eslint-disable-line` for the rest.
- The README at [src/README.md](src/README.md) is a hand-written architecture doc in Italian — update it when the hook contracts or data flow change.
