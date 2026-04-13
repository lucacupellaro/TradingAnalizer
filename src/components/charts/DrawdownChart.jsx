import { memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown } from 'lucide-react';
import { formatXAxisDate } from '../../utils/formatting';

const DrawdownChartComponent = ({ data, title, theme }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className={`${theme.panel} border ${theme.borderLight} rounded-lg p-4 h-[300px] glow-panel`}>
      <h3 className="text-center font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 mb-3 text-[#ff1744] font-mono">
        <TrendingDown className="w-3.5 h-3.5" /> {title || 'Drawdown'}
      </h3>
      <ResponsiveContainer width="100%" height="88%">
        <AreaChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: theme.chart.tooltipText }} tickFormatter={formatXAxisDate} stroke={theme.chart.axis} />
          <YAxis tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.chart.tooltipBg,
              color: theme.chart.tooltipText,
              border: `1px solid ${theme.chart.tooltipBorder}`,
              fontSize: 11,
            }}
            itemStyle={{ color: theme.chart.tooltipText }}
            labelStyle={{ color: theme.chart.tooltipText }}
            labelFormatter={(val) => `Data: ${val}`}
            formatter={(val) => [Number(val).toFixed(3), 'Drawdown']}
          />
          <Area type="monotone" dataKey="drawdown" stroke="#ff1744" fill="#ff1744" fillOpacity={0.15} strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DrawdownChart = memo(DrawdownChartComponent);
