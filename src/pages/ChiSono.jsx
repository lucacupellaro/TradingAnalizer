import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Target,
  Briefcase,
  Code2,
  Cpu,
  Shield,
  Database,
  Network,
  LineChart,
  FlaskConical,
  BrainCircuit,
  BarChart3,
  TrendingUp,
  Github,
  Instagram,
  Linkedin,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

const skills = [
  {
    icon: Code2,
    title: 'Software Development',
    subtitle: 'Python, C, Java, Go',
    items: ['Sviluppo applicazioni desktop e strumenti di analisi'],
  },
  {
    icon: Cpu,
    title: 'High Performance Computing',
    subtitle: 'CUDA, OpenMP',
    items: ['Implementazione di algoritmi paralleli, come moltiplicazione matrice-vettore'],
  },
  {
    icon: Shield,
    title: 'Reverse Engineering & Cybersecurity',
    subtitle: 'Reverse Engineering',
    items: ['Analisi malware tramite tecniche di reverse engineering'],
  },
  {
    icon: Database,
    title: 'Database & Backend',
    subtitle: 'SQL, MySQL',
    items: ['Progetto di gestione sistemi di trasporto ferroviario'],
  },
  {
    icon: Network,
    title: 'Distributed Systems',
    subtitle: 'gRPC, Docker',
    items: ['Simulazione DHT basata su protocollo Kademlia'],
  },
  {
    icon: LineChart,
    title: 'Time Series & Performance Modeling',
    subtitle: 'Modeling & Analysis',
    items: ['Analisi di sistemi e reti, modellazione delle performance'],
  },
  {
    icon: FlaskConical,
    title: 'Software Testing',
    subtitle: 'JUnit, JaCoCo, EvoSuite, Randoop, Mutation Testing',
    items: ['Testing automatico e validazione della qualità del software'],
  },
  {
    icon: BrainCircuit,
    title: 'Machine Learning & Finanza',
    subtitle: 'Sklearn, TensorFlow, Keras',
    items: ['Predizione prezzi', 'Modelli di volatilità con GARCH e LSTM'],
  },
  {
    icon: BarChart3,
    title: 'Statistica',
    subtitle: 'Statistical Methods',
    items: ['Regressione lineare, ANOVA e metodologie statistiche avanzate'],
  },
  {
    icon: TrendingUp,
    title: 'Trading Analyzer',
    subtitle: 'React Web App',
    items: [
      'Web app per l’analisi quantitativa dei portafogli di trading',
      'Elaborazione dati storici e visualizzazione avanzata delle performance',
    ],
  },
];

