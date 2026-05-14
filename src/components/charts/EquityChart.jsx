import { memo, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatXAxisDate } from '../../utils/formatting';

function calcEMA(data, period, key = 'equity') {
  if (!data || data.length < period) return data.map(d => ({ ...d }));
  const k = 2 / (period + 1);
  const result = [];
  let ema = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ ...data[i] });
    } else if (i === period - 1) {
      ema = data.slice(0, period).reduce((s, p) => s + (p[key] ?? 0), 0) / period;
      result.push({ ...data[i], [`ema${period}`]: parseFloat(ema.toFixed(2)) });
    } else {
      ema = (data[i][key] ?? 0) * k + ema * (1 - k);
      result.push({ ...data[i], [`ema${period}`]: parseFloat(ema.toFixed(2)) });
    }
  }
  return result;
}

const EquityChartComponent = ({ data, title, theme, spxData, initialCapital }) => {
  const [showEma50, setShowEma50] = useState(true);
  const [showEma100, setShowEma100] = useState(true);
  const [normalize, setNormalize] = useState(false);

  const canNormalize = !!spxData && !!initialCapital && initialCapital > 0;

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (normalize && canNormalize) {
      const parseD = (s) => {
        const dt = new Date(s);
        return isNaN(dt) ? null : dt;
      };
      const startDt = parseD(data[0].date);
      if (!startDt) return [];
      const sortedSpx = Object.entries(spxData)
        .map(([d, r]) => ({ dt: new Date(d), r }))
        .filter(x => !isNaN(x.dt) && x.dt >= startDt)
        .sort((a, b) => a.dt - b.dt);
      let cumSpx = 0;
      let spxIdx = 0;
      const out = data.map(pt => {
        const dt = parseD(pt.date);
        if (dt) {
          while (spxIdx < sortedSpx.length && sortedSpx[spxIdx].dt <= dt) {
            cumSpx += sortedSpx[spxIdx].r;
            spxIdx++;
          }
        }
        const equityNorm = ((initialCapital + (pt.equity ?? 0)) / initialCapital) * 100;
        const spxNorm = (1 + cumSpx) * 100;
        return { ...pt, equityNorm: parseFloat(equityNorm.toFixed(2)), spxNorm: parseFloat(spxNorm.toFixed(2)) };
      });
      const with50 = calcEMA(out, 50, 'equityNorm');
      const with100 = calcEMA(with50, 100, 'equityNorm');
      return with100;
    }
    const with50 = calcEMA(data, 50);
    const with100 = calcEMA(with50, 100);
    return with100;
  }, [data, normalize, canNormalize, spxData, initialCapital]);

  if (!chartData.length) return null;

  const btnBase = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all border';
  const mainKey = normalize && canNormalize ? 'equityNorm' : 'equity';
  const fmtVal = (v) => normalize && canNormalize ? `${Number(v).toFixed(2)}` : `€${Number(v).toFixed(2)}`;

  return (
    <div className={`${theme.panel} border ${theme.borderLight} rounded-lg p-4 glow-panel`}>
      <div className="flex items-center justify-between mb-12 flex-wrap gap-2">
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
          {canNormalize && (
            <button
              onClick={() => setNormalize(v => !v)}
              title="Normalizza vs SP500 (base 100)"
              className={`${btnBase} ${normalize ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : `${theme.card} ${theme.textMuted} border-transparent opacity-40`}`}
            >
              NORM vs SP500
            </button>
          )}
        </div>
      </div>
      <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: theme.chart.tooltipText }}
            tickFormatter={formatXAxisDate}
            stroke={theme.chart.axis}
          />
          <YAxis tick={{ fontSize: 9, fill: theme.chart.tooltipText }} stroke={theme.chart.axis} domain={['auto', 'auto']} width={60} />
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
            formatter={(val, name) => [fmtVal(val), name]}
          />
          <Line
            type="stepAfter"
            dataKey={mainKey}
            stroke={theme.chart.success}
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
            name={normalize && canNormalize ? 'Equity (norm)' : 'Equity'}
          />
          {normalize && canNormalize && (
            <Line
              type="monotone"
              dataKey="spxNorm"
              stroke="#38bdf8"
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
              name="SP500 (norm)"
            />
          )}
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
    </div>
  );
};

export const EquityChart = memo(EquityChartComponent);
