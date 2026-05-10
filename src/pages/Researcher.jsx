import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, RefreshCw, Search, ExternalLink, Calendar, Users, Tag,
  Briefcase, Shield, Activity, BarChart3, Cpu, DollarSign, Landmark, Globe, Sigma,
  ArrowUpRight, FileText, X, AlertCircle,
} from 'lucide-react';

// =====================================================================
// arXiv categories (q-fin) — all finance-related sub-fields
// =====================================================================
const RESEARCH_CATEGORIES = [
  { id: 'q-fin.PM', label: 'Portfolio Management',     short: 'Portfolio',     icon: Briefcase,    color: '#ff8c00',
    desc: 'Costruzione portafoglio, asset allocation, ottimizzazione media-varianza, risk parity.' },
  { id: 'q-fin.RM', label: 'Risk Management',          short: 'Rischio',       icon: Shield,       color: '#ff1744',
    desc: 'VaR, ES, stress test, hedging, gestione rischio operativo e di credito.' },
  { id: 'q-fin.TR', label: 'Trading & Microstructure', short: 'Trading',       icon: Activity,     color: '#00e676',
    desc: 'Strategie di trading, market making, esecuzione ottimale, microstruttura mercati.' },
  { id: 'q-fin.ST', label: 'Statistical Finance',      short: 'Statistica',    icon: BarChart3,    color: '#64b5f6',
    desc: 'Modelli statistici, analisi serie storiche, machine learning per finanza.' },
  { id: 'q-fin.MF', label: 'Mathematical Finance',     short: 'Matematica',    icon: Sigma,        color: '#a78bfa',
    desc: 'Calcolo stocastico, modelli derivati, processi Lévy, equazioni differenziali.' },
  { id: 'q-fin.CP', label: 'Computational Finance',    short: 'Computazionale',icon: Cpu,          color: '#26c6da',
    desc: 'Algoritmi numerici, Monte Carlo, simulazioni HFT, neural nets.' },
  { id: 'q-fin.PR', label: 'Pricing of Securities',    short: 'Pricing',       icon: DollarSign,   color: '#ffa726',
    desc: 'Pricing opzioni, derivati esotici, structured products, calibrazione modelli.' },
  { id: 'q-fin.EC', label: 'Economics',                short: 'Economia',      icon: Landmark,     color: '#ec407a',
    desc: 'Teoria economica, equilibri di mercato, behavioral finance.' },
  { id: 'q-fin.GN', label: 'General Finance',          short: 'Generale',      icon: Globe,        color: '#9ccc65',
    desc: 'Topics finanziari generali, regolamentazione, filosofia di investimento.' },
];

// =====================================================================
// Sources — academic + central banks publishing research
// =====================================================================
const SOURCES = {
  arxiv: {
    id: 'arxiv',
    label: 'arXiv',
    short: 'arXiv',
    color: '#b31b1b',
    homepage: 'https://arxiv.org/list/q-fin/recent',
    desc: 'Cornell open-access archive · q-fin section · paper accademici peer-reviewable.',
    hasCategories: true,
  },
  nber: {
    id: 'nber',
    label: 'NBER · National Bureau of Economic Research',
    short: 'NBER',
    color: '#1a3a6c',
    homepage: 'https://www.nber.org/papers',
    feedUrl: 'https://www.nber.org/rss/new.xml',
    desc: 'Working papers degli economisti accademici USA · macroeconomia, asset pricing, behavioral finance.',
    hasCategories: false,
  },
  fed: {
    id: 'fed',
    label: 'Federal Reserve · FEDS Working Papers',
    short: 'Fed',
    color: '#0a5d3a',
    homepage: 'https://www.federalreserve.gov/econres/feds/index.htm',
    feedUrl: 'https://www.federalreserve.gov/feeds/feds.xml',
    desc: 'Finance and Economics Discussion Series del Federal Reserve Board · politica monetaria, mercati finanziari.',
    hasCategories: false,
  },
  ifdp: {
    id: 'ifdp',
    label: 'Federal Reserve · IFDP International Finance',
    short: 'Fed Int\'l',
    color: '#0a8d5a',
    homepage: 'https://www.federalreserve.gov/econres/ifdp/index.htm',
    feedUrl: 'https://www.federalreserve.gov/feeds/ifdp.xml',
    desc: 'International Finance Discussion Papers · capitale internazionale, FX, EM economies.',
    hasCategories: false,
  },
  bis: {
    id: 'bis',
    label: 'BIS · Bank for International Settlements',
    short: 'BIS',
    color: '#7d1d3f',
    homepage: 'https://www.bis.org/list/wpapers/index.htm',
    feedUrl: 'https://www.bis.org/list/wpapers/index.rss',
    desc: 'Working Papers BIS · stabilità finanziaria globale, banche centrali, regolamentazione macroprudenziale.',
    hasCategories: false,
  },
  ssrn: {
    id: 'ssrn',
    label: 'SSRN · Social Science Research Network',
    short: 'SSRN',
    color: '#5d3a1a',
    homepage: 'https://papers.ssrn.com/sol3/JELJOUR_Results.cfm?form_name=journalBrowse&journal_id=203513',
    desc: 'Largest finance pre-print archive · NON disponibile direttamente per restrizioni Cloudflare/CORS · usa il link esterno.',
    hasCategories: false,
    externalOnly: true,
  },
};

