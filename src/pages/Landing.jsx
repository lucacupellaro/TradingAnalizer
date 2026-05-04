import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  Moon,
  Sun,
  TrendingUp,
  Dice5,
  GitCompare,
  BarChart3,
  Filter,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

/* ------------------------------------------------------------------ *
 *  Animation variants
 * ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' },
  },
};

const stagger = (delay = 0, step = 0.08) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: step,
      delayChildren: delay,
    },
  },
});

/* ------------------------------------------------------------------ *
 *  Mock data
 * ------------------------------------------------------------------ */

const MOCK_TRADE_ROWS = [
  { sym: 'EURUSD', type: 'BUY', vol: '0.50', profit: '+128.40' },
  { sym: 'GBPJPY', type: 'SELL', vol: '0.30', profit: '-42.10' },
  { sym: 'XAUUSD', type: 'BUY', vol: '0.10', profit: '+217.80' },
  { sym: 'USDJPY', type: 'BUY', vol: '0.40', profit: '+64.20' },
  { sym: 'AUDUSD', type: 'SELL', vol: '0.25', profit: '-18.55' },
  { sym: 'EURGBP', type: 'BUY', vol: '0.20', profit: '+33.90' },
];

const MOCK_KPIS = [
  { label: 'Net P&L', value: 4827, prefix: '€', decimals: 0, good: true },
  { label: 'Sharpe', value: 1.84, prefix: '', decimals: 2, good: true },
  { label: 'Win Rate', value: 58.3, prefix: '', decimals: 1, good: true, suffix: '%' },
  { label: 'Max DD', value: 12.4, prefix: '', decimals: 1, good: false, suffix: '%' },
];

const EQUITY_PATH =
  'M0,90 L12,86 L24,82 L36,84 L48,76 L60,72 L72,78 L84,68 L96,60 ' +
  'L108,64 L120,55 L132,50 L144,58 L156,46 L168,40 L180,44 L192,34 ' +
  'L204,38 L216,30 L228,26 L240,33 L252,22 L264,28 L276,18 L288,24 ' +
  'L300,12 L312,18 L324,10 L336,15 L348,8  L360,12 L372,6  L384,10 L396,4';

const MOCK_SCATTER = [
  { x: 18, y: 96 },
  { x: 42, y: 90 },
  { x: 60, y: 78 },
  { x: 88, y: 84 },
  { x: 110, y: 70 },
  { x: 130, y: 64 },
  { x: 158, y: 56 },
  { x: 184, y: 60 },
  { x: 210, y: 44 },
  { x: 240, y: 38 },
  { x: 268, y: 32 },
  { x: 298, y: 22 },
  { x: 326, y: 26 },
  { x: 354, y: 14 },
  { x: 380, y: 10 },
];

const TICKER_PILLS = [
  { sym: 'EURUSD', val: '1.0824', delta: '+0.12%', up: true },
  { sym: 'XAUUSD', val: '2381.4', delta: '-0.34%', up: false },
  { sym: 'SPX500', val: '5188.3', delta: '+0.58%', up: true },
];

const FEATURES = [
  {
    Icon: TrendingUp,
    title: 'Equity & Drawdown',
    desc: 'Curva cumulata, max drawdown evidenziato e ranking per simbolo o strategia.',
  },
  {
    Icon: Dice5,
    title: 'Monte Carlo',
    desc: '10.000 simulazioni bootstrap del tuo equity, in un Web Worker. Senza freeze.',
  },
  {
    Icon: GitCompare,
    title: 'Correlazione SPX',
    desc: 'Beta e correlazione vs S&P 500 con scarico storico Yahoo Finance.',
  },
  {
    Icon: BarChart3,
    title: 'Distribuzioni & normalità',
    desc: 'Skewness, kurtosis, Jarque-Bera, Anderson-Darling, Cullen-Frey plot.',
  },
  {
    Icon: Filter,
    title: 'Filtri intelligenti',
    desc: 'Per simbolo, direzione, strategia, range temporale e ordinale dei trade.',
  },
  {
    Icon: ShieldCheck,
    title: 'Privato per default',
    desc: 'Il tuo CSV non lascia mai il browser. Nessun upload sui nostri server.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Importa il report',
    desc: 'Trascina il file MetaTrader (.xlsx / .csv) nella dropzone.',
  },
  {
    n: '02',
    title: 'Filtra il subset',
    desc: "Scegli date, simboli, strategie. L'analisi parte solo quando vuoi tu.",
  },
  {
    n: '03',
    title: 'Leggi i numeri',
    desc: 'Più di 60 metriche, già pronte. Niente Excel, niente formule a mano.',
  },
];

