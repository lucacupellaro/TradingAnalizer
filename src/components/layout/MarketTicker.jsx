const TickerItems = ({ quotes }) =>
  quotes.map((q, i) => (
    <div key={i} className="flex items-center gap-2 flex-shrink-0">
      <span className="text-[#4a5568]">{q.name}</span>
      <span className="text-[#e2e8f0] font-bold">{q.price?.toFixed(2)}</span>
      <span className={q.change >= 0 ? 'text-[#00e676] glow-green' : 'text-[#ff1744] glow-red'}>
        {q.change >= 0 ? '+' : ''}{Math.abs(q.changePercent || 0).toFixed(2)}%
      </span>
    </div>
  ));

export const MarketTicker = ({ marketQuotes, isDark }) => {
  return (
    <div className="w-full bg-[#080c14] border-b border-[#1a2332]/60 overflow-hidden py-2 relative z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {marketQuotes.length > 0 ? (
          <div className="animate-marquee whitespace-nowrap flex items-center gap-12 font-mono text-xs">
            <TickerItems quotes={marketQuotes} />
            <TickerItems quotes={marketQuotes} />
          </div>
        ) : (
          <div className="flex items-center justify-center font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff8c00] pulse-live" />
              <span className="text-[#4a5568] tracking-widest">CONNECTING TO MARKET DATA...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
