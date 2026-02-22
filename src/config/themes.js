// Theme configuration
export const getTheme = (isDark) => ({
  bg: isDark ? 'bg-black' : 'bg-slate-100',
  panel: isDark ? 'bg-[#0a0a0a]' : 'bg-white',
  card: isDark ? 'bg-[#111]' : 'bg-slate-50',
  cardHover: isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-slate-100',
  input: isDark ? 'bg-[#1a1a1a] border-[#444] text-white focus:border-white px-4 py-3' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 px-4 py-3',
  border: isDark ? 'border-[#333]' : 'border-slate-200',
  borderLight: isDark ? 'border-[#222]' : 'border-slate-100',
  text: isDark ? 'text-[#e0e0e0]' : 'text-slate-700',
  textBold: isDark ? 'text-white font-bold' : 'text-slate-900 font-bold',
  textMuted: isDark ? 'text-[#888]' : 'text-slate-500',
  textFaint: isDark ? 'text-[#555]' : 'text-slate-400',
  accent1: isDark ? 'text-white font-bold' : 'text-blue-600 font-bold',
  accent2: isDark ? 'text-[#ffcc00] font-bold' : 'text-amber-600 font-bold',
  accentBg: isDark ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] px-6 py-4 font-bold' : 'bg-blue-600 text-white hover:bg-blue-700 px-6 py-4 font-bold',
  btnPrimary: isDark ? 'bg-[#ffcc00] text-black hover:bg-white px-6 py-4 font-bold' : 'bg-blue-600 text-white hover:bg-blue-700 px-6 py-4 font-bold',
  success: isDark ? 'text-[#00ff00]' : 'text-emerald-600',
  danger: isDark ? 'text-[#ff0000]' : 'text-rose-600',
  warning: isDark ? 'text-[#ffcc00]' : 'text-amber-500',
  chart: {
    grid: isDark ? '#222' : '#e2e8f0',
    axis: isDark ? '#444' : '#94a3b8',
    tick: isDark ? '#888' : '#64748b',
    tooltipBg: isDark ? '#000' : '#fff',
    tooltipBorder: isDark ? '#444' : '#cbd5e1',
    tooltipText: isDark ? '#fff' : '#0f172a',
    scatterRef: isDark ? '#444' : '#94a3b8',
    success: isDark ? '#00ff00' : '#10b981',
    danger: isDark ? '#ff0000' : '#ef4444',
    primary: isDark ? '#ffcc00' : '#f59e0b',
    secondary: isDark ? '#ffffff' : '#0ea5e9',
    boxLine: isDark ? '#e2e8f0' : '#475569'
  }
});

export const getLineColors = (isDark) => [
  isDark ? '#00ff00' : '#16a34a',
  isDark ? '#ffffff' : '#0ea5e9',
  isDark ? '#ffcc00' : '#d97706',
  isDark ? '#ff00ff' : '#c026d3',
  isDark ? '#ff3333' : '#dc2626',
  '#3399ff',
  '#ff9933',
  '#cc66ff',
  '#33cc99',
  isDark ? '#00ffff' : '#0f172a',
  '#ff66b2',
  '#99ff33',
  '#00bfff',
  '#ff9999',
  '#cccc00'
];