/* ------------------------------------------------------------------ *
 *  Count-up number
 * ------------------------------------------------------------------ */

function CountUp({
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1.2,
  delay = 0,
}) {
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();

  const display = useTransform(mv, (v) => {
    const n = Number(v).toFixed(decimals);
    return `${prefix}${n}${suffix}`;
  });

  useEffect(() => {
    if (reduce) {
      mv.set(to);
      return;
    }

    const controls = animate(mv, to, {
      duration,
      delay,
      ease: 'easeOut',
    });

    return () => controls.stop();
  }, [to, duration, delay, mv, reduce]);

  return <motion.span>{display}</motion.span>;
}

/* ------------------------------------------------------------------ *
 *  Top bar
 * ------------------------------------------------------------------ */

function TopBar({ theme, isDark, setIsDark, onStart }) {
  return (
    <nav className={`w-full ${theme.navBg} border-b ${theme.navBorder} transition-colors`}>
      <div className="w-full">
        <div className="h-14 flex items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <img src="/Logo.jpg" alt="SniperForex" className="w-8 h-8 rounded-full object-cover" />
              <span className={`font-bold text-base tracking-widest font-mono whitespace-nowrap ${isDark ? 'text-[#ff8c00] glow-orange' : 'text-[#2563eb]'}`}>
                SNIPERFOREX TERMINAL
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1 ml-3 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] pulse-live" />
              <span className={`text-[9px] uppercase tracking-widest font-mono whitespace-nowrap ${theme.navText}`}>
                LIVE
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded border ${theme.navBtnBg} ${theme.navText} ${theme.navHover} transition-all shrink-0`}
              title={isDark ? 'Tema chiaro' : 'Tema scuro'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={onStart}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest border font-mono whitespace-nowrap shrink-0 h-8 transition-all ${
                isDark
                  ? 'bg-[#ff8c00] hover:bg-[#ff9f1c] text-black border-[#ff8c00]/60 shadow-lg shadow-[#ff8c00]/20 hover:scale-105 hover:shadow-[#ff8c00]/40'
                  : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-[#2563eb] shadow-lg shadow-[#2563eb]/20 hover:scale-105'
              }`}
            >
              Accedi
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ *
 *  Background
 * ------------------------------------------------------------------ */

