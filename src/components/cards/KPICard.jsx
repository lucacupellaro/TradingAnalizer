import { memo } from 'react';
import { Info } from 'lucide-react';

const KPICardComponent = ({
  label,
  value,
  valueClass,
  subValue,
  icon: Icon,
  infoDesc,
  infoFormula,
  isDark,
  theme,
  signal, // "good" | "bad" | undefined
}) => {
  const borderColor = signal === 'good'
    ? 'border-[#00e676]/50 shadow-[0_0_8px_rgba(0,230,118,0.15)]'
    : signal === 'bad'
    ? 'border-[#ff1744]/50 shadow-[0_0_8px_rgba(255,23,68,0.15)]'
    : theme.borderLight;

  return (
    <div
      className={`
        ${theme.card}
        px-5 py-12
        rounded border ${borderColor}
        flex flex-col justify-center
        relative group
        min-h-[104px]
        overflow-visible
        transition-all duration-300
      `}
    >
      <div className="flex justify-between items-start w-full gap-2 mb-12">
        <div
          className={`
            ${theme.textMuted}
            text-[10px] uppercase font-bold
            flex items-center gap-2
            leading-[1.35]
            tracking-wide
            pr-2
          `}
        >
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          <span className="break-words">{label}</span>
        </div>

        {(infoDesc || infoFormula) && (
          <div
            className={`
              ${theme.textFaint}
              cursor-help transition-colors
              z-10 relative shrink-0 mt-[1px]
            `}
          >
            <Info className="w-3.5 h-3.5" />

            <div
              className={`
                absolute opacity-0 group-hover:opacity-100 transition-opacity
                bottom-full right-0 mb-10
                w-56 md:w-64 p-3
                ${theme.panel} border ${theme.border}
                rounded shadow-2xl z-[999]
                pointer-events-none
              `}
            >
              {infoDesc && (
                <div className={`text-[10px] ${theme.textBold} mb-10 leading-[1.4] font-sans`}>
                  {infoDesc}
                </div>
              )}

              {infoFormula && (
                <div
                  className={`
                    text-[9px] font-mono ${theme.accent1}
                    ${theme.card} p-2 rounded border ${theme.borderLight}
                    text-center font-bold tracking-wide break-words
                    leading-[1.4]
                  `}
                >
                  {infoFormula}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className={`
          text-lg font-mono font-bold
          break-all leading-[1.35]
          pb-[2px]
          ${valueClass || theme.textBold}
        `}
      >
        {value}
      </div>

      {subValue && (
        <div
          className={`
            text-[10px] ${theme.textFaint}
            font-mono mt-10 leading-[1.35]
            pb-[1px]
          `}
        >
          {subValue}
        </div>
      )}
    </div>
  );
};

export const KPICard = memo(KPICardComponent);