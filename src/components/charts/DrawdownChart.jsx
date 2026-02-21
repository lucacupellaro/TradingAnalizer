import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown } from 'lucide-react';
import { formatXAxisDate } from '../../utils/formatting';

export const DrawdownChart = ({ data, isDark, title, theme }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className={`${theme.panel} border ${theme.borderLight} rounded p-4 h-[300px]`}>
      <h3 className={`text-center font-bold ${theme.textBold} mb-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2`}><TrendingDown className="w-4 h-4 text-[#ff0000]" /> {title || "Drawdown Storico"}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.chart.tick }} tickFormatter={formatXAxisDate} stroke={theme.chart.axis} />
          <YAxis tick={{ fontSize: 10, fill: theme.chart.tick }} stroke={theme.chart.axis} />
          <Tooltip contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText, border: `1px solid ${theme.chart.tooltipBorder}` }} labelFormatter={(val) => `Data: ${val}`} />
          <Area type="monotone" dataKey="drawdown" stroke="#ff0000" fill="#ff0000" fillOpacity={0.4} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
