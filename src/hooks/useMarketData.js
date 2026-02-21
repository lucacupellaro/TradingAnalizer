import { useState, useEffect } from 'react';
import { SCRIPT_URLS, MARKET_URLS, TICKER_NAMES } from '../config/constants';

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

    // Fetch SPX data
    const fetchSpx = async () => {
      try {
        const res = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(MARKET_URLS.spx)}`
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
        console.warn("SPX fetch failed: Using fallback", err);
      }
    };

    // Fetch ticker quotes
    const fetchTickerQuotes = async () => {
      try {
        const res = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(MARKET_URLS.tickers)}`
        );
        if (!res.ok) throw new Error();
        const json = await res.json();
        setMarketQuotes(
          json.quoteResponse.result.map(r => ({
            name: TICKER_NAMES[r.symbol] || r.symbol,
            price: r.regularMarketPrice,
            change: r.regularMarketChange,
            changePercent: r.regularMarketChangePercent
          }))
        );
      } catch (e) {
        setMarketQuotes([{ name: "MERCATO", price: 0, change: 0, changePercent: 0 }]);
      }
    };

    fetchSpx();
    fetchTickerQuotes();

    // Cleanup
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
      if (document.body.contains(emailScript)) document.body.removeChild(emailScript);
    };
  }, []);

  return { spxData, marketQuotes };
};
