import React from 'react';

export const CustomBoxPlotTooltip = ({ active, payload, label, isDark, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;
    return (
      <div className={`p-3 border rounded shadow-lg z-50 font-mono text-sm`} style={{ backgroundColor: theme.chart.tooltipBg, borderColor: theme.chart.tooltipBorder }}>
        <p className={`font-bold mb-10`} style={{ color: theme.chart.tooltipText }}>{String(label)} ({data.count} op.)</p>
        <div className="space-y-6">
          <p className="flex justify-between gap-6"><span className={theme.textMuted}>Max:</span> <span className={theme.success}>+€{data.max?.toFixed(2)}</span></p>
          <p className="flex justify-between gap-6"><span className={theme.textMuted}>Q3:</span> <span className={theme.textBold}>€{data.q3?.toFixed(2)}</span></p>
          <p className="flex justify-between gap-6"><span className={theme.textMuted}>Mediana:</span> <span className={theme.accent1}>€{data.median?.toFixed(2)}</span></p>
          <p className="flex justify-between gap-6"><span className={theme.textMuted}>Q1:</span> <span className={theme.textBold}>€{data.q1?.toFixed(2)}</span></p>
          <p className="flex justify-between gap-6"><span className={theme.textMuted}>Min:</span> <span className={theme.danger}>€{data.min?.toFixed(2)}</span></p>
        </div>
      </div>
    );
  }
  return null;
};
