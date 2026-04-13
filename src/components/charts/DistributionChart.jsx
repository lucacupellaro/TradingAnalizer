import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const DistributionChartComponent = ({ data, title, isDark, type, theme }) => {
  if (!data || data.length === 0) return null;

  const maxAbs = Math.max(...data.map(Math.abs)) || 1;
  const binCount = 50;
  const binSize = maxAbs / (binCount / 2);

  let filtered = data;
  if (type === 'win') filtered = data.filter(x => x > 0);
  if (type === 'loss') filtered = data.filter(x => x <= 0);

  const bins = [];
  for (let i = -binCount / 2; i <= binCount / 2; i++) {
    bins.push({
      x: i,
      valStr: (i * binSize).toFixed(2),
      pctLabel: `${((i / (binCount / 2)) * 50).toFixed(0)}%`,
      count: 0
    });
  }

  filtered.forEach(val => {
    let idx = Math.round((val / maxAbs) * (binCount / 2));
    idx = Math.max(-binCount / 2, Math.min(binCount / 2, idx));
    const binIndex = idx + (binCount / 2);
    if (bins[binIndex]) bins[binIndex].count++;
  });

  let meanPct = '0%';
  if (filtered.length > 0) {
    const localMean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
    let mIdx = Math.round((localMean / maxAbs) * (binCount / 2));
    mIdx = Math.max(-binCount / 2, Math.min(binCount / 2, mIdx));
    meanPct = `${((mIdx / (binCount / 2)) * 50).toFixed(0)}%`;
  }

  const barColor = type === 'win' ? '#00ff00' : (type === 'loss' ? '#ff0000' : '#a855f7');

  return (
    <div className={`${theme.panel} border ${theme.borderLight} rounded p-4 h-[300px]`}>
      <h4 className={`text-center font-bold ${theme.textMuted} mb-2 text-[10px] uppercase tracking-wider`}>{title}</h4>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={bins} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
          <XAxis dataKey="pctLabel" tick={{ fontSize: 9, fill: theme.chart.tooltipText }} axisLine={{ stroke: theme.chart.axis }} interval={4} />
          <YAxis tick={{ fontSize: 9, fill: theme.chart.tooltipText }} axisLine={{ stroke: theme.chart.axis }} />
          <Tooltip cursor={{ fill: isDark ? '#1a1a1a' : '#f1f5f9' }} contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText, border: `1px solid ${theme.chart.tooltipBorder}`, fontSize: '11px' }} itemStyle={{ color: theme.chart.tooltipText }} labelStyle={{ color: theme.chart.tooltipText }} labelFormatter={(l) => `Area: ${l}`} />
          <ReferenceLine x="0%" stroke={theme.textMuted} strokeDasharray="3 3" />
          {filtered.length > 0 && <ReferenceLine x={meanPct} stroke="#ffd740" strokeWidth={2.5} strokeDasharray="6 3" label={{ position: 'top', value: '▼ MEDIA', fill: '#ffd740', fontSize: 11, fontWeight: 'bold' }} />}
          <Bar dataKey="count" fill={barColor} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DistributionChart = memo(DistributionChartComponent);
