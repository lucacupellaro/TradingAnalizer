import { BarChart2, Info, Globe, X, LogOut, Activity, Layers, Gauge } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'analyzer',    Icon: BarChart2, label: 'Analyzer' },
  { id: 'regime',      Icon: Activity,  label: 'Market Regime' },
  { id: 'volatility',  Icon: Gauge,     label: 'Volatility Regime' },
  { id: 'themes',      Icon: Layers,    label: 'Themes' },
  { id: 'descrizione', Icon: Info,      label: 'Chi sono?' },
  { id: 'news',        Icon: Globe,     label: 'Come funziona?' },
];

export const Sidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab, onLogout, isDark, theme }) => {
  const close = () => setIsOpen(false);

  return (
    <>
      {isOpen && (
        <div
          className={`fixed inset-0 z-[190] ${isDark ? 'bg-black/70' : 'bg-black/30'} backdrop-blur-sm`}
          onClick={close}
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-full z-[200] flex flex-col
          ${isDark ? 'bg-[#050505]' : 'bg-white'} border-r ${theme.navBorder} shadow-2xl
          transition-all duration-200 ease-in-out
          w-[210px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 h-14 border-b ${theme.navBorder} flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <img src="/Logo.jpg" alt="SniperForex" className="w-7 h-7 rounded-full object-cover" />
            <span className={`font-bold text-xs tracking-widest font-mono ${isDark ? 'text-[#ff8c00] glow-orange' : 'text-[#2563eb]'}`}>SNIPERFOREX</span>
          </div>
          <button
            onClick={close}
            className={`p-2 rounded ${theme.navText} ${theme.navHover} transition-all`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col justify-between">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ id, Icon, label }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); close(); }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded text-sm font-mono font-semibold
                    transition-all duration-150 border text-left w-full uppercase tracking-wider
                    ${active
                      ? isDark
                        ? 'bg-[#ff8c00]/10 text-[#ff8c00] border-[#ff8c00]/20'
                        : 'bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/20'
                      : `${theme.navText} ${theme.navHover} border-transparent`
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {onLogout && (
            <button
              onClick={() => { onLogout(); close(); }}
              className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-mono font-semibold w-full
                ${theme.navText} hover:text-[#ff1744] hover:bg-[#ff1744]/5 border border-transparent
                hover:border-[#ff1744]/20 transition-all duration-150 mt-4 uppercase tracking-wider`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Esci</span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
};