// =====================================================================
// Universal fetcher with CORS proxy fallback chain
// =====================================================================
const PROXIES = [
  (url) => url, // direct first
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const fetchWithProxies = async (targetUrl, validate) => {
  let text = null, lastErr = null;
  for (const makeUrl of PROXIES) {
    try {
      const res = await fetch(makeUrl(targetUrl));
      if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
      const t = await res.text();
      if (t && (validate ? validate(t) : true)) { text = t; break; }
    } catch (e) {
      lastErr = e.message;
      continue;
    }
  }
  if (!text) throw new Error(lastErr || 'Tutti i proxy hanno fallito');
  return text;
};

// Strip HTML tags from RSS description fields
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
};

// Parse arXiv Atom XML
const parseArxiv = (text) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  const entries = Array.from(doc.getElementsByTagName('entry'));
  return entries.map((e) => {
    const get = (tag) => e.getElementsByTagName(tag)[0]?.textContent?.trim() || '';
    const id = get('id');
    const arxivId = id.split('/abs/')[1] || id.split('/').pop();
    const links = Array.from(e.getElementsByTagName('link'));
    const pdfLink = links.find(l => l.getAttribute('title') === 'pdf')?.getAttribute('href') || `https://arxiv.org/pdf/${arxivId}`;
    const authors = Array.from(e.getElementsByTagName('author'))
      .map(a => a.getElementsByTagName('name')[0]?.textContent?.trim()).filter(Boolean);
    const cats = Array.from(e.getElementsByTagName('category')).map(c => c.getAttribute('term')).filter(Boolean);
    const primaryCat = e.getElementsByTagName('arxiv:primary_category')[0]?.getAttribute('term') || cats[0];
    return {
      source: 'arxiv',
      id: arxivId,
      title: get('title').replace(/\s+/g, ' ').trim(),
      summary: get('summary').replace(/\s+/g, ' ').trim(),
      authors,
      published: get('published'),
      pdfLink,
      htmlLink: id,
      primaryCategory: primaryCat,
      categories: cats,
    };
  });
};