function DotGridBg({ isDark }) {
  const dot = isDark ? '#ff8c0010' : '#2563eb14';

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(${dot} 1px, transparent 1px)`,
        backgroundSize: '22px 22px',
      }}
    />
  );
}

/* ------------------------------------------------------------------ *
 *  Hero
 * ------------------------------------------------------------------ */

function Hero({ theme, isDark, onStart, onScrollToDemo }) {
  return (
    <section className="relative w-full overflow-hidden">
      <DotGridBg isDark={isDark} />

      <div className="w-full pt-16 md:pt-20 relative">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {TICKER_PILLS.map((t, i) => (
            <motion.div
              key={t.sym}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded font-mono text-[11px] ${theme.card} border ${theme.border}`}
            >
              <span className={theme.textMuted}>{t.sym}</span>
              <span className={theme.textBold}>{t.val}</span>
              <span
                className={
                  t.up
                    ? isDark
                      ? 'text-[#00e676]'
                      : 'text-[#16a34a]'
                    : isDark
                      ? 'text-[#ff1744]'
                      : 'text-[#dc2626]'
                }
              >
                {t.delta}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full pt-10 pb-32 md:pt-14 md:pb-40 relative flex justify-center">
        <motion.div
          variants={stagger(0, 0.1)}
          initial="hidden"
          animate="show"
          className="w-full max-w-4xl text-center"
        >
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-8">
            <Sparkles className={`w-4 h-4 ${isDark ? 'text-[#ff8c00]' : 'text-[#2563eb]'}`} />

            <span
              className={`text-[10px] uppercase tracking-[0.3em] font-mono font-bold ${isDark ? 'text-[#ff8c00]' : 'text-[#2563eb]'
                }`}
            >
              Trading Report Analyzer
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className={`font-display text-4xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight mb-8 ${theme.textBold}`}
          >
            Il tuo report MetaTrader.
            <br />
            <span className={isDark ? 'text-[#ff8c00] glow-orange' : 'text-[#2563eb]'}>
              Decostruito in numeri
            </span>{' '}
            che parlano.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className={`text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-12 ${theme.textMuted}`}
          >
            60+ metriche, simulazioni Monte Carlo, correlazione vs S&amp;P 500,
            drawdown, distribuzioni e test di normalità — in tempo reale, dal tuo CSV.
            Niente upload sui server, niente fogli Excel.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={onStart}
              className={`group inline-flex items-center gap-3 px-7 h-14 rounded font-bold uppercase tracking-widest font-mono text-sm transition-all ${isDark
                  ? 'bg-[#ff8c00] hover:bg-[#ff9f1c] text-black shadow-lg shadow-[#ff8c00]/30 hover:shadow-[#ff8c00]/50 hover:scale-[1.02]'
                  : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-[#2563eb]/30 hover:scale-[1.02]'
                }`}
            >
              Prova ora — è gratis
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onScrollToDemo}
              className={`inline-flex items-center gap-2 px-3 h-14 text-xs uppercase tracking-widest font-mono ${theme.navText} ${theme.navHover} transition-colors`}
            >
              Guarda come funziona
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 *  Demo cycle
 * ------------------------------------------------------------------ */

