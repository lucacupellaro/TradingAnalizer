import { BarChart2, Info, Globe, X, LogOut, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'analyzer',    Icon: BarChart2, label: 'Analyzer' },
  { id: 'descrizione', Icon: Info,      label: 'Chi sono?' },
  { id: 'news',        Icon: Globe,     label: 'Come funziona?' },
];

export const Sidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab, onLogout }) => {
  const close = () => setIsOpen(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[190] bg-black/70 backdrop-blur-sm"
          onClick={close}
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-full z-[200] flex flex-col
          bg-[#080c14] border-r border-[#1a2332] shadow-2xl
          transition-transform duration-200 ease-in-out
          w-[210px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 border-b border-[#1a2332] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#ff8c00]" />
            <span className="font-bold text-xs tracking-widest text-[#ff8c00] font-mono glow-orange">SNIPERFOREX TERMINAL</span>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded text-[#4a5568] hover:text-[#ff8c00] hover:bg-[#ff8c00]/5 transition-all"
          >
            <X className="w-4 h-4" />
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
                    flex items-center gap-3 px-3 py-2.5 rounded text-xs font-mono font-semibold
                    transition-all duration-150 border text-left w-full uppercase tracking-wider
                    ${active
                      ? 'bg-[#ff8c00]/10 text-[#ff8c00] border-[#ff8c00]/20'
                      : 'text-[#4a5568] hover:text-[#8b9dc3] hover:bg-white/[0.02] border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {onLogout && (
            <button
              onClick={() => { onLogout(); close(); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs font-mono font-semibold w-full
                text-[#4a5568] hover:text-[#ff1744] hover:bg-[#ff1744]/5 border border-transparent
                hover:border-[#ff1744]/20 transition-all duration-150 mt-4 uppercase tracking-wider"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Esci</span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
};
