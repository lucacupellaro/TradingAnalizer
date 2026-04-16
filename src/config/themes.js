// Bloomberg Terminal–inspired theme
export const getTheme = (isDark) => ({
  bg:          isDark ? 'bg-[#000000]'       : 'bg-[#f5f6f8]',
  panel:       isDark ? 'bg-[#0a0a0a]'      : 'bg-white',
  card:        isDark ? 'bg-[#0e0e0e]'      : 'bg-white',
  cardHover:   isDark ? 'hover:bg-[#141414]' : 'hover:bg-[#f7f8fa]',
  input:       isDark
    ? 'bg-[#000000] border-[#1a1a1a] text-gray-200 focus:border-[#ff8c00] focus:ring-1 focus:ring-[#ff8c00]/30 px-3 py-2 text-sm transition-all focus:outline-none placeholder:text-gray-700 font-mono'
    : 'bg-white border-[#d1d5db] text-gray-800 focus:border-[#3182ce] focus:ring-1 focus:ring-[#3182ce]/30 px-3 py-2 text-sm transition-all focus:outline-none placeholder:text-gray-400',
  border:      isDark ? 'border-[#1a1a1a]' : 'border-[#e5e7eb]',
  borderLight: isDark ? 'border-[#141414]' : 'border-[#f3f4f6]',
  text:        isDark ? 'text-[#a0a0a0]'   : 'text-[#1f2937]',
  textBold:    isDark ? 'text-[#e0e0e0] font-semibold' : 'text-[#111827] font-semibold',
  textMuted:   isDark ? 'text-[#555555] font-medium'   : 'text-[#6b7280] font-medium',
  textFaint:   isDark ? 'text-[#333333]' : 'text-[#9ca3af]',
  accent1:     isDark ? 'text-[#ff8c00] font-medium'  : 'text-[#2563eb] font-medium',
  accent2:     isDark ? 'text-[#ffa726] font-medium'  : 'text-[#d97706] font-medium',
  accentBg:    isDark
    ? 'bg-[#ff8c00] text-black hover:bg-[#ff9f1c] px-4 py-2 font-bold transition-colors border border-[#ff8c00]/60 rounded-lg'
    : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] px-4 py-2 font-semibold transition-colors rounded-lg',
  btnPrimary:  isDark
    ? 'bg-[#0e0e0e] text-[#ff8c00] border border-[#1a1a1a] hover:bg-[#141414] hover:border-[#ff8c00]/30 px-4 py-2 text-sm font-medium transition-all rounded-lg'
    : 'bg-white text-[#2563eb] border border-[#e5e7eb] hover:bg-[#f8fafc] px-4 py-2 text-sm font-medium transition-all shadow-sm rounded-lg',
  success:  isDark ? 'text-[#00e676]' : 'text-[#16a34a]',
  danger:   isDark ? 'text-[#ff1744]' : 'text-[#dc2626]',
  warning:  isDark ? 'text-[#ffa726]' : 'text-[#d97706]',
  // Navbar / Sidebar / MarketTicker
  navBg:       isDark ? 'bg-[#050505]' : 'bg-white',
  navBorder:   isDark ? 'border-[#1a1a1a]' : 'border-[#e5e7eb]',
  navText:     isDark ? 'text-[#555555]' : 'text-[#6b7280]',
  navHover:    isDark ? 'hover:text-[#ff8c00] hover:bg-[#ff8c00]/5' : 'hover:text-[#2563eb] hover:bg-[#2563eb]/5',
  navBtnBg:    isDark ? 'bg-[#0e0e0e] border-[#1a1a1a]' : 'bg-[#f3f4f6] border-[#d1d5db]',
  chart: {
    grid:         isDark ? '#0e0e0e'  : '#f3f4f6',
    axis:         isDark ? '#1a1a1a'  : '#9ca3af',
    tick:         isDark ? '#555555'  : '#6b7280',
    tooltipBg:    isDark ? '#0a0a0a'  : '#ffffff',
    tooltipBorder:isDark ? '#1a1a1a'  : '#e5e7eb',
    tooltipText:  isDark ? '#e0e0e0'  : '#111827',
    scatterRef:   isDark ? '#1a1a1a'  : '#d1d5db',
    success:      isDark ? '#00e676'  : '#16a34a',
    danger:       isDark ? '#ff1744'  : '#dc2626',
    primary:      isDark ? '#ff8c00'  : '#2563eb',
    secondary:    isDark ? '#a78bfa'  : '#7c3aed',
    boxLine:      isDark ? '#2a2a2a'  : '#374151',
  }
});

export const getLineColors = (isDark) => [
  isDark ? '#ff8c00' : '#2563eb',
  isDark ? '#00e676' : '#16a34a',
  isDark ? '#ffa726' : '#d97706',
  isDark ? '#ff1744' : '#dc2626',
  isDark ? '#c084fc' : '#7c3aed',
  isDark ? '#ff6d00' : '#ea580c',
  isDark ? '#00bcd4' : '#0d9488',
  isDark ? '#f472b6' : '#db2777',
  isDark ? '#64b5f6' : '#475569',
  isDark ? '#4dd0e1' : '#0e7490',
];
