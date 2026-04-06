import { useState, useEffect } from 'react';
import { SCRIPT_URLS, MARKET_URLS, TICKER_SYMBOLS } from '../config/constants';

const PROXY = 'https://api.allorigins.win/raw?url=';

const fetchTickerChart = async ({ symbol, name }) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await fetch(`${PROXY}${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const result = json.chart.result?.[0];
  if (!result) throw new Error('No result');

  const closes = result.indicators.quote[0].close.filter(v => v != null);
  if (closes.length < 2) throw new Error('Not enough data');

  const current = closes[closes.length - 1];
  const previous = closes[closes.length - 2];
  const change = current - previous;
  const changePercent = (change / previous) * 100;

  return { name, price: current, change, changePercent };
};

export const useMarketData = () => {
  const [spxData, setSpxData] = useState(null);
  const [marketQuotes, setMarketQuotes] = useState([]);

  useEffect(() => {
    // Load scripts
    const script = document.createElement('script');
    script.src = SCRIPT_URLS.xlsx;
    script.async = true;
    document.body.appendChild(script);

    const emailScript = document.createElement('script');
    emailScript.src = SCRIPT_URLS.emailjs;
    emailScript.async = true;
    document.body.appendChild(emailScript);

    // Fetch SPX data (10y for correlation analysis)
    const fetchSpx = async () => {
      try {
        const res = await fetch(
          `${PROXY}${encodeURIComponent(MARKET_URLS.spx)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const ts = data.chart.result[0].timestamp;
        const cls = data.chart.result[0].indicators.quote[0].close;
        const rets = {};
        for (let i = 1; i < ts.length; i++) {
          if (cls[i] !== null && cls[i - 1] !== null) {
            rets[new Date(ts[i] * 1000).toISOString().split('T')[0]] = (cls[i] - cls[i - 1]) / cls[i - 1];
          }
        }
        setSpxData(rets);
      } catch (err) {
        console.warn("SPX fetch failed:", err);
      }
    };

    // Fetch ticker quotes individually via chart API
    const fetchTickerQuotes = async () => {
      const results = await Promise.allSettled(
        TICKER_SYMBOLS.map(t => fetchTickerChart(t))
      );
      const quotes = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      if (quotes.length > 0) {
        setMarketQuotes(quotes);
      } else {
        setMarketQuotes([{ name: "MERCATO", price: 0, change: 0, changePercent: 0 }]);
      }
    };

    fetchSpx();
    fetchTickerQuotes();

    // Refresh ticker every 60 seconds
    const interval = setInterval(() => {
      fetchTickerQuotes();
    }, 60000);

    // Cleanup
    return () => {
      clearInterval(interval);
      if (document.body.contains(script)) document.body.removeChild(script);
      if (document.body.contains(emailScript)) document.body.removeChild(emailScript);
    };
  }, []);

  return { spxData, marketQuotes };
};
