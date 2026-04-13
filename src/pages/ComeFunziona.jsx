import { motion } from 'framer-motion';
import {
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  LineChart,
  PieChart,
  Target,
  Shield,
  Zap,
  FileSpreadsheet,
  MousePointerClick,
  Filter,
  Trophy,
  Activity,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Clock,
  DollarSign,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const steps = [
  {
    icon: FileSpreadsheet,
    title: '1. Esporta il Report',
    desc: 'Da MetaTrader 5, esporta lo storico delle operazioni in formato .xlsx, .xls, .html o .csv.',
    color: '#ff8c00',
  },
  {
    icon: Upload,
    title: '2. Importa il File',
    desc: 'Clicca su "Import Report MT5" e carica il file. Puoi selezionare il range di righe da analizzare.',
    color: '#00e676',
  },
  {
    icon: MousePointerClick,
    title: '3. Analizza',
    desc: 'Il sistema elabora automaticamente tutti i trade, calcola le statistiche e genera grafici interattivi.',
    color: '#64b5f6',
  },
  {
    icon: Filter,
    title: '4. Esplora i Dati',
    desc: 'Filtra per asset o strategia, cambia periodo temporale nella classifica, e naviga tra le sezioni.',
    color: '#ce93d8',
  },
];

const features = [
  {
    icon: BarChart3,
    title: 'KPI Card Intelligenti',
    items: [
      'Oltre 25 metriche calcolate automaticamente',
      'Bordo verde/rosso per capire subito quali metriche vanno bene e quali no',
      'Tooltip con la formula matematica usata per ogni calcolo',
      'Simbolo euro per tutti i valori monetari',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Equity Line & EMA',
    items: [
      'Grafico equity cumulativa trade per trade',
      'Media Mobile Esponenziale a 50 e 100 periodi (attivabili/disattivabili)',
      'Visualizzazione step-after per precisione',
    ],
  },
  {
    icon: TrendingDown,
    title: 'Drawdown Analysis',
    items: [
      'Grafico drawdown in tempo reale',
      'Max Drawdown assoluto e Ulcer Index (% drawdown RMS)',
      'Tooltip con max 3 decimali',
    ],
  },
  {
    icon: DollarSign,
    title: 'PnL Settimanale & Mensile',
    items: [
      'Istogrammi affiancati: profitto per settimana e per mese',
      'Barre verdi (profitto) e rosse (perdita)',
      'Avg settimanale e mensile nelle KPI Card',
    ],
  },
  {
    icon: PieChart,
    title: 'Distribuzioni Statistiche',
    items: [
      'Distribuzione totale, solo win e solo loss su una riga',
      'Linea MEDIA evidenziata in giallo oro',
      'Cullen & Frey Plot per confronto con distribuzioni teoriche',
    ],
  },
  {
    icon: Activity,
    title: 'Day Stats & Box Plot',
    items: [
      'PnL medio per giorno della settimana',
      'Box Plot con Min, Q1, Mediana, Q3, Max',
      'Identifica i giorni migliori e peggiori per il tuo trading',
    ],
  },
  {
    icon: Trophy,
    title: 'Classifica Performance',
    items: [
      'Ranking dei migliori asset e migliori strategie',
      'Filtro temporale: Settimana, Mese, Trimestre, Anno, Max',
      'PnL, Win Rate e Sharpe Ratio annualizzato per ogni voce',
      'Podio oro/argento/bronzo per i top 3',
    ],
  },
  {
    icon: LineChart,
    title: 'Monte Carlo Simulation',
    items: [
      'Fino a 50 percorsi simulati con bootstrap',
      'Probabilita di profitto e equity media finale',
      'Tooltip che mostra solo la linea selezionata',
    ],
  },
  {
    icon: Shield,
    title: 'Risk Metrics Avanzate',
    items: [
      'Sharpe Ratio e Sortino Ratio annualizzati',
      'Market Beta e Correlazione con S&P500',
      'Test di normalita: Jarque-Bera e Anderson-Darling',
    ],
  },
  {
    icon: Layers,
    title: 'Breakdown per Asset & Strategia',
    items: [
      'Ogni asset e strategia ha la sua sezione completa',
      'Stesse metriche, grafici e distribuzioni del globale',
      'Heatmap di correlazione tra tutte le entita',
    ],
  },
];

const metrics = [
  { name: 'Net Profit', desc: 'Profitto netto totale post costi', formula: 'Net = Sigma(Profit + Swap + Comm + Fee)' },
  { name: 'Profit Factor', desc: 'Rapporto vincite/perdite', formula: 'PF = GrossProfit / |GrossLoss|' },
  { name: 'Win Rate', desc: 'Percentuale di trade vincenti', formula: 'WR = (W / N) x 100' },
  { name: 'Sharpe Ratio', desc: 'Rendimento risk-adjusted annualizzato', formula: 'SR = (mu / sigma) x sqrt(N/anno)' },
  { name: 'Sortino Ratio', desc: 'Come Sharpe ma penalizza solo il downside', formula: 'So = (mu / sigma_down) x sqrt(N/anno)' },
  { name: 'Max Drawdown', desc: 'Peggior flessione dalla peak equity', formula: 'MDD = max(Peak_i - Equity_i)' },
  { name: 'Ulcer Index', desc: 'Indice di stress basato su % drawdown', formula: 'UI = sqrt(Sigma DD%^2 / N)' },
  { name: 'Market Beta', desc: 'Sensibilita al mercato (S&P500)', formula: 'Beta = Cov(Rp, Rm) / Var(Rm)' },
];

export default function ComeFunziona({ theme }) {
  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      {/* HERO */}
      <motion.section
        variants={fadeUp}
        className={`${theme.panel} rounded-2xl border ${theme.border} p-8 lg:p-12 shadow-2xl relative overflow-hidden`}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          animate={{ opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#ff8c00] blur-3xl"
            animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-[#00e676] blur-3xl"
            animate={{ x: [0, -14, 0], y: [0, 12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <div className="relative z-10">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
            <motion.div
              className="p-3 rounded-2xl bg-[#ff8c00]/10 border border-[#ff8c00]/20"
              whileHover={{ scale: 1.06, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <Zap className="w-6 h-6 text-[#ff8c00]" />
            </motion.div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-[#ff8c00] font-bold">
                Guida Completa
              </div>
              <h1 className={`text-3xl lg:text-4xl font-black ${theme.textBold} tracking-tight`}>
                Come Funziona
              </h1>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="max-w-4xl space-y-5">
            <p className={`${theme.text} text-base lg:text-lg leading-8`}>
              <span className="font-bold text-[#ff8c00]">SniperForex Terminal</span> e il tuo terminale di analisi quantitativa
              per il trading. Importa il report di MetaTrader 5 e ottieni{' '}
              <span className="font-semibold text-[#e2e8f0]">statistiche avanzate, grafici interattivi, simulazioni Monte Carlo
              e classifiche di performance</span> — tutto in un'unica interfaccia.
            </p>
            <p className={`${theme.textMuted} text-sm lg:text-base leading-8`}>
              Progettato per trader che vogliono andare oltre il semplice PnL e capire davvero
              la qualita delle proprie strategie con metriche professionali.
            </p>

            <motion.div variants={stagger} className="flex flex-wrap gap-3 pt-3">
              {['Analisi Quantitativa', 'Risk Management', 'Monte Carlo', 'Performance Ranking'].map((tag) => (
                <motion.span
                  key={tag}
                  variants={cardAnim}
                  whileHover={{ y: -2, scale: 1.03 }}
                  className="px-3 py-2 rounded-full text-xs font-bold bg-[#ff8c00]/10 text-[#ff8c00] border border-[#ff8c00]/20"
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* APP PREVIEW / VISUAL */}
      <motion.section
        variants={fadeUp}
        className={`${theme.panel} rounded-2xl border ${theme.border} p-8 lg:p-10 shadow-xl`}
      >
        <div className="flex items-center gap-3 mb-8">
          <motion.div className="p-2.5 rounded-xl bg-[#ff8c00]/10 border border-[#ff8c00]/20" whileHover={{ scale: 1.06 }}>
            <Sparkles className="w-5 h-5 text-[#ff8c00]" />
          </motion.div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#ff8c00] font-bold">Preview</div>
            <h2 className={`text-2xl font-black ${theme.textBold}`}>Cosa vedrai</h2>
          </div>
        </div>

        {/* Simulated terminal preview */}
        <motion.div
          variants={cardAnim}
          className="rounded-xl border border-[#1a2332] bg-[#060a10] p-1 shadow-2xl"
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1a2332]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff1744]/60" />
              <div className="w-3 h-3 rounded-full bg-[#ffd740]/60" />
              <div className="w-3 h-3 rounded-full bg-[#00e676]/60" />
            </div>
            <span className="text-[10px] font-mono text-[#4a5568] ml-3">SniperForex Terminal v2.0</span>
          </div>

          {/* Simulated dashboard */}
          <div className="p-6 space-y-4">
            {/* KPI Row */}
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { label: 'Net Profit', value: '+€1,247.50', color: '#00e676', border: 'border-[#00e676]/30' },
                { label: 'Win Rate', value: '62.4%', color: '#00e676', border: 'border-[#00e676]/30' },
                { label: 'Sharpe', value: '1.85', color: '#00e676', border: 'border-[#00e676]/30' },
                { label: 'Max DD', value: '€312.40', color: '#ff1744', border: 'border-[#ff1744]/30' },
                { label: 'Profit Factor', value: '1.73', color: '#00e676', border: 'border-[#00e676]/30' },
                { label: 'Trades', value: '156', color: '#e2e8f0', border: 'border-[#1a2332]' },
                { label: 'Avg Weekly', value: '+€48.20', color: '#00e676', border: 'border-[#00e676]/30' },
                { label: 'Ulcer Idx', value: '3.21', color: '#00e676', border: 'border-[#00e676]/30' },
              ].map((kpi) => (
                <motion.div
                  key={kpi.label}
                  whileHover={{ scale: 1.04, y: -2 }}
                  className={`rounded-lg border ${kpi.border} bg-[#0a0f18] p-2.5 text-center`}
                >
                  <div className="text-[8px] text-[#4a5568] uppercase tracking-wider font-mono">{kpi.label}</div>
                  <div className="text-[11px] font-bold font-mono mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Simulated Charts Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f18] p-3 h-28">
                <div className="text-[8px] text-[#00e676] uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Equity Line
                </div>
                <div className="flex items-end gap-[2px] h-16">
                  {[20,25,22,30,28,35,33,40,38,45,42,50,48,55,52,58,56,62,60,65].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#00e676]/30 rounded-t-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f18] p-3 h-28">
                <div className="text-[8px] text-[#ff1744] uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Drawdown
                </div>
                <div className="flex items-start gap-[2px] h-16">
                  {[5,8,3,12,6,15,10,20,8,25,12,18,6,22,10,15,5,12,3,8].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#ff1744]/25 rounded-b-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated ranking row */}
            <div className="rounded-lg border border-[#1a2332] bg-[#0a0f18] p-3">
              <div className="text-[8px] text-[#ffd740] uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Classifica Performance
              </div>
              <div className="space-y-1">
                {[
                  { rank: '#1', name: 'EURUSD', pnl: '+€580.20', sr: '2.14', bg: 'bg-[#ffd740]/10' },
                  { rank: '#2', name: 'GBPUSD', pnl: '+€340.10', sr: '1.65', bg: 'bg-[#c0c0c0]/5' },
                  { rank: '#3', name: 'XAUUSD', pnl: '+€210.80', sr: '1.22', bg: 'bg-[#cd7f32]/5' },
                ].map((r) => (
                  <div key={r.name} className={`flex items-center justify-between px-2 py-1.5 rounded ${r.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black font-mono text-[#ffd740]">{r.rank}</span>
                      <span className="text-[9px] font-bold font-mono text-[#e2e8f0]">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-mono text-[#4a5568]">SR {r.sr}</span>
                      <span className="text-[9px] font-bold font-mono text-[#00e676]">{r.pnl}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* COME INIZIARE - STEPS */}
      <motion.section
        variants={fadeUp}
        className={`${theme.panel} rounded-2xl border ${theme.border} p-8 lg:p-10 shadow-xl`}
      >
        <div className="flex items-center gap-3 mb-8">
          <motion.div className="p-2.5 rounded-xl bg-[#00e676]/10 border border-[#00e676]/20" whileHover={{ scale: 1.06 }}>
            <Target className="w-5 h-5 text-[#00e676]" />
          </motion.div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#00e676] font-bold">Quick Start</div>
            <h2 className={`text-2xl font-black ${theme.textBold}`}>Come Iniziare</h2>
          </div>
        </div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                variants={cardAnim}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className={`${theme.card} border ${theme.borderLight} rounded-2xl p-6 relative`}
              >
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight className="w-5 h-5 text-[#4a5568]" />
                  </div>
                )}
                <div className="p-3 rounded-xl border mb-4 inline-block" style={{ backgroundColor: `${step.color}10`, borderColor: `${step.color}30` }}>
                  <Icon className="w-5 h-5" style={{ color: step.color }} />
                </div>
                <h3 className={`font-bold ${theme.textBold} text-base mb-2`}>{step.title}</h3>
                <p className={`${theme.textMuted} text-sm leading-7`}>{step.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6 p-4 rounded-xl bg-[#ff8c00]/5 border border-[#ff8c00]/15">
          <p className={`${theme.textMuted} text-sm leading-7`}>
            <span className="text-[#ff8c00] font-bold">Formati supportati:</span> .xlsx, .xls, .html, .csv — esportati direttamente da MetaTrader 5.
            L'app riconosce automaticamente le colonne e calcola tutto il resto.
          </p>
        </motion.div>
      </motion.section>

      {/* FUNZIONALITA */}
      <motion.section
        variants={fadeUp}
        className={`${theme.panel} rounded-2xl border ${theme.border} p-8 lg:p-10 shadow-xl`}
      >
        <div className="flex items-center gap-3 mb-8">
          <motion.div className="p-2.5 rounded-xl bg-[#64b5f6]/10 border border-[#64b5f6]/20" whileHover={{ scale: 1.06 }}>
            <Layers className="w-5 h-5 text-[#64b5f6]" />
          </motion.div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#64b5f6] font-bold">Features</div>
            <h2 className={`text-2xl font-black ${theme.textBold}`}>Tutte le Funzionalita</h2>
          </div>
        </div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                variants={cardAnim}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className={`${theme.card} border ${theme.borderLight} rounded-2xl p-5 lg:p-6`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-[#ff8c00]/10 border border-[#ff8c00]/20 shrink-0">
                    <Icon className="w-4 h-4 text-[#ff8c00]" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${theme.textBold} text-base leading-6`}>{feat.title}</h3>
                  </div>
                </div>
                <ul className="space-y-2">
                  {feat.items.map((item, i) => (
                    <li key={i} className={`${theme.textMuted} text-sm leading-6 flex items-start gap-2`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00e676] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* METRICHE PRINCIPALI */}
      <motion.section
        variants={fadeUp}
        className={`${theme.panel} rounded-2xl border ${theme.border} p-8 lg:p-10 shadow-xl`}
      >
        <div className="flex items-center gap-3 mb-8">
          <motion.div className="p-2.5 rounded-xl bg-[#ce93d8]/10 border border-[#ce93d8]/20" whileHover={{ scale: 1.06 }}>
            <BarChart3 className="w-5 h-5 text-[#ce93d8]" />
          </motion.div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#ce93d8] font-bold">Metrics</div>
            <h2 className={`text-2xl font-black ${theme.textBold}`}>Metriche Principali</h2>
          </div>
        </div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metrics.map((m, idx) => (
            <motion.div
              key={idx}
              variants={cardAnim}
              whileHover={{ x: 4 }}
              className={`${theme.card} border ${theme.borderLight} rounded-xl p-4 flex items-start gap-4`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#ff8c00]/10 border border-[#ff8c00]/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-[#ff8c00] font-mono">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold ${theme.textBold} text-sm`}>{m.name}</h4>
                <p className={`${theme.textMuted} text-xs mt-0.5 leading-5`}>{m.desc}</p>
                <code className="text-[10px] font-mono text-[#ff8c00]/70 mt-1 block">{m.formula}</code>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* TIPS */}
      <motion.section
        variants={fadeUp}
        className={`${theme.panel} rounded-2xl border ${theme.border} p-8 lg:p-10 shadow-xl`}
      >
        <div className="flex items-center gap-3 mb-8">
          <motion.div className="p-2.5 rounded-xl bg-[#ffd740]/10 border border-[#ffd740]/20" whileHover={{ scale: 1.06 }}>
            <Sparkles className="w-5 h-5 text-[#ffd740]" />
          </motion.div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#ffd740] font-bold">Pro Tips</div>
            <h2 className={`text-2xl font-black ${theme.textBold}`}>Consigli per l'Uso</h2>
          </div>
        </div>

        <motion.div variants={stagger} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Clock,
              title: 'Usa i Filtri Temporali',
              desc: 'Nella classifica performance, cambia il periodo per vedere come cambiano i ranking. Un asset buono sul lungo potrebbe essere in difficolta recentemente.',
              color: '#64b5f6',
            },
            {
              icon: Target,
              title: 'Leggi i Bordi Colorati',
              desc: 'Bordo verde = metrica sopra la media/soglia. Bordo rosso = sotto. Cosi identifichi subito le aree di miglioramento senza leggere ogni numero.',
              color: '#00e676',
            },
            {
              icon: Shield,
              title: 'Sharpe > 1 e il Target',
              desc: 'Uno Sharpe Ratio annualizzato sopra 1 indica un buon rendimento rispetto al rischio. Sopra 2 e eccellente. Sotto 0 significa che stai perdendo.',
              color: '#ff8c00',
            },
          ].map((tip) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={tip.title}
                variants={cardAnim}
                whileHover={{ y: -4 }}
                className={`${theme.card} border ${theme.borderLight} rounded-2xl p-6`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg border" style={{ backgroundColor: `${tip.color}10`, borderColor: `${tip.color}30` }}>
                    <Icon className="w-4 h-4" style={{ color: tip.color }} />
                  </div>
                  <h3 className={`font-bold ${theme.textBold} text-sm`}>{tip.title}</h3>
                </div>
                <p className={`${theme.textMuted} text-sm leading-7`}>{tip.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* FOOTER CTA */}
      <motion.section
        variants={fadeUp}
        className="rounded-2xl border border-[#ff8c00]/20 bg-[#ff8c00]/5 p-8 lg:p-10 text-center"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Zap className="w-8 h-8 text-[#ff8c00] mx-auto mb-4" />
          <h3 className={`text-xl font-black ${theme.textBold} mb-3`}>Pronto per Analizzare?</h3>
          <p className={`${theme.textMuted} text-sm max-w-lg mx-auto leading-7`}>
            Torna all'<span className="text-[#ff8c00] font-bold">Analyzer</span>, importa il tuo report e scopri
            ogni dettaglio delle tue performance di trading.
          </p>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
