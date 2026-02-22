import React from 'react';
import { Info } from 'lucide-react';

export const KPICard = ({ label, value, valueClass, subValue, icon: Icon, infoDesc, infoFormula, isDark, theme }) => {
  return (
    <div className={`${theme.card} p-4 rounded border ${theme.borderLight} flex flex-col justify-center relative group`}>
      <div className="flex justify-between items-start w-full">
        <div className={`${theme.textMuted} text-[10px] uppercase font-bold mb-2 flex items-center gap-2`}>
          {Icon && <Icon className="w-4 h-4" />} {label}
        </div>
        {(infoDesc || infoFormula) && (
          <div className={`${theme.textFaint} hover:${theme.accent1} cursor-help transition-colors z-10 relative`}>
            <Info className="w-3 h-3" />
            <div className={`absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full right-0 md:left-1/2 md:-translate-x-1/2 mb-2 w-48 md:w-64 p-3 ${theme.panel} border ${theme.border} rounded shadow-2xl z-[999] pointer-events-none`}>
              {infoDesc && <div className={`text-[10px] ${theme.textBold} mb-2 leading-snug font-sans`}>{infoDesc}</div>}
              {infoFormula && <div className={`text-[9px] font-mono ${theme.accent1} ${theme.card} p-2 rounded border ${theme.borderLight} text-center font-bold tracking-wider break-words`}>{infoFormula}</div>}
            </div>
          </div>
        )}
      </div>
      <div className={`text-lg font-mono font-bold truncate ${valueClass || theme.textBold}`}>{value}</div>
      {subValue && <div className={`text-[10px] ${theme.textFaint} font-mono mt-1 truncate`}>{subValue}</div>}
    </div>
  );
};
