import { Menu, Moon, Sun, Upload } from 'lucide-react';

export const Navbar = ({
  isDark,
  setIsDark,
  isLoading,
  isSidebarOpen,
  setIsSidebarOpen,
  onFileUpload,
}) => {
  return (
    <nav className="w-full bg-[#0d1117] border-b border-[#1a2332]">
      <div className="w-full">
        <div className="h-14 flex items-center justify-between gap-4">

          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded text-[#4a5568] hover:text-[#ff8c00] hover:bg-[#ff8c00]/5 transition-all shrink-0"
              title="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <img src="/Logo.jpg" alt="SniperForex" className="w-8 h-8 rounded-full object-cover" />
              <span className="font-bold text-base text-[#ff8c00] tracking-widest font-mono glow-orange whitespace-nowrap">
                SNIPERFOREX TERMINAL
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1 ml-3 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] pulse-live" />
              <span className="text-[9px] uppercase tracking-widest text-[#4a5568] font-mono whitespace-nowrap">
                LIVE
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded border border-[#1a2332] bg-[#111824] text-[#4a5568] hover:text-[#ff8c00] hover:border-[#ff8c00]/20 transition-all shrink-0"
              title={isDark ? 'Tema chiaro' : 'Tema scuro'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <label
  className={`flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest cursor-pointer transition-all border select-none font-mono whitespace-nowrap shrink-0 h-8 ${
    isLoading
      ? 'bg-[#111824] border-[#1a2332] text-[#4a5568] cursor-wait'
      : 'bg-[#ff8c00] hover:bg-[#ff9f1c] text-black border-[#ff8c00]/60 shadow-lg shadow-[#ff8c00]/20 hover:scale-105 hover:shadow-[#ff8c00]/40'
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