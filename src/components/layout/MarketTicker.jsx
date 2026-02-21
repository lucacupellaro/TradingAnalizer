import React from 'react';

export const MarketTicker = ({ marketQuotes, isDark }) => {
  return (
    <div className={`w-full ${isDark ? 'bg-[#050505] border-[#222]' : 'bg-slate-900 border-slate-800'} border-b overflow-hidden py-1.5 relative z-50`}>
      <div className="animate-marquee whitespace-nowrap flex items-center gap-12 font-mono text-xs font-bold">
        {marketQuotes.length > 0 ? (
          marketQuotes.map((q, i) => (
            <div key={i} className="flex items-center gap-2 inline-block">
              <span className="text-slate-400">{q.name}</span>
              <span className="text-white">{q.price?.toFixed(2)}</span>
              <span className={q.change >= 0 ? 'text-[#00ff00]' : 'text-[#ff0000]'}>
                {q.change >= 0 ? '▲' : '▼'} {Math.abs(q.changePercent || 0).toFixed(2)}%
              </span>
            </div>
          ))
        ) : (
          <span className="text-slate-400">CARICAMENTO DATI MERCATO LIVE...</span>
        )}
      </div>
    </div>
  );
};
