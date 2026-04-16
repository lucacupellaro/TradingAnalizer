const TickerItems = ({ quotes, isDark }) =>
  quotes.map((q, i) => (
    <div key={i} className="flex items-center gap-2 flex-shrink-0">
      <span className={isDark ? 'text-[#555555]' : 'text-[#6b7280]'}>{q.name}</span>
      <span className={isDark ? 'text-[#e0e0e0] font-bold' : 'text-[#111827] font-bold'}>{q.price?.toFixed(2)}</span>
      <span className={q.change >= 0 ? 'text-[#00e676] glow-green' : 'text-[#ff1744] glow-red'}>
        {q.change >= 0 ? '+' : ''}{Math.abs(q.changePercent || 0).toFixed(2)}%
      </span>
    </div>
  ));

export const MarketTicker = ({ marketQuotes, isDark, theme }) => {
  return (
    <div className={`w-full ${theme.navBg} border-b ${theme.navBorder}/60 overflow-hidden py-2 relative z-50 transition-colors`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {marketQuotes.length > 0 ? (
          <div className="animate-marquee whitespace-nowrap flex items-center gap-12 font-mono text-xs">
            <TickerItems quotes={marketQuotes} isDark={isDark} />
            <TickerItems quotes={marketQuotes} isDark={isDark} />
          </div>
        ) : (
          <div className="flex items-center justify-center font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#ff8c00]' : 'bg-[#2563eb]'} pulse-live`} />
              <span className={`tracking-widest ${theme.navText}`}>CONNECTING TO MARKET DATA...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
