import { memo, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatXAxisDate } from '../../utils/formatting';

function calcEMA(data, period) {
  if (!data || data.length < period) return data.map(d => ({ ...d }));
  const k = 2 / (period + 1);
  const result = [];
  let ema = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ ...data[i] });
    } else if (i === period - 1) {
      ema = data.slice(0, period).reduce((s, p) => s + p.equity, 0) / period;
      result.push({ ...data[i], [`ema${period}`]: parseFloat(ema.toFixed(2)) });
    } else {
      ema = data[i].equity * k + ema * (1 - k);
      result.push({ ...data[i], [`ema${period}`]: parseFloat(ema.toFixed(2)) });
    }
  }
  return result;
}

const EquityChartComponent = ({ data, title, theme }) => {
  const [showEma50, setShowEma50] = useState(true);
  const [showEma100, setShowEma100] = useState(true);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const with50 = calcEMA(data, 50);
    const with100 = calcEMA(with50, 100);
    return with100;
  }, [data]);

  if (!chartData.length) return null;

  const btnBase = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all border';

  return (
    <div className={`${theme.panel} border ${theme.borderLight} rounded-lg p-4 h-[300px] glow-panel`}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-bold text-[#00e676] text-[11px] uppercase tracking-widest flex items-center gap-2 font-mono">
          <TrendingUp className="w-3.5 h-3.5" />
          {title || 'Equity Line'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEma50(v => !v)}
            className={`${btnBase} ${showEma50 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : `${theme.card} ${theme.textMuted} border-transparent opacity-40`}`}
          >
            EMA 50
          </button>
          <button
            onClick={() => setShowEma100(v => !v)}
            className={`${btnBase} ${showEma100 ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' : `${theme.card} ${theme.textMuted} border-transparent opacity-40`}`}
          >
            EMA 100
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={chartData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: theme.chart.tooltipText }}
            tickFormatter={formatXAxisDate}
            stroke={theme.chart.axis}
          />
          <YAxis tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.chart.tooltipBg,
              color: theme.chart.tooltipText,
              border: `1px solid ${theme.chart.tooltipBorder}`,
              fontSize: 11,
            }}
            labelFormatter={(val) => `Data: ${val}`}
          />
          <Line
            type="stepAfter"
            dataKey="equity"
            stroke={theme.chart.success}
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
          {showEma50 && (
            <Line
              type="monotone"
              dataKey="ema50"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              isAnimationActive={false}
              connectNulls={false}
              name="EMA 50"
            />
          )}
          {showEma100 && (
            <Line
              type="monotone"
              dataKey="ema100"
              stroke="#a855f7"
              dot={false}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              isAnimationActive={false}
              connectNulls={false}
              name="EMA 100"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EquityChart = memo(EquityChartComponent);
