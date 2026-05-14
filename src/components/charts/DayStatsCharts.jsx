import { useState } from 'react';
import { Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart } from 'recharts';
import { Calendar, Activity } from 'lucide-react';
import { CustomBoxPlotTooltip } from './CustomBoxPlotTooltip';

export const DayStatsCharts = ({ dayStats, isDark, theme }) => {
  const [mode, setMode] = useState('eur');
  const [showSpx, setShowSpx] = useState(false);

  if (!dayStats || dayStats.length === 0) return null;

  const barKey = mode === 'eur' ? 'avg' : 'avgPct';
  const fmtVal = (v) => mode === 'eur' ? `€${Number(v).toFixed(2)}` : `${Number(v).toFixed(2)}%`;
  const btn = 'px-4 py-14 rounded text-xs font-bold uppercase tracking-wide transition-all border';

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 mt-10 border-t ${theme.border} pt-6`}>
      <div className={`${theme.panel} rounded-lg border ${theme.borderLight} p-4 h-[300px] glow-panel`}>
        <div className="flex items-center justify-between mb-12 flex-wrap gap-2">
          <h3 className="font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 text-[#ffa726] font-mono">
            <Calendar className="w-3.5 h-3.5" /> Daily PNL
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode('eur')} className={`${btn} ${mode === 'eur' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : `${theme.card} ${theme.textMuted} border-transparent opacity-40`}`}>€</button>
            <button onClick={() => setMode('pct')} className={`${btn} ${mode === 'pct' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : `${theme.card} ${theme.textMuted} border-transparent opacity-40`}`}>%</button>
            <button onClick={() => setShowSpx(v => !v)} className={`${btn} ${showSpx ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : `${theme.card} ${theme.textMuted} border-transparent opacity-40`}`}>SP500</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <ComposedChart data={dayStats} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: theme.chart.tooltipText, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: theme.chart.tooltipText, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <YAxis yAxisId="right" orientation="right" tick={showSpx ? { fontSize: 9, fill: '#64b5f6', fontFamily: 'JetBrains Mono, monospace' } : false} axisLine={{ stroke: showSpx ? '#64b5f6' : 'transparent' }} tickFormatter={(v) => `${v.toFixed(2)}%`} width={showSpx ? 50 : 5} />
            <Tooltip formatter={(val, name) => [name === 'SP500' ? `${Number(val).toFixed(2)}%` : fmtVal(val), name === 'SP500' ? 'SP500' : 'Avg']} cursor={{ fill: isDark ? '#111824' : '#f1f5f9' }} contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText, border: `1px solid ${theme.chart.tooltipBorder}`, fontSize: 11 }} itemStyle={{ color: theme.chart.tooltipText }} labelStyle={{ color: theme.chart.tooltipText }} />
            <ReferenceLine y={0} yAxisId="left" stroke={theme.chart.axis} />
            <Bar yAxisId="left" dataKey={barKey} radius={[2, 2, 0, 0]}>
              {dayStats.map((e, idx) => <Cell key={`cell-${idx}`} fill={(e[barKey] ?? 0) < 0 ? '#ff1744' : '#00e676'} />)}
            </Bar>
            {showSpx && <Bar yAxisId="right" dataKey="spxPct" fill="#64b5f6" fillOpacity={0.85} radius={[2, 2, 0, 0]} name="SP500" isAnimationActive={false} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className={`${theme.panel} rounded-lg border ${theme.borderLight} p-4 h-[300px] glow-panel`}>
        <h3 className="text-center font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 mb-12 text-[#64b5f6] font-mono">
          <Activity className="w-3.5 h-3.5" /> Box Plot
        </h3>
        <ResponsiveContainer width="100%" height="88%">
          <ComposedChart data={dayStats} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
            <XAxis xAxisId="line" dataKey="name" tick={{ fontSize: 9, fill: theme.chart.tooltipText, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: theme.chart.axis }} />
            <XAxis xAxisId="box" dataKey="name" hide />
            <YAxis tick={{ fontSize: 9, fill: theme.chart.tooltipText, fontFamily: 'JetBrains Mono, monospace' }} axisLine={{ stroke: theme.chart.axis }} />
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
