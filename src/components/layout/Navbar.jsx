import React from 'react';
import { Menu, BarChart2, Moon, Sun, Upload } from 'lucide-react';

export const Navbar = ({
  isDark,
  setIsDark,
  isLoading,
  isMenuOpen,
  setIsMenuOpen,
  onFileUpload,
  theme
}) => {
  return (
    <nav className={`w-full ${theme.panel} border-b ${theme.border} sticky top-0 z-[100] shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-lg ${theme.cardHover} ${theme.textMuted}`}
          >
            <Menu className="w-6 h-6" />
          </button>
          <BarChart2 className={`w-6 h-6 ${theme.accent2}`} />
          <h1 className={`text-lg font-black ${theme.textBold} uppercase tracking-tighter hidden sm:block`}>
            Quant Terminal
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-full border ${theme.border} ${theme.card} ${theme.textMuted}`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <label
            className={`flex items-center gap-2 px-4 py-2 rounded font-black transition-all cursor-pointer uppercase text-xs ${
              isLoading ? 'bg-gray-400' : theme.btnPrimary
            }`}
          >
            <Upload className="w-4 h-4" /> {isLoading ? '...' : 'IMPORT'}
            <input
              type="file"
              accept=".xlsx,.xls,.html,.htm,.csv"
              onChange={onFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </nav>
  );
};
