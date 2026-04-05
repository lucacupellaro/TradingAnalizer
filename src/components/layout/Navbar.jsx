import { Menu, Moon, Sun, Upload, Activity } from 'lucide-react';

export const Navbar = ({
  isDark,
  setIsDark,
  isLoading,
  isSidebarOpen,
  setIsSidebarOpen,
  onFileUpload,
}) => {
  return (
    <nav className="w-full bg-[#0d1117] border-b border-[#1a2332] sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="h-12 flex items-center justify-between gap-4">

          {/* Left: hamburger + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded text-[#4a5568] hover:text-[#ff8c00] hover:bg-[#ff8c00]/5 transition-all"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#ff8c00]" />
              <span className="font-bold text-sm text-[#ff8c00] tracking-widest font-mono glow-orange">
                MT5 CORE
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 ml-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] pulse-live" />
              <span className="text-[9px] uppercase tracking-widest text-[#4a5568] font-mono">LIVE</span>
            </div>
          </div>

          {/* Right: theme + import */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded border border-[#1a2332] bg-[#111824] text-[#4a5568] hover:text-[#ff8c00] hover:border-[#ff8c00]/20 transition-all"
              title={isDark ? 'Tema chiaro' : 'Tema scuro'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <label
              className={`flex items-center gap-2 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all border select-none font-mono ${
                isLoading
                  ? 'bg-[#111824] border-[#1a2332] text-[#4a5568] cursor-wait'
                  : 'bg-[#ff8c00] hover:bg-[#ff9f1c] text-black border-[#ff8c00]/60 shadow-lg shadow-[#ff8c00]/10'
              }`}
            >
              <Upload className="w-3.5 h-3.5 flex-shrink-0" />
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