// Parse generic RSS 2.0 feed (NBER, Fed, BIS)
const parseRSS = (text, sourceId) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  const items = Array.from(doc.getElementsByTagName('item'));
  return items.map((item, idx) => {
    const get = (tag) => item.getElementsByTagName(tag)[0]?.textContent?.trim() || '';
    const title = get('title').replace(/\s+/g, ' ').trim();
    const link = get('link');
    const description = get('description');
    const pubDate = get('pubDate') || get('dc:date');
    // dc:creator (RSS) or author (some feeds)
    const creators = [];
    Array.from(item.getElementsByTagName('dc:creator')).forEach(n => creators.push(n.textContent.trim()));
    if (creators.length === 0) {
      const author = get('author');
      if (author) creators.push(author);
    }
    // Try to extract author list from description if creator missing
    let authors = creators;
    if (authors.length === 0 && description) {
      const m = description.match(/by\s+([^<]+?)(?:[.<]|$)/i);
      if (m) authors = [m[1].trim()];
    }

    // Source-specific PDF/page link extraction
    let pdfLink = link;
    let htmlLink = link;
    let paperId = `${sourceId}-${idx}`;

    if (sourceId === 'nber') {
      // NBER links: https://www.nber.org/papers/w12345 — PDF = same + .pdf? No, NBER PDFs need authentication
      // Free PDF: https://www.nber.org/system/files/working_papers/w12345/w12345.pdf
      const idMatch = link.match(/\/papers\/(w\d+)/i);
      if (idMatch) {
        paperId = idMatch[1];
        pdfLink = `https://www.nber.org/system/files/working_papers/${paperId}/${paperId}.pdf`;
      }
    } else if (sourceId === 'fed' || sourceId === 'ifdp') {
      // Fed: https://www.federalreserve.gov/econres/feds/files/2024054pap.pdf
      const idMatch = link.match(/(\d{4}\d{3,4})/);
      if (idMatch) paperId = `${sourceId}-${idMatch[1]}`;
      // Most Fed RSS items already link to PDF
      if (link.endsWith('.pdf')) pdfLink = link;
    } else if (sourceId === 'bis') {
      // BIS: https://www.bis.org/publ/work1234.htm — PDF: https://www.bis.org/publ/work1234.pdf
      const idMatch = link.match(/work(\d+)/);
      if (idMatch) {
        paperId = `bis-${idMatch[1]}`;
        pdfLink = link.replace(/\.htm$/, '.pdf');
      }
    }

    return {
      source: sourceId,
      id: paperId,
      title,
      summary: stripHtml(description),
      authors,
      published: pubDate ? new Date(pubDate).toISOString() : '',
      pdfLink,
      htmlLink,
      primaryCategory: SOURCES[sourceId]?.short || sourceId.toUpperCase(),
      categories: [SOURCES[sourceId]?.short || sourceId.toUpperCase()],
    };
  });
};

// Universal dispatcher
const fetchPapers = async ({ source, category }) => {
  const src = SOURCES[source];
  if (!src) throw new Error(`Sorgente sconosciuta: ${source}`);
  if (src.externalOnly) throw new Error(`${src.label} non è raggiungibile dal browser. Apri il sito esterno.`);

  if (source === 'arxiv') {
    const targetUrl = `https://export.arxiv.org/api/query?search_query=cat:${encodeURIComponent(category)}&start=0&max_results=30&sortBy=submittedDate&sortOrder=descending`;
    const text = await fetchWithProxies(targetUrl, t => t.includes('<entry'));
    return parseArxiv(text);
  }

  // Generic RSS sources
  const text = await fetchWithProxies(src.feedUrl, t => t.includes('<item'));
  return parseRSS(text, source);
};

// Pretty date
const fmtDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

// Days since
const daysSince = (iso) => {
  if (!iso) return null;
  try {
    return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  } catch { return null; }
};

