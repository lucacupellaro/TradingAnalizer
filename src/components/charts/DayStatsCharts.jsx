import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart } from 'recharts';
import { Calendar, Activity } from 'lucide-react';
import { CustomBoxPlotTooltip } from './CustomBoxPlotTooltip';

export const DayStatsCharts = ({ dayStats, isDark, theme }) => {
  if (!dayStats || dayStats.length === 0) return null;
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 border-t ${theme.border} pt-6`}>
      <div className={`${theme.panel} rounded border ${theme.borderLight} p-4 h-[300px]`}>
        <h3 className={`text-center font-bold ${theme.textBold} mb-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2`}><Calendar className={`w-4 h-4 ${theme.accent2}`} /> PNL Medio Giornaliero</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={dayStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: theme.chart.tick, fontFamily: 'monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <YAxis tick={{ fontSize: 10, fill: theme.chart.tick, fontFamily: 'monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <Tooltip formatter={(val) => [`${Number(val).toFixed(2)}`, 'Media']} cursor={{ fill: isDark ? '#1a1a1a' : '#f1f5f9' }} contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText }} />
            <ReferenceLine y={0} stroke={theme.chart.axis} />
            <Bar dataKey="avg" radius={[2, 2, 0, 0]}>
              {dayStats.map((e, idx) => <Cell key={`cell-${idx}`} fill={e.avg < 0 ? theme.chart.danger : theme.chart.success} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={`${theme.panel} rounded border ${theme.borderLight} p-4 h-[300px]`}>
        <h3 className={`text-center font-bold ${theme.textBold} mb-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2`}><Activity className={`w-4 h-4 ${theme.accent1}`} /> Range Box Plot</h3>
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart data={dayStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
            <XAxis xAxisId="line" dataKey="name" tick={{ fontSize: 10, fill: theme.chart.tick, fontFamily: 'monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <XAxis xAxisId="box" dataKey="name" hide />
            <YAxis tick={{ fontSize: 10, fill: theme.chart.tick, fontFamily: 'monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <Tooltip content={<CustomBoxPlotTooltip isDark={isDark} theme={theme} />} cursor={{ fill: isDark ? '#1a1a1a' : '#f1f5f9' }} />
            <ReferenceLine y={0} stroke={theme.chart.axis} strokeDasharray="3 3" xAxisId="line" />
            <Bar xAxisId="line" dataKey="minMax" fill={theme.chart.boxLine} barSize={3} radius={0} />
            <Bar xAxisId="box" dataKey="q1q3" fill={theme.chart.secondary} barSize={16} radius={1} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
