// Mathematical functions
export const getPercentile = (data, q) => {
  if (!data || data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
};

// Error function (Gauss error function)
export const erf = (x) => {
  const sign = (x >= 0) ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
};

// Normal Cumulative Distribution Function
export const normalCDF = (x, mean, std) => {
  if (std === 0 || isNaN(std)) return x >= mean ? 1 : 0;
  return 0.5 * (1 + erf((x - mean) / (std * Math.sqrt(2))));
};