function DemoCycle({ theme, isDark, cycleKey }) {
  const accent = isDark ? '#ff8c00' : '#2563eb';
  const accentSoft = isDark ? '#ff8c0033' : '#2563eb33';
  const success = isDark ? '#00e676' : '#16a34a';
  const danger = isDark ? '#ff1744' : '#dc2626';

  return (
    <div key={cycleKey} className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className={`${theme.card} border ${theme.border} rounded-lg p-6 relative overflow-hidden`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
            <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
            <span className="w-2 h-2 rounded-full bg-[#28c840]" />
          </div>

          <span className={`text-[10px] uppercase tracking-widest font-mono ${theme.textMuted}`}>
            INPUT · report.csv
          </span>
        </div>

        <div
          className="relative rounded-md border-2 border-dashed flex items-center justify-center h-[180px]"
          style={{ borderColor: accentSoft }}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.0, ease: 'easeOut' }}
            className="flex flex-col items-center gap-2"
          >
            <FileSpreadsheet className="w-10 h-10" style={{ color: accent }} />
            <span className={`font-mono text-xs ${theme.textBold}`}>report_mt5.csv</span>
            <span className={`font-mono text-[10px] ${theme.textFaint}`}>
              2.4 MB · 1 247 trades
            </span>
          </motion.div>

          <div
            className="absolute bottom-3 left-3 right-3 h-1 rounded-full overflow-hidden"
            style={{ background: `${accent}20` }}
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.2, delay: 1.6, ease: 'easeInOut' }}
              className="h-full"
              style={{ background: accent }}
            />
          </div>
        </div>

        <motion.div
          variants={stagger(3.0, 0.06)}
          initial="hidden"
          animate="show"
          className="mt-5 font-mono text-[11px]"
        >
          <div className={`flex items-center justify-between py-1.5 border-b ${theme.borderLight} ${theme.textFaint}`}>
            <span className="w-1/4">SYMBOL</span>
            <span className="w-1/6 text-right">TYPE</span>
            <span className="w-1/6 text-right">VOL</span>
            <span className="w-1/4 text-right">PROFIT</span>
          </div>

          {MOCK_TRADE_ROWS.map((r, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={`flex items-center justify-between py-1.5 ${i < MOCK_TRADE_ROWS.length - 1 ? `border-b ${theme.borderLight}` : ''
                }`}
            >
              <span className={`w-1/4 ${theme.textBold}`}>{r.sym}</span>

              <span
                className="w-1/6 text-right font-bold"
                style={{ color: r.type === 'BUY' ? success : danger }}
              >
                {r.type}
              </span>

              <span className={`w-1/6 text-right ${theme.text}`}>{r.vol}</span>

              <span
                className="w-1/4 text-right font-bold"
                style={{ color: r.profit.startsWith('+') ? success : danger }}
              >
                {r.profit}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className={`${theme.card} border ${theme.border} rounded-lg p-6 relative overflow-hidden`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-[10px] uppercase tracking-widest font-mono ${theme.textMuted}`}>
            OUTPUT · dashboard
          </span>

          <span className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: success }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: success }} />
            ANALIZZATO
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {MOCK_KPIS.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 3.2 + i * 0.18, ease: 'easeOut' }}
              className={`${theme.panel} border ${theme.borderLight} rounded p-3`}
            >
              <div className={`text-[9px] uppercase tracking-widest font-mono mb-1 ${theme.textFaint}`}>
                {k.label}
              </div>

              <div className="font-mono text-lg font-bold" style={{ color: k.good ? success : danger }}>
                <CountUp
                  to={k.value}
                  decimals={k.decimals}
                  prefix={k.prefix}
                  suffix={k.suffix || ''}
                  duration={1.0}
                  delay={3.4 + i * 0.18}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className={`${theme.panel} border ${theme.borderLight} rounded p-3 mb-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] uppercase tracking-widest font-mono ${theme.textFaint}`}>
              EQUITY CURVE
            </span>

            <span className="font-mono text-[9px]" style={{ color: success }}>
              +48.27%
            </span>
          </div>

          <svg viewBox="0 0 400 100" className="w-full h-[80px]" preserveAspectRatio="none">
            <motion.path
              d={EQUITY_PATH}
              fill="none"
              stroke={accent}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, delay: 4.6, ease: 'easeInOut' }}
            />
          </svg>
        </div>

        <div className={`${theme.panel} border ${theme.borderLight} rounded p-3`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] uppercase tracking-widest font-mono ${theme.textFaint}`}>
              CORRELATION · SPX500
            </span>

            <span className={`font-mono text-[9px] ${theme.textMuted}`}>β = 0.74</span>
          </div>

          <svg viewBox="0 0 400 100" className="w-full h-[80px]">
            <motion.line
              x1="0"
              y1="98"
              x2="400"
              y2="6"
              stroke={accent}
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 6.4 }}
            />

            {MOCK_SCATTER.map((p, i) => (
              <motion.circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3"
                fill={accent}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.85, scale: 1 }}
                transition={{ duration: 0.3, delay: 6.6 + i * 0.06 }}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Demo section
 * ------------------------------------------------------------------ */

function DemoSection({ theme, isDark, anchorRef }) {
  const [cycleKey, setCycleKey] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;

    const id = setInterval(() => {
      setCycleKey((k) => k + 1);
    }, 9000);

    return () => clearInterval(id);
  }, [reduce]);

  return (
    <section ref={anchorRef} className={`w-full border-t ${theme.border}`}>
      <div className="w-full py-20 md:py-28">
        <div className="w-full flex justify-center mb-16">
          <div className="text-center max-w-3xl">
          <span
            className={`text-[10px] uppercase tracking-[0.3em] font-mono font-bold ${isDark ? 'text-[#ff8c00]' : 'text-[#2563eb]'
              }`}
          >
            La demo, in tempo reale
          </span>

          <h2 className={`mt-4 font-display text-3xl md:text-5xl font-black tracking-tight ${theme.textBold}`}>
            Carichi il file. Compaiono i numeri.
          </h2>

          <p className={`mt-6 ${theme.textMuted}`}>
            Niente configurazione, niente mappatura colonne. Il parser legge la sezione
            "Deals" del report MT5, ricostruisce le posizioni e calcola tutto da solo.
          </p>
          </div>
        </div>

        <DemoCycle theme={theme} isDark={isDark} cycleKey={cycleKey} />

        <div className="text-center mt-10">
          <span className={`text-[10px] uppercase tracking-widest font-mono ${theme.textFaint}`}>
            ↻ animazione in loop · dati di esempio
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 *  Feature grid
 * ------------------------------------------------------------------ */

function FeatureGrid({ theme, isDark }) {
  return (
    <section className={`w-full border-t ${theme.border}`}>
      <div className="w-full py-20 md:py-28">
        <div className="w-full flex justify-center mb-16">
          <div className="text-center max-w-3xl">
          <span
            className={`text-[10px] uppercase tracking-[0.3em] font-mono font-bold ${isDark ? 'text-[#ff8c00]' : 'text-[#2563eb]'
              }`}
          >
            Cosa trovi dentro
          </span>

          <h2 className={`mt-4 font-display text-3xl md:text-4xl font-black tracking-tight ${theme.textBold}`}>
            Sei strumenti, una sola schermata.
          </h2>
          </div>
        </div>

        <motion.div
          variants={stagger(0, 0.07)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((f) => {
            const FeatureIcon = f.Icon;

            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className={`${theme.card} border ${theme.border} rounded-lg p-6 transition-colors ${theme.cardHover}`}
              >
                <FeatureIcon className={`w-6 h-6 mb-4 ${isDark ? 'text-[#ff8c00]' : 'text-[#2563eb]'}`} />

                <h3 className={`font-display text-lg font-bold mb-2 ${theme.textBold}`}>
                  {f.title}
                </h3>

                <p className={`text-sm leading-relaxed ${theme.textMuted}`}>
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 *  Steps section
 * ------------------------------------------------------------------ */

function StepsSection({ theme, isDark }) {
  return (
    <section className={`w-full border-t ${theme.border}`}>
      <div className="w-full py-20 md:py-28">
        <div className="w-full flex justify-center mb-16">
          <div className="text-center max-w-3xl">
          <span
            className={`text-[10px] uppercase tracking-[0.3em] font-mono font-bold ${isDark ? 'text-[#ff8c00]' : 'text-[#2563eb]'
              }`}
          >
            In tre passi
          </span>

          <h2 className={`mt-4 font-display text-3xl md:text-4xl font-black tracking-tight ${theme.textBold}`}>
            Da export a insight in meno di un minuto.
          </h2>
          </div>
        </div>

        <motion.div
          variants={stagger(0, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {STEPS.map((s) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              className={`${theme.card} border ${theme.border} rounded-lg p-6 relative`}
            >
              <div
                className={`font-display text-5xl font-black mb-3 leading-none ${isDark ? 'text-[#ff8c00]' : 'text-[#2563eb]'
                  }`}
              >
                {s.n}
              </div>

              <h3 className={`font-display text-xl font-bold mb-2 ${theme.textBold}`}>
                {s.title}
              </h3>

              <p className={`text-sm leading-relaxed ${theme.textMuted}`}>
                {s.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 *  Final CTA
 * ------------------------------------------------------------------ */

function FinalCTA({ theme, isDark, onStart }) {
  return (
    <section className={`w-full border-t ${theme.border} relative overflow-hidden`}>
      <DotGridBg isDark={isDark} />

      <div className="w-full flex justify-center py-24 md:py-32 relative">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-4xl text-center"
        >
          <h2 className={`font-display text-3xl md:text-5xl font-black tracking-tight mb-5 ${theme.textBold}`}>
            Carica il primo report.
            <br />
            <span className={isDark ? 'text-[#ff8c00] glow-orange' : 'text-[#2563eb]'}>
              Vedi cosa nasconde.
            </span>
          </h2>

          <p className={`text-base md:text-lg mb-10 max-w-2xl mx-auto ${theme.textMuted}`}>
            Niente carta di credito. Inserisci la tua email per ricevere un OTP, e sei dentro.
          </p>

          <button
            onClick={onStart}
            className={`group inline-flex items-center gap-3 px-9 h-16 rounded font-bold uppercase tracking-widest font-mono text-base transition-all ${isDark
                ? 'bg-[#ff8c00] hover:bg-[#ff9f1c] text-black shadow-xl shadow-[#ff8c00]/40 hover:scale-[1.03]'
                : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xl shadow-[#2563eb]/40 hover:scale-[1.03]'
              }`}
          >
            Inizia ora
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
          </button>

          <div className={`mt-6 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono ${theme.textFaint}`}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Gratis
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Nessuna carta
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Privacy by default
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 *  Footer
 * ------------------------------------------------------------------ */

function Footer({ theme }) {
  return (
    <footer className={`w-full ${theme.navBg} border-t ${theme.navBorder}`}>
      <div className="w-full max-w-[1400px] mx-auto px-8 lg:px-16 xl:px-20 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.textFaint}`}>
          © 2026 SNIPERFOREX · I dati restano sul tuo browser
        </span>

        <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.textFaint}`}>
          Strumento educational · Non costituisce consulenza finanziaria
        </span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ *
 *  Page wrapper
 * ------------------------------------------------------------------ */

export default function Landing({ isDark, setIsDark, theme, onStart, marketQuotes = [] }) {
  const demoRef = useRef(null);

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className={`fixed inset-0 z-[15000] overflow-y-auto overflow-x-hidden ${theme.bg} ${theme.text}`}>
      <div className="sticky top-0 z-[100]">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1400px] px-8 lg:px-16 xl:px-20">
            <LandingTicker marketQuotes={marketQuotes} isDark={isDark} theme={theme} />
            <TopBar
              theme={theme}
              isDark={isDark}
              setIsDark={setIsDark}
              onStart={onStart}
            />
          </div>
        </div>
      </div>

      <main className="w-full flex justify-center">
        <div className="w-full max-w-[1400px] px-8 lg:px-16 xl:px-20">
          <Hero
            theme={theme}
            isDark={isDark}
            onStart={onStart}
            onScrollToDemo={scrollToDemo}
          />

          <DemoSection
            theme={theme}
            isDark={isDark}
            anchorRef={demoRef}
          />

          <FeatureGrid
            theme={theme}
            isDark={isDark}
          />

          <StepsSection
            theme={theme}
            isDark={isDark}
          />

          <FinalCTA
            theme={theme}
            isDark={isDark}
            onStart={onStart}
          />
        </div>
      </main>

      <Footer theme={theme} />
    </div>
  );
}

function LandingTicker({ marketQuotes, isDark, theme }) {
  const items = marketQuotes && marketQuotes.length > 0 ? marketQuotes : null;
  return (
    <div className={`w-full ${theme.navBg} border-b ${theme.navBorder}/60 overflow-hidden py-2 relative z-50 transition-colors`}>
      <div className="w-full">
        {items ? (
          <div className="animate-marquee whitespace-nowrap flex items-center gap-12 font-mono text-xs">
            {[...items, ...items].map((q, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <span className={isDark ? 'text-[#555555]' : 'text-[#6b7280]'}>{q.name}</span>
                <span className={isDark ? 'text-[#e0e0e0] font-bold' : 'text-[#111827] font-bold'}>{q.price?.toFixed(2)}</span>
                <span className={q.change >= 0 ? 'text-[#00e676] glow-green' : 'text-[#ff1744] glow-red'}>
                  {q.change >= 0 ? '+' : ''}{Math.abs(q.changePercent || 0).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#ff8c00]' : 'bg-[#2563eb]'} pulse-live`} />
              <span className={`tracking-widest ${theme.navText}`}>CONNECTING TO MARKET DATA...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}