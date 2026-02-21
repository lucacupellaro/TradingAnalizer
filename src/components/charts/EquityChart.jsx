import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatXAxisDate } from '../../utils/formatting';

export const EquityChart = ({ data, isDark, title, theme }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className={`${theme.panel} border ${theme.borderLight} rounded p-4 h-[300px]`}>
      <h3 className={`text-center font-bold ${theme.textBold} mb-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2`}><TrendingUp className={`w-4 h-4 ${theme.success}`} /> {title || "Curva di Equity"}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.chart.tick }} tickFormatter={formatXAxisDate} stroke={theme.chart.axis} />
          <YAxis tick={{ fontSize: 10, fill: theme.chart.tick }} stroke={theme.chart.axis} />
          <Tooltip contentStyle={{ backgroundColor: theme.chart.tooltipBg, color: theme.chart.tooltipText, border: `1px solid ${theme.chart.tooltipBorder}` }} labelFormatter={(val) => `Data: ${val}`} />
          <Line type="stepAfter" dataKey="equity" stroke={theme.chart.success} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
