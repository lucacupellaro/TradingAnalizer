import { Info } from 'lucide-react';

export const KPICard = ({
  label,
  value,
  valueClass,
  subValue,
  icon: Icon,
  infoDesc,
  infoFormula,
  isDark,
  theme,
}) => {
  return (
    <div className={`
      relative group flex flex-col justify-between gap-1.5 p-3.5 min-h-[80px] rounded-lg
      overflow-hidden transition-all duration-200 glow-panel corner-accent
      ${isDark
        ? 'bg-[#0d1117] border border-[#1a2332] hover:border-[#ff8c00]/20'
        : 'bg-white border border-[#e5e7eb] hover:border-[#d1d5db] shadow-sm'
      }
    `}>

      {/* Top: label + info */}
      <div className="flex items-start justify-between gap-1">
        <div className={`flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] font-semibold leading-none ${isDark ? 'text-[#4a5568]' : theme.textFaint}`}>
          {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
          <span>{label}</span>
        </div>

        {(infoDesc || infoFormula) && (
          <div className="relative flex-shrink-0">
            <div className={`${isDark ? 'text-[#2d3a4a]' : theme.textFaint} hover:text-[#ff8c00] cursor-help transition-colors`}>
              <Info className="w-3 h-3" />
            </div>
            <div className={`
              absolute opacity-0 group-hover:opacity-100 pointer-events-none
              transition-opacity duration-150 bottom-full right-0 mb-2 z-[999]
              w-56 p-3 rounded-lg shadow-2xl
              ${isDark
                ? 'bg-[#111824] border border-[#1a2332]'
                : 'bg-white border border-[#e5e7eb] shadow-lg'
              }
            `}>
              {infoDesc && (
                <p className={`text-xs leading-snug mb-1.5 ${theme.textBold}`}>{infoDesc}</p>
              )}
              {infoFormula && (
                <code className={`block text-[10px] font-mono text-center px-2 py-1.5 rounded break-words
                  ${isDark ? 'bg-[#000000] text-[#ff8c00] border border-[#1a2332]' : 'bg-gray-50 text-blue-600 border border-gray-200'}
                `}>
                  {infoFormula}
                </code>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <div className={`text-lg font-bold font-mono tracking-tight break-words leading-tight ${valueClass || theme.textBold}`}>
          {value}
        </div>
        {subValue && (
          <div className={`text-[9px] mt-0.5 break-words font-mono ${isDark ? 'text-[#4a5568]' : theme.textFaint}`}>{subValue}</div>
        )}
      </div>

    </div>
  );
};
