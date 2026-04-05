import React from 'react';
import { Filter } from 'lucide-react';

export const FilterBadge = ({ filters, isDark, theme }) => {
  const { dir, tradeType, symbols, strategies, dateStart, dateEnd, rowStart, rowEnd } = filters;
  const formatArr = (arr, emptyText) => {
    if (!arr || arr.length === 0) return emptyText;
    if (arr.length > 2) return arr.slice(0, 2).join(', ') + ` (+${arr.length - 2})`;
    return arr.join(', ');
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 mt-4 text-[10px] font-bold ${theme.textMuted} ${theme.card} p-4 rounded border ${theme.border} inline-flex`}>
      <Filter className={`w-4 h-4 ${theme.accent2}`} />
      <span className="font-bold">FILTRI:</span>
      <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>DIR: <b className={theme.accent1}>{dir.toUpperCase()}</b></span>
      <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>TIPO: <b className={theme.accent1}>{tradeType.toUpperCase()}</b></span>
      <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>SYM: <b className={theme.accent1}>{formatArr(symbols, 'TUTTI')}</b></span>
      <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>STRAT: <b className={theme.accent1}>{formatArr(strategies, 'TUTTE')}</b></span>
      {(dateStart || dateEnd || rowStart || rowEnd) && (
        <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>
          DATE: <b className={theme.success}>{dateStart ? dateStart : 'INIZIO'} ➔ {dateEnd ? dateEnd : 'OGGI'}</b>
        </span>
      )}
      {(rowStart || rowEnd) && (
        <span className={`${theme.panel} px-1.5 py-0.5 rounded border ${theme.borderLight}`}>
          RIGA: <b className={theme.success}>{rowStart ? rowStart : '1'} ➔ {rowEnd ? rowEnd : 'FINE'}</b>
        </span>
      )}
    </div>
  );
};
