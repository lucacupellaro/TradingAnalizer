import React from 'react';
import { Filter } from 'lucide-react';

export const FilterBadge = ({ filters, isDark, theme }) => {
  const { dir, tradeType, symbols, strategies, dateStart, dateEnd } = filters;
  const formatArr = (arr, emptyText) => {
    if (!arr || arr.length === 0) return emptyText;
    if (arr.length > 2) return arr.slice(0, 2).join(', ') + ` (+${arr.length - 2})`;
    return arr.join(', ');
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 mt-4 text-[9px] font-mono ${theme.textMuted} ${theme.card} p-2 rounded border ${theme.border} inline-flex`}>
      <Filter className={`w-3 h-3 ${theme.accent2}`} />
      <span>FILTRI:</span>
      <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>DIR: <b className={theme.accent1}>{dir.toUpperCase()}</b></span>
      <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>TIPO: <b className={theme.accent1}>{tradeType.toUpperCase()}</b></span>
      <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>SYM: <b className={theme.accent1}>{formatArr(symbols, 'TUTTI')}</b></span>
      <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>STRAT: <b className={theme.accent1}>{formatArr(strategies, 'TUTTE')}</b></span>
      {(dateStart || dateEnd) && (
        <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>
          DATE: <b className={theme.success}>{dateStart ? dateStart : 'INIZIO'} ➔ {dateEnd ? dateEnd : 'OGGI'}</b>
        </span>
      )}
    </div>
  );
};
