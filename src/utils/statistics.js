import { normalCDF, getPercentile } from './math';
import { JB_CRITICAL_VALUE, AD_CRITICAL_VALUE, WEEK_DAYS } from '../config/constants';

// Skewness and Kurtosis
export const skewnessAndKurtosis = (data, mean, std) => {
  if (!data || data.length < 3 || std === 0 || isNaN(std)) return { skew: 0, kurt: 0 };
  let sum3 = 0, sum4 = 0, n = data.length;
  for (let i = 0; i < n; i++) {
    let z = (data[i] - mean) / std;
    sum3 += Math.pow(z, 3);
    sum4 += Math.pow(z, 4);
  }
  return { skew: sum3 / n, kurt: (sum4 / n) - 3 };
};

// Jarque-Bera Test
export const jarqueBeraTest = (n, skew, kurt) => {
  if (n < 3) return { jb: 0, isNormal: false };
  const jb = (n / 6) * (Math.pow(skew, 2) + Math.pow(kurt, 2) / 4);
  return { jb, isNormal: jb < JB_CRITICAL_VALUE };
};

// Anderson-Darling Test
export const adTest = (data, mean, std) => {
  if (!data || data.length === 0 || std === 0 || isNaN(std)) return { a2: 0, critical: 0, isNormal: false };
  let sorted = [...data].sort((a, b) => a - b), n = sorted.length, sum = 0;
  for (let i = 0; i < n; i++) {
    let f1 = Math.max(1e-15, Math.min(1 - 1e-15, normalCDF(sorted[i], mean, std)));
    let f2 = Math.max(1e-15, Math.min(1 - 1e-15, normalCDF(sorted[n - 1 - i], mean, std)));
    sum += (2 * (i + 1) - 1) * (Math.log(f1) + Math.log(1 - f2));
  }
  let a2 = -n - sum / n, a2_mod = a2 * (1 + 0.75 / n + 2.25 / (n * n));
  return { a2: a2_mod, critical: AD_CRITICAL_VALUE, isNormal: a2_mod < AD_CRITICAL_VALUE };
};

// Calculate Day Statistics
export const calculateDayStats = (tradesArray) => {
  if (!tradesArray) return [];
  const dailyData = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  tradesArray.forEach(t => {
    if (t.TimeMs) { dailyData[new Date(t.TimeMs).getDay()].push(t.net); }
  });
  return WEEK_DAYS.map((name, i) => {
    const dData = dailyData[i];
    if (dData.length === 0) return null;
    const avg = dData.reduce((a, b) => a + b, 0) / dData.length, min = Math.min(...dData), max = Math.max(...dData);
    const q1 = getPercentile(dData, 0.25), median = getPercentile(dData, 0.5), q3 = getPercentile(dData, 0.75);
    return { name, avg, min, max, q1, median, q3, minMax: [min, max], q1q3: [q1, q3], count: dData.length };
  }).filter(x => x !== null);
};

// Calculate Beta and Correlation with Market
export const calcBetaCorr = (targetDailyPNL, spxDailyReturns) => {
  if (!spxDailyReturns) return { beta: 0, corr: 0 };
  const days = Object.keys(targetDailyPNL);
  if (days.length < 2) return { beta: 0, corr: 0 };

  let sumT = 0, sumB = 0, count = 0;
  const targetReturns = {};
  let currentEq = 10000;

  const sortedDays = days.sort();
  for (let d of sortedDays) {
    const pnl = targetDailyPNL[d];
    const ret = pnl / currentEq;
    targetReturns[d] = ret;
    currentEq += pnl;
    if (spxDailyReturns[d] !== undefined) {
      sumT += ret;
      sumB += spxDailyReturns[d];
      count++;
    }
  }
  if (count < 2) return { beta: 0, corr: 0 };

  const meanT = sumT / count, meanB = sumB / count;
  let cov = 0, varB = 0, varT = 0;
  for (let d of sortedDays) {
    if (spxDailyReturns[d] !== undefined) {
      const t = targetReturns[d] - meanT, b = spxDailyReturns[d] - meanB;
      cov += t * b;
      varB += b * b;
      varT += t * t;
    }
  }
  return { beta: varB > 0 ? cov / varB : 0, corr: (varT > 0 && varB > 0) ? cov / Math.sqrt(varT * varB) : 0 };
};
