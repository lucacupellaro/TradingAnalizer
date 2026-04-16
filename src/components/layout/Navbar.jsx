import { Menu, Moon, Sun, Upload } from 'lucide-react';

export const Navbar = ({
  isDark,
  setIsDark,
  isLoading,
  isSidebarOpen,
  setIsSidebarOpen,
  onFileUpload,
  theme,
}) => {
  return (
    <nav className={`w-full ${theme.navBg} border-b ${theme.navBorder} transition-colors`}>
      <div className="w-full">
        <div className="h-14 flex items-center justify-between gap-4">

          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2.5 rounded ${theme.navText} ${theme.navHover} transition-all shrink-0`}
              title="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <img src="/Logo.jpg" alt="SniperForex" className="w-8 h-8 rounded-full object-cover" />
              <span className={`font-bold text-base tracking-widest font-mono whitespace-nowrap ${isDark ? 'text-[#ff8c00] glow-orange' : 'text-[#2563eb]'}`}>
                SNIPERFOREX TERMINAL
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1 ml-3 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] pulse-live" />
              <span className={`text-[9px] uppercase tracking-widest font-mono whitespace-nowrap ${theme.navText}`}>
                LIVE
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded border ${theme.navBtnBg} ${theme.navText} ${theme.navHover} transition-all shrink-0`}
              title={isDark ? 'Tema chiaro' : 'Tema scuro'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <label
  className={`flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest cursor-pointer transition-all border select-none font-mono whitespace-nowrap shrink-0 h-8 ${
    isLoading
      ? `${theme.navBtnBg} ${theme.navText} cursor-wait`
      : isDark
        ? 'bg-[#ff8c00] hover:bg-[#ff9f1c] text-black border-[#ff8c00]/60 shadow-lg shadow-[#ff8c00]/20 hover:scale-105 hover:shadow-[#ff8c00]/40'
        : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-[#2563eb] shadow-lg shadow-[#2563eb]/20 hover:scale-105'
  }`}
>
  <Upload className="w-5 h-5 flex-shrink-0" />
  {isLoading ? 'Loading...' : 'IMPORT'}
  <input
    type="file"
    accept=".xlsx,.xls,.html,.htm,.csv"
    onChange={onFileUpload}
    className="hidden"
  />
</label>
          </div>

        </div>
      </div>
    </nav>
  );
};
