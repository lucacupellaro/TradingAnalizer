import React from 'react';
import { BarChart2, Info, Globe, X } from 'lucide-react';

export const Sidebar = ({
  isMenuOpen,
  setIsMenuOpen,
  activeTab,
  setActiveTab,
  theme
}) => {
  if (!isMenuOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] flex">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
        <div className={`relative w-64 h-full ${theme.panel} border-r ${theme.border} p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <span className={`font-black text-xl uppercase tracking-widest ${theme.accent1}`}>MT5 CORE</span>
            <button onClick={() => setIsMenuOpen(false)} className={`${theme.textMuted} hover:text-rose-500`}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setActiveTab('analyzer');
                setIsMenuOpen(false);
              }}
              className={`p-3 text-left rounded font-bold text-sm tracking-wider flex items-center gap-3 ${
                activeTab === 'analyzer' ? theme.accentBg : theme.cardHover
              } transition-colors`}
            >
              <BarChart2 className="w-4 h-4" /> Analyzer Completo
            </button>
            <button
              onClick={() => {
                setActiveTab('descrizione');
                setIsMenuOpen(false);
              }}
              className={`p-3 text-left rounded font-bold text-sm tracking-wider flex items-center gap-3 ${
                activeTab === 'descrizione' ? theme.accentBg : theme.cardHover
              } transition-colors`}
            >
              <Info className="w-4 h-4" /> Descrizione
            </button>
            <button
              onClick={() => {
                setActiveTab('news');
                setIsMenuOpen(false);
              }}
              className={`p-3 text-left rounded font-bold text-sm tracking-wider flex items-center gap-3 ${
                activeTab === 'news' ? theme.accentBg : theme.cardHover
              } transition-colors`}
            >
              <Globe className="w-4 h-4" /> News
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