const links = [
  {
    href: 'https://github.com/lucacupellaro',
    label: 'GitHub',
    icon: Github,
    desc: 'Codice, progetti e sviluppo',
  },
  {
    href: 'https://www.linkedin.com/in/luca-cupellaro-51791a196',
    label: 'LinkedIn',
    icon: Linkedin,
    desc: 'Profilo professionale e networking',
  },
  {
    href: 'https://www.instagram.com/lucacupellaro_/',
    label: 'Instagram',
    icon: Instagram,
    desc: 'Aggiornamenti, contenuti e attività',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardAnim = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

export default function ChiSono({ theme }) {
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
            className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-[#ff8c00] blur-3xl"
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
              <User className="w-6 h-6 text-[#ff8c00]" />
            </motion.div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-[#ff8c00] font-bold">
                About / Profile
              </div>
              <h1 className={`text-3xl lg:text-4xl font-black ${theme.textBold} tracking-tight`}>
                Chi sono
              </h1>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="max-w-4xl space-y-5">
            <p className={`${theme.text} text-base lg:text-lg leading-8`}>
              Mi chiamo <span className="font-bold text-[#ff8c00]">Luca</span> e sono un{' '}
              <span className="font-semibold">Software Engineer</span> con background in Ingegneria
              Informatica e una forte passione per i mercati finanziari e il trading quantitativo.
            </p>

            <p className={`${theme.textMuted} text-sm lg:text-base leading-8`}>
              Negli ultimi anni ho lavorato sia sul lato tecnico — sviluppo software, data analysis e
              automazione — sia sul lato trading, occupandomi di strategie, backtesting e analisi delle
              performance. Il mio approccio è orientato a unire{' '}
              <span className="text-[#e2e8f0] font-semibold">rigore matematico</span> e{' '}
              <span className="text-[#e2e8f0] font-semibold">applicazione pratica</span>.
            </p>

            <motion.div
              variants={stagger}
              className="flex flex-wrap gap-3 pt-3"
            >
              {[
                'Software Engineering',
                'Quantitative Trading',
                'Data Analysis',
                'ML & Statistics',
              ].map((tag) => (
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

      {/* SKILLS */}
      <motion.section
        variants={fadeUp}
        className={`${theme.panel} rounded-2xl border ${theme.border} p-8 lg:p-10 shadow-xl`}
      >
        <div className="flex items-center gap-3 mb-8">
          <motion.div
            className="p-2.5 rounded-xl bg-[#ff8c00]/10 border border-[#ff8c00]/20"
            whileHover={{ scale: 1.06 }}
          >
            <Briefcase className="w-5 h-5 text-[#ff8c00]" />
          </motion.div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#ff8c00] font-bold">
              Experience
            </div>
            <h2 className={`text-2xl font-black ${theme.textBold}`}>Competenze e progetti</h2>
          </div>
        </div>

        <motion.div
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6"
        >
          {skills.map((skill, idx) => {
            const Icon = skill.icon;
            return (
              <motion.div
                key={idx}
                variants={cardAnim}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className={`${theme.card} border ${theme.borderLight} rounded-2xl p-5 lg:p-6 transition-all`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-[#ff8c00]/10 border border-[#ff8c00]/20 shrink-0">
                    <Icon className="w-4 h-4 text-[#ff8c00]" />
                  </div>

                  <div>
                    <h3 className={`font-bold ${theme.textBold} text-base leading-6`}>
                      {skill.title}
                    </h3>
                    <p className={`${theme.textMuted} text-xs mt-1 leading-5`}>
                      {skill.subtitle}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5">
                  {skill.items.map((item, i) => (
                    <li key={i} className={`${theme.textMuted} text-sm leading-6`}>
                      • {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* GOALS */}
      <motion.section
        variants={fadeUp}
        className={`${theme.panel} rounded-2xl border ${theme.border} p-8 lg:p-10 shadow-xl`}
      >
        <div className="flex items-center gap-3 mb-8">
          <motion.div
            className="p-2.5 rounded-xl bg-[#ff8c00]/10 border border-[#ff8c00]/20"
            whileHover={{ scale: 1.06 }}
          >
            <Target className="w-5 h-5 text-[#ff8c00]" />
          </motion.div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#ff8c00] font-bold">
              Vision
            </div>
            <h2 className={`text-2xl font-black ${theme.textBold}`}>I miei obiettivi</h2>
          </div>
        </div>

        <motion.div variants={stagger} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[
            {
              title: 'Quant Research',
              text: 'Diventare un Quantitative Researcher, lavorando su modelli avanzati per i mercati finanziari e sulla costruzione di strategie basate sui dati.',
            },
            {
              title: 'Framework operativi',
              text: 'Sviluppare framework operativi per l’analisi dei dati applicati al trading, scalabili, riutilizzabili e capaci di trasformare i dati in supporto decisionale reale.',
            },
            {
              title: 'Accessibilità',
              text: 'Rendere questi strumenti il più accessibili possibile, semplificando concetti complessi e portandoli anche a chi non ha un background tecnico avanzato.',
            },
          ].map((goal) => (
            <motion.div
              key={goal.title}
              variants={cardAnim}
              whileHover={{ y: -4 }}
              className={`${theme.card} border ${theme.borderLight} rounded-2xl p-6`}
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-4 h-4 text-[#ff8c00]" />
                <h3 className={`font-bold ${theme.textBold}`}>{goal.title}</h3>
              </div>
              <p className={`${theme.textMuted} text-sm leading-7`}>
                {goal.text}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-8 pt-6 border-t border-[#1f2937]"
        >
          <p className={`${theme.textMuted} text-sm lg:text-base leading-7`}>
            Credo fortemente che il valore stia nel trasformare la complessità in
            <span className="text-[#ff8c00] font-semibold"> strumenti concreti, utili e utilizzabili</span>.
          </p>
        </motion.div>
      </motion.section>

      {/* WHAT I DO */}
      <motion.section
        variants={fadeUp}
        className={`${theme.panel} rounded-2xl border ${theme.border} p-8 lg:p-10 shadow-xl`}
      >
        <div className="flex items-center gap-3 mb-8">
          <motion.div
            className="p-2.5 rounded-xl bg-[#ff8c00]/10 border border-[#ff8c00]/20"
            whileHover={{ scale: 1.06 }}
          >
            <TrendingUp className="w-5 h-5 text-[#ff8c00]" />
          </motion.div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#ff8c00] font-bold">
              Focus
            </div>
            <h2 className={`text-2xl font-black ${theme.textBold}`}>Cosa faccio</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <motion.div variants={stagger} className="space-y-4">
            {[
              'Sviluppo strumenti per l’analisi dei dati di trading',
              'Progetto e testo strategie, sia manuali che automatiche',
              'Applico tecniche di data analysis ai mercati finanziari',
              'Studio modelli quantitativi per migliorare la robustezza delle strategie',
            ].map((item) => (
              <motion.div
                key={item}
                variants={cardAnim}
                whileHover={{ x: 4 }}
                className={`${theme.card} border ${theme.borderLight} rounded-2xl p-5`}
              >
                <p className={`${theme.text} text-sm lg:text-base leading-7`}>• {item}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={cardAnim}
            whileHover={{ y: -3, scale: 1.01 }}
            className="h-full"
          >
            <div className="rounded-2xl border border-[#ff8c00]/20 bg-[#ff8c00]/5 p-6 lg:p-8 h-full">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#ff8c00] font-bold mb-3">
                Mission
              </div>
              <p className={`${theme.text} text-base lg:text-lg leading-8`}>
                Il mio obiettivo è trasformare il trading da qualcosa di intuitivo a qualcosa di
                <span className="text-[#ff8c00] font-semibold"> misurabile, analizzabile e migliorabile nel tempo</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* LINKS */}
      <motion.section
        variants={fadeUp}
        className={`${theme.panel} rounded-2xl border ${theme.border} p-8 lg:p-10 shadow-xl`}
      >
        <div className="flex items-center gap-3 mb-8">
          <motion.div
            className="p-2.5 rounded-xl bg-[#ff8c00]/10 border border-[#ff8c00]/20"
            whileHover={{ scale: 1.06 }}
          >
            <ArrowUpRight className="w-5 h-5 text-[#ff8c00]" />
          </motion.div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#ff8c00] font-bold">
              Links
            </div>
            <h2 className={`text-2xl font-black ${theme.textBold}`}>Link utili</h2>
          </div>
        </div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {links.map((link, idx) => {
            const Icon = link.icon;
            return (
              <motion.a
                key={idx}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                variants={cardAnim}
                whileHover={{ y: -4, scale: 1.01 }}
                className={`${theme.card} border ${theme.borderLight} rounded-2xl p-5 hover:border-[#ff8c00]/30 transition-all group`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-[#ff8c00]/10 border border-[#ff8c00]/20">
                      <Icon className="w-4 h-4 text-[#ff8c00]" />
                    </div>
                    <div>
                      <h3 className={`font-bold ${theme.textBold} text-base group-hover:text-[#ff8c00] transition-colors`}>
                        {link.label}
                      </h3>
                      <p className={`${theme.textMuted} text-sm mt-1 leading-6`}>
                        {link.desc}
                      </p>
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ x: 2, y: -2 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-[#4a5568] group-hover:text-[#ff8c00] transition-colors shrink-0" />
                  </motion.div>
                </div>
              </motion.a>
            );
          })}
        </motion.div>
      </motion.section>
    </motion.div>
  );
}