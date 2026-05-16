import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ZAxis } from 'recharts';
import { Activity } from 'lucide-react';

export const CullenFreyPlot = ({ skew, kurt, name, isDark, theme }) => {
  return (
    <div className={`${theme.panel} border ${theme.borderLight} rounded p-4 h-[300px] relative`}>
      <h4 className={`text-center font-bold ${theme.textMuted} mb-2 text-[10px] uppercase tracking-wider flex items-center justify-center gap-2`}><Activity className={`w-4 h-4 ${theme.accent1}`} /> Cullen & Frey Plot ({name})</h4>
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chart.grid} />
          <XAxis type="number" dataKey="skewSq" name="Skewness²" tick={{ fontSize: 10, fill: theme.chart.tooltipText }} axisLine={{ stroke: theme.chart.axis }} label={{ value: 'Skewness²', position: 'bottom', fill: theme.chart.tooltipText, fontSize: 10 }} />
          <YAxis type="number" dataKey="kurt" name="Kurtosi" tick={{ fontSize: 10, fill: theme.chart.tooltipText }} axisLine={{ stroke: theme.chart.axis }} reversed label={{ value: 'Kurtosis (Ecc.)', angle: -90, position: 'left', fill: theme.chart.tooltipText, fontSize: 10 }} />
          <ZAxis type="number" range={[50, 50]} />
          <Tooltip cursor={{ strokeDasharray: '3 3', stroke: theme.chart.axis }} contentStyle={{ backgroundColor: theme.chart.tooltipBg, border: `1px solid ${theme.chart.tooltipBorder}`, color: theme.chart.tooltipText }} />
          <Legend wrapperStyle={{ fontSize: 9, paddingTop: 10, color: theme.chart.tooltipText }} />
          <ReferenceLine x={0} stroke={theme.chart.scatterRef} />
          <ReferenceLine y={0} stroke={theme.chart.scatterRef} />

          {/* Reference Distributions */}
          <Scatter name="Normale" data={[{ skewSq: 0, kurt: 0 }]} fill={theme.chart.danger} shape="cross" />
          <Scatter name="Uniforme" data={[{ skewSq: 0, kurt: -1.2 }]} fill="#ff9933" shape="triangle" />
          <Scatter name="Logistica" data={[{ skewSq: 0, kurt: 1.2 }]} fill="#cc66ff" shape="diamond" />
          <Scatter name="Esponenziale" data={[{ skewSq: 4, kurt: 6 }]} fill="#33cc99" shape="star" />

          {/* Your System */}
          <Scatter name="Il tuo Sistema" data={[{ skewSq: Math.pow(skew || 0, 2), kurt: kurt || 0 }]} fill={theme.chart.secondary} shape="circle" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