// =====================================================================
// Paper card
// =====================================================================
const PaperCard = ({ paper, theme, onSelect, categoryColor }) => {
  const days = daysSince(paper.published);
  const isFresh = days != null && days <= 14;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect(paper)}
      className={`${theme.panel} border ${theme.border} rounded-lg overflow-hidden glow-panel cursor-pointer group transition-all flex flex-col`}
      style={{ borderColor: isFresh ? `${categoryColor}55` : undefined }}
    >
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${categoryColor}, ${categoryColor}66)` }} />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest"
            style={{ background: `${categoryColor}15`, color: categoryColor, border: `1px solid ${categoryColor}55` }}>
            {paper.primaryCategory}
          </span>
          {isFresh && (
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/55">
              NEW
            </span>
          )}
        </div>

        <h3 className={`font-mono font-bold text-sm leading-snug mb-3 ${theme.textBold} group-hover:text-[#ff8c00] transition-colors line-clamp-3`}>
          {paper.title}
        </h3>

        <p className={`text-[11px] font-mono ${theme.textMuted} leading-relaxed line-clamp-3 mb-4 flex-1`}>
          {paper.summary}
        </p>

        <div className={`flex items-center justify-between text-[10px] font-mono ${theme.textMuted} pt-3 border-t border-[var(--c-border)]`}>
          <span className="flex items-center gap-1.5 truncate">
            <Users className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {paper.authors[0]}{paper.authors.length > 1 ? ` +${paper.authors.length - 1}` : ''}
            </span>
          </span>
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <Calendar className="w-3 h-3" />
            {fmtDate(paper.published)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
          <span className={`${theme.textMuted}`}>arXiv: <span className={theme.textBold}>{paper.id}</span></span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#ff8c00] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================================
// Paper detail modal — with embedded PDF preview
// =====================================================================
const PaperDetail = ({ paper, theme, onClose, categoryInfo }) => {
  const [pdfMode, setPdfMode] = useState('native'); // 'native' | 'gdocs' | 'hidden'
  const [pdfFailed, setPdfFailed] = useState(false);

  // Split summary into pseudo-paragraphs for readability
  const paragraphs = useMemo(() => {
    if (!paper.summary) return [];
    const sentences = paper.summary.split(/(?<=[.!?])\s+/);
    const groups = [];
    for (let i = 0; i < sentences.length; i += 3) {
      groups.push(sentences.slice(i, i + 3).join(' '));
    }
    return groups;
  }, [paper.summary]);

  const c = categoryInfo?.color || '#ff8c00';
  const gdocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(paper.pdfLink)}&embedded=true`;
  const pdfSrc = pdfMode === 'gdocs' ? gdocsUrl : paper.pdfLink;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[15000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        onClick={e => e.stopPropagation()}
        className={`${theme.panel} border ${theme.border} rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto shadow-2xl my-4`}
        style={{ borderColor: `${c}55` }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--c-border)] sticky top-0 z-10" style={{ background: 'var(--c-panel)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${c}15`, border: `1px solid ${c}55` }}>
                <FileText className="w-5 h-5" style={{ color: c }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest"
                    style={{ background: `${c}15`, color: c, border: `1px solid ${c}55` }}>
                    {paper.primaryCategory}
                  </span>
                  <span className={`text-[10px] font-mono ${theme.textMuted}`}>
                    arXiv:{paper.id} · pubblicato {fmtDate(paper.published)}
                  </span>
                </div>
                <h2 className={`font-display text-lg md:text-xl font-bold leading-tight ${theme.textBold}`}>{paper.title}</h2>
              </div>
            </div>
            <button onClick={onClose}
              className={`p-2 rounded ${theme.textMuted} hover:text-[#ff1744] hover:bg-[#ff1744]/10 transition-all flex-shrink-0`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body — 2 column layout: abstract + PDF preview */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-0">

          {/* LEFT — metadata & abstract */}
          <div className="p-6 space-y-5 lg:border-r lg:border-[var(--c-border)]">
            {/* Authors */}
            <div className="flex items-start gap-2 flex-wrap">
              <Users className={`w-4 h-4 ${theme.textMuted} mt-1 flex-shrink-0`} />
              <div className="flex flex-wrap gap-1.5">
                {paper.authors.map((a, i) => (
                  <span key={i} className={`text-xs font-mono px-2 py-0.5 rounded ${theme.card} border ${theme.borderLight} ${theme.textBold}`}>
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className={`w-4 h-4 ${theme.textMuted} flex-shrink-0`} />
              {paper.categories.map((cat, i) => (
                <span key={i} className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-widest ${theme.textMuted}`}
                  style={{ background: cat === paper.primaryCategory ? `${c}15` : undefined, color: cat === paper.primaryCategory ? c : undefined }}>
                  {cat}
                </span>
              ))}
            </div>

            {/* Abstract / Summary */}
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#ff8c00] mb-3 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" /> Abstract / Sintesi
              </h3>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                {paragraphs.map((p, i) => (
                  <p key={i} className={`text-sm leading-relaxed font-mono ${theme.textMuted}`}>{p}</p>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[var(--c-border)]">
              <a href={paper.pdfLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-widest
                  bg-[#ff8c00] text-black hover:bg-[#ff9f1c] transition-all shadow-lg shadow-[#ff8c00]/30">
                <FileText className="w-4 h-4" /> Apri PDF
              </a>
              <a href={paper.htmlLink} target="_blank" rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-widest
                  border ${theme.border} ${theme.textBold} ${theme.cardHover} transition-all`}>
                <ExternalLink className="w-4 h-4" /> Pagina arXiv
              </a>
            </div>

            <p className={`text-[10px] font-mono italic ${theme.textMuted} flex items-start gap-2 pt-3 border-t border-[var(--c-border)]`}>
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>Sintesi = abstract ufficiale arXiv. Per risultati completi, formule, esperimenti, leggi il PDF ufficiale.</span>
            </p>
          </div>

          {/* RIGHT — PDF preview */}
          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#ff8c00] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Preview PDF
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setPdfMode('native'); setPdfFailed(false); }}
                  className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-widest border transition-all ${
                    pdfMode === 'native'
                      ? 'bg-[#ff8c00]/15 text-[#ff8c00] border-[#ff8c00]/55'
                      : `${theme.card} ${theme.textMuted} border-[var(--c-border)] hover:text-[#e0e0e0]`
                  }`}>
                  Diretto
                </button>
                <button
                  onClick={() => { setPdfMode('gdocs'); setPdfFailed(false); }}
                  className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-widest border transition-all ${
                    pdfMode === 'gdocs'
                      ? 'bg-[#ff8c00]/15 text-[#ff8c00] border-[#ff8c00]/55'
                      : `${theme.card} ${theme.textMuted} border-[var(--c-border)] hover:text-[#e0e0e0]`
                  }`}>
                  Google Docs
                </button>
                <button
                  onClick={() => setPdfMode('hidden')}
                  className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-widest border transition-all ${
                    pdfMode === 'hidden'
                      ? 'bg-[#ff8c00]/15 text-[#ff8c00] border-[#ff8c00]/55'
                      : `${theme.card} ${theme.textMuted} border-[var(--c-border)] hover:text-[#e0e0e0]`
                  }`}>
                  Nascondi
                </button>
              </div>
            </div>

            {pdfMode === 'hidden' ? (
              <div className={`flex-1 min-h-[450px] flex flex-col items-center justify-center gap-3 rounded border ${theme.borderLight} ${theme.card}`}>
                <FileText className={`w-10 h-10 ${theme.textMuted}`} />
                <p className={`text-xs font-mono ${theme.textMuted}`}>Preview disabilitato</p>
              </div>
            ) : pdfFailed ? (
              <div className={`flex-1 min-h-[450px] flex flex-col items-center justify-center gap-3 rounded border ${theme.borderLight} ${theme.card} text-center px-4`}>
                <AlertCircle className="w-8 h-8 text-[#ff8c00]" />
                <p className={`text-xs font-mono ${theme.textBold}`}>PDF non incorporabile</p>
                <p className={`text-[11px] font-mono ${theme.textMuted}`}>
                  Il browser ha bloccato l&apos;embed del PDF.<br />
                  Prova la modalità "Google Docs" oppure apri direttamente il PDF.
                </p>
                <a href={paper.pdfLink} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded font-mono text-xs font-bold bg-[#ff8c00] text-black hover:bg-[#ff9f1c] transition-all">
                  <ExternalLink className="w-3.5 h-3.5" /> Apri PDF in nuova scheda
                </a>
              </div>
            ) : (
              <div className={`flex-1 rounded overflow-hidden border ${theme.borderLight} bg-black`} style={{ minHeight: 600 }}>
                <iframe
                  key={`${paper.id}-${pdfMode}`}
                  src={pdfSrc}
                  title={paper.title}
                  className="w-full h-full"
                  style={{ minHeight: 600, border: 0 }}
                  onError={() => setPdfFailed(true)}
                  loading="lazy"
                />
              </div>
            )}

            <p className={`mt-2 text-[10px] font-mono italic ${theme.textMuted}`}>
              {pdfMode === 'gdocs'
                ? 'Renderizzato via Google Docs Viewer (caricamento più lento ma compatibile).'
                : 'Renderizzato dal browser (richiede plugin PDF integrato).'}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// =====================================================================
// Main page
// =====================================================================
export default function Researcher({ isDark, theme }) {
  const [activeSource, setActiveSource] = useState('arxiv');
  const [activeCategory, setActiveCategory] = useState('q-fin.PM');
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const loadPapers = useCallback(async (source, category) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPapers({ source, category });
      setPapers(data);
    } catch (e) {
      setError(e.message || 'Errore caricamento paper');
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (SOURCES[activeSource]?.externalOnly) {
      setLoading(false);
      setPapers([]);
      return;
    }
    loadPapers(activeSource, activeCategory);
  }, [activeSource, activeCategory, loadPapers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.authors.some(a => a.toLowerCase().includes(q))
    );
  }, [papers, search]);

  const currentCat = RESEARCH_CATEGORIES.find(c => c.id === activeCategory);
  const currentSource = SOURCES[activeSource];
  const sourceColor = currentSource?.color || '#ff8c00';
  const showCategories = currentSource?.hasCategories;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl md:text-4xl font-black font-mono uppercase tracking-tight ${theme.textBold}`}>
            <span className="text-[#ff8c00] glow-orange">Researcher</span> · Paper Quantitativi
          </h1>
          <p className={`mt-2 text-sm font-mono ${theme.textMuted}`}>
            Aggregatore live dai principali archivi accademici · arXiv · NBER · Federal Reserve · BIS · SSRN
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text" placeholder="Cerca titolo, autore..."
              value={search} onChange={e => setSearch(e.target.value)}
              className={`pl-9 pr-3 py-2 rounded text-xs font-mono border ${theme.border} bg-[#000000] text-[#e0e0e0] placeholder:text-[#555] focus:border-[#ff8c00]/50 focus:outline-none w-56`}
            />
          </div>
          <button onClick={() => loadPapers(activeSource, activeCategory)} disabled={loading}
            className={`p-2.5 rounded border ${theme.navBtnBg} ${theme.navText} ${theme.navHover} transition-all disabled:opacity-50`}
            title="Ricarica">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Source selector */}
      <div>
        <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted} mb-2`}>
          Sorgente
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.values(SOURCES).map(s => {
            const active = activeSource === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSource(s.id)}
                className={`px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
                  active ? 'text-white shadow-md' : `${theme.card} ${theme.textMuted} border-[var(--c-border)] hover:text-[#e0e0e0]`
                }`}
                style={active ? { background: s.color, borderColor: s.color } : undefined}
              >
                {s.short}
                {s.externalOnly && <ExternalLink className="w-3 h-3 opacity-60" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source description card */}
      {currentSource && (
        <div className={`${theme.panel} border ${theme.border} rounded-lg p-4 glow-panel`}
          style={{ borderColor: `${sourceColor}55` }}>
          <div className="flex items-start gap-3 justify-between flex-wrap">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: `${sourceColor}15`, border: `1px solid ${sourceColor}55` }}>
                <BookOpen className="w-4 h-4" style={{ color: sourceColor }} />
              </div>
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-widest font-bold mb-1" style={{ color: sourceColor }}>
                  {currentSource.label}
                </h3>
                <p className={`text-xs font-mono ${theme.textMuted}`}>{currentSource.desc}</p>
              </div>
            </div>
            <a href={currentSource.homepage} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest border transition-all flex-shrink-0
                ${theme.card} ${theme.textBold} hover:text-[#ff8c00]`}
              style={{ borderColor: `${sourceColor}55` }}>
              <ExternalLink className="w-3 h-3" /> Sito ufficiale
            </a>
          </div>
        </div>
      )}

      {/* Category tabs (only for arXiv) */}
      {showCategories && (
        <div>
          <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme.textMuted} mb-2`}>
            Categoria q-fin
          </div>
          <div className="flex flex-wrap gap-2">
            {RESEARCH_CATEGORIES.map(c => {
              const Icon = c.icon;
              const active = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-2 rounded text-[11px] font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
                    active ? 'text-black shadow-md' : `${theme.card} ${theme.textMuted} border-[var(--c-border)] hover:text-[#e0e0e0] hover:border-[#ff8c00]/20`
                  }`}
                  style={active ? { background: c.color, borderColor: c.color } : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {c.short}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category description (arXiv only) */}
      {showCategories && currentCat && (
        <div className={`${theme.panel} border ${theme.border} rounded-lg p-4 glow-panel`}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: `${currentCat.color}15`, border: `1px solid ${currentCat.color}55` }}>
              <currentCat.icon className="w-4 h-4" style={{ color: currentCat.color }} />
            </div>
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest font-bold mb-1" style={{ color: currentCat.color }}>
                {currentCat.label} · <span className={theme.textMuted}>{currentCat.id}</span>
              </h3>
              <p className={`text-xs font-mono ${theme.textMuted}`}>{currentCat.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* External-only source: show message + link */}
      {currentSource?.externalOnly && (
        <div className={`${theme.panel} border ${theme.border} rounded-lg p-12 glow-panel text-center`}>
          <ExternalLink className="w-10 h-10 text-[#ff8c00] mx-auto mb-4 opacity-60" />
          <h3 className={`font-mono font-bold uppercase tracking-widest text-base ${theme.textBold} mb-2`}>
            Sorgente non incorporabile
          </h3>
          <p className={`text-sm font-mono ${theme.textMuted} max-w-lg mx-auto mb-6`}>
            <span className={theme.textBold}>SSRN</span> blocca le richieste cross-origin via Cloudflare e non espone feed pubblici stabili.
            Visita il sito direttamente per consultare i paper di finance research.
          </p>
          <a href={currentSource.homepage} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-widest
              bg-[#ff8c00] hover:bg-[#ff9f1c] text-black shadow-lg shadow-[#ff8c00]/30 transition-all hover:scale-105">
            <ExternalLink className="w-4 h-4" /> Apri SSRN — Financial Economics Network
          </a>
        </div>
      )}

      {/* Loading / Error / Grid (hidden if external-only source) */}
      {!currentSource?.externalOnly && (
        loading && papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="w-8 h-8 animate-spin" style={{ color: sourceColor }} />
            <span className={`text-xs font-mono uppercase tracking-widest ${theme.textMuted}`}>
              Caricamento paper da {currentSource?.short || ''}...
            </span>
          </div>
        ) : error ? (
          <div className="p-6 rounded border border-[#ff1744]/40 bg-[#ff1744]/10 text-[#ff1744] text-sm font-mono">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className={`${theme.panel} border ${theme.border} rounded-lg p-12 glow-panel text-center`}>
            <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-60" style={{ color: sourceColor }} />
            <p className={`text-sm font-mono ${theme.textMuted}`}>
              {search ? `Nessun paper corrisponde a "${search}"` : 'Nessun paper disponibile per questa selezione.'}
            </p>
          </div>
        ) : (
          <>
            <div className={`text-[10px] font-mono uppercase tracking-widest ${theme.textMuted}`}>
              {filtered.length} paper · {currentSource?.short} · ordinati per data
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(p => (
                <PaperCard
                  key={`${p.source}-${p.id}`}
                  paper={p}
                  theme={theme}
                  onSelect={setSelected}
                  categoryColor={showCategories ? (currentCat?.color || sourceColor) : sourceColor}
                />
              ))}
            </div>
          </>
        )
      )}

      {/* About */}
      <div className={`${theme.panel} border ${theme.border} rounded-lg p-5 glow-panel`}>
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#ff8c00] font-bold mb-3 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" /> Fonti & Metodologia
        </h4>
        <ul className={`space-y-2 text-xs font-mono ${theme.textMuted} leading-relaxed`}>
          <li>· <span className={theme.textBold}>arXiv (q-fin)</span>: archivio open-access Cornell · 9 sub-categorie quantitative · API XML Atom.</li>
          <li>· <span className={theme.textBold}>NBER</span>: National Bureau of Economic Research · working papers economisti accademici USA · feed RSS.</li>
          <li>· <span className={theme.textBold}>Federal Reserve FEDS / IFDP</span>: Finance and Economics Discussion Series + International Finance Discussion Papers · feed RSS Fed Board.</li>
          <li>· <span className={theme.textBold}>BIS</span>: Bank for International Settlements · working papers su stabilità finanziaria globale e regolamentazione · feed RSS.</li>
          <li>· <span className={theme.textBold}>SSRN</span>: bloccato da Cloudflare/CORS · solo link esterno al sito ufficiale.</li>
          <li>· I paper sono ordinati per <span className={theme.textBold}>data di pubblicazione</span> (più recenti prima); badge <span className="text-[#00e676]">NEW</span> per paper ≤14 giorni.</li>
          <li>· La sintesi mostrata è l&apos;<span className={theme.textBold}>abstract ufficiale</span> fornito dagli autori (no LLM rephrasing).</li>
          <li>· Ogni paper ha link diretto al <span className={theme.textBold}>PDF</span> embeddato nel modal con preview live (toggle Diretto / Google Docs).</li>
          <li>· Tutti i feed passano attraverso una <span className={theme.textBold}>chain di proxy CORS</span> con fallback automatico (allorigins, corsproxy, codetabs) se il direct fetch fallisce.</li>
        </ul>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <PaperDetail
            paper={selected}
            theme={theme}
            categoryInfo={RESEARCH_CATEGORIES.find(c => selected.primaryCategory === c.id) || currentCat}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Lucide AlertTriangle inline (avoid extra import)
const AlertTriangle = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
