import { useState, useEffect, useCallback } from 'react';

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
    } catch {
      continue;
    }
  }
  throw new Error('All proxies failed');
};

const fetchTicker = async (symbol) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
  const json = await fetchJson(url);
  const result = json.chart?.result?.[0];
  if (!result) return null;
  const closes = (result.indicators.quote[0].close || []).filter(v => v != null);
  if (closes.length < 2) return null;
  const current = closes[closes.length - 1];
  const previous = closes[closes.length - 2];
  const monthAgo = closes[0];
  return {
    symbol,
    price: current,
    dailyChangePct: ((current - previous) / previous) * 100,
    monthChangePct: ((current - monthAgo) / monthAgo) * 100,
    history: closes,
  };
};

const REGIME_TICKERS = ['^VIX', '^VVIX', 'SPY', 'RSP', 'IWD', 'IWF', 'SPHB', 'SPLV', 'XLY', 'XLP', 'XLI', 'XLU'];

export const useMarketRegime = () => {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(REGIME_TICKERS.map(fetchTicker));
      const next = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          next[REGIME_TICKERS[i]] = r.value;
        }
      });
      setData(next);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || 'Errore caricamento dati');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  return { data, isLoading, lastUpdated, error, reload: load };
};
