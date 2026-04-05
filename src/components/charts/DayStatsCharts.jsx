import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart } from 'recharts';
import { Calendar, Activity } from 'lucide-react';
import { CustomBoxPlotTooltip } from './CustomBoxPlotTooltip';

export const DayStatsCharts = ({ dayStats, isDark, theme }) => {
  if (!dayStats || dayStats.length === 0) return null;
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6 border-t ${theme.border} pt-6`}>
      <div className={`${theme.panel} rounded-lg border ${theme.borderLight} p-4 h-[300px] glow-panel`}>
        <h3 className="text-center font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 mb-3 text-[#ffa726] font-mono">
          <Calendar className="w-3.5 h-3.5" /> Daily PNL
        </h3>
        <ResponsiveContainer width="100%" height="88%">
          <BarChart data={dayStats} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: theme.chart.tick, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <YAxis tick={{ fontSize: 9, fill: theme.chart.tick, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <Tooltip formatter={(val) => [`${Number(val).toFixed(2)}`, 'Avg']} cursor={{ fill: isDark ? '#111824' : '#f1f5f9' }} contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText, border: `1px solid ${theme.chart.tooltipBorder}`, fontSize: 11 }} />
            <ReferenceLine y={0} stroke={theme.chart.axis} />
            <Bar dataKey="avg" radius={[2, 2, 0, 0]}>
              {dayStats.map((e, idx) => <Cell key={`cell-${idx}`} fill={e.avg < 0 ? '#ff1744' : '#00e676'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={`${theme.panel} rounded-lg border ${theme.borderLight} p-4 h-[300px] glow-panel`}>
        <h3 className="text-center font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 mb-3 text-[#64b5f6] font-mono">
          <Activity className="w-3.5 h-3.5" /> Box Plot
        </h3>
        <ResponsiveContainer width="100%" height="88%">
          <ComposedChart data={dayStats} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
            <XAxis xAxisId="line" dataKey="name" tick={{ fontSize: 9, fill: theme.chart.tick, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <XAxis xAxisId="box" dataKey="name" hide />
            <YAxis tick={{ fontSize: 9, fill: theme.chart.tick, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <Tooltip content={<CustomBoxPlotTooltip isDark={isDark} theme={theme} />} cursor={{ fill: isDark ? '#111824' : '#f1f5f9' }} />
            <ReferenceLine y={0} stroke={theme.chart.axis} strokeDasharray="3 3" xAxisId="line" />
            <Bar xAxisId="line" dataKey="minMax" fill={theme.chart.boxLine} barSize={3} radius={0} />
            <Bar xAxisId="box" dataKey="q1q3" fill={theme.chart.secondary} barSize={16} radius={1} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
