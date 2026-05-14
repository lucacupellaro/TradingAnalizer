import React from 'react';

export const CorrelationHeatmap = ({ data, isDark, theme }) => {
  if (!data || !data.entities || data.entities.length <= 1) {
    return <div className={`${theme.textMuted} font-mono text-sm text-center py-12 border ${theme.borderLight} rounded ${theme.panel}`}>Dati insufficienti per la matrice di correlazione.</div>;
  }

  const { entities, matrix } = data;

  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-full text-[10px] sm:text-xs font-mono text-center border-collapse">
        <thead>
          <tr>
            <th className={`p-2 border ${theme.border} ${theme.textMuted} ${theme.panel}`}></th>
            {entities.map(e => (
              <th key={e} className={`p-2 border ${theme.border} ${theme.textMuted} font-normal truncate max-w-[80px] ${theme.panel}`} title={e}>
                {e.substring(0, 8)}{e.length > 8 ? '..' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.entity}>
              <th className={`p-2 border ${theme.border} ${theme.textBold} font-normal text-left truncate max-w-[100px] ${theme.panel}`} title={row.entity}>
                {row.entity.substring(0, 10)}{row.entity.length > 10 ? '..' : ''}
              </th>
              {entities.map(col => {
                const val = row[col];
                const isSelf = row.entity === col;
                let bg = 'transparent', textColor = isDark ? '#e0e0e0' : '#334155';
                if (!isSelf) {
                  if (val > 0) bg = `rgba(${isDark ? '0, 255, 0' : '22, 163, 74'}, ${val * 0.8})`;
                  else if (val < 0) bg = `rgba(${isDark ? '255, 0, 0' : '225, 29, 72'}, ${Math.abs(val) * 0.8})`;
                  if (Math.abs(val) > 0.6) textColor = '#000000';
                }
                return (
                  <td
                    key={col}
                    className={`p-2 border ${theme.border} font-bold transition-colors hover:border-[#888]`}
                    style={{
                      backgroundColor: isSelf ? (isDark ? '#1a1a1a' : '#f8fafc') : bg,
                      color: isSelf ? (isDark ? '#555' : '#94a3b8') : textColor
                    }}
                    title={`${row.entity} vs ${col}\nCorr: ${val.toFixed(3)}`}
                  >
                    {isSelf ? '-' : val.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
