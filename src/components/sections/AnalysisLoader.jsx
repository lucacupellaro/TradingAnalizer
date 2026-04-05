import React from 'react';
import { Activity } from 'lucide-react';
import { ANALYSIS_FORMULAS } from '../../config/constants';

export const AnalysisLoader = ({ isAnalyzing, formulaIdx, isDark, theme, rowStart, rowEnd }) => {
  if (!isAnalyzing) return null;

  return (
    <div className={`fixed inset-0 z-[9999] ${isDark ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-sm flex flex-col items-center justify-center font-mono`}>
      <Activity className={`w-16 h-16 animate-spin mb-8 ${theme.accent2}`} />
      <h2 className={`text-2xl md:text-3xl font-black uppercase tracking-widest mb-6 animate-pulse ${theme.accent1}`}>
        Ricalcolo Statistico
      </h2>
      <div className={`text-sm md:text-lg ${theme.success} ${theme.card} p-4 rounded border ${theme.borderLight} min-w-[300px] text-center shadow-xl`}>
        {ANALYSIS_FORMULAS[formulaIdx]}
      </div>
      <div className="mt-4 text-center break-words">
        <p className="text-sm md:text-lg font-medium">Ordine di inizio: {rowStart || '1'}</p>
        <p className="text-sm md:text-lg font-medium">Ordine di fine: {rowEnd || 'FINE'}</p>
      </div>
    </div>
  );
};
