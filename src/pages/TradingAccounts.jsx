import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ExternalLink, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { MY_ACCOUNTS } from '../config/myAccounts';

// =====================================================================
// Embed parser — supports <a><img></a>, <iframe>, or raw URLs
// =====================================================================
const parseEmbed = (input) => {
  if (!input) return null;
  const t = input.trim();

  // <a href="..."><img src="..."></a> → MyFxBook PNG widget
  const aImgMatch = t.match(/<a[^>]+href=["']([^"']+)["'][^>]*>\s*<img[^>]+src=["']([^"']+)["']/i);
  if (aImgMatch) return { type: 'image', src: aImgMatch[2], href: aImgMatch[1] };

  // standalone <img>
  const imgMatch = t.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return { type: 'image', src: imgMatch[1] };

  // <iframe>
  const iframeMatch = t.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) return { type: 'iframe', src: iframeMatch[1] };

  // raw URL
  if (/^https?:\/\//i.test(t)) {
    if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(t)) return { type: 'image', src: t };
    return { type: 'iframe', src: t };
  }
  return null;
};

const isWidgetUrl = (url) => /widget(s)?\.myfxbook\.com/i.test(url || '');

// =====================================================================
// Single account card (read-only display)
// =====================================================================
function AccountCard({ account, theme }) {
  const [iframeError, setIframeError] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const embed = parseEmbed(account.embed);
  const outboundUrl = embed?.href || embed?.src;
  const isWidget = embed && isWidgetUrl(embed.src);

  const typeBadge = embed?.type === 'image'
    ? { label: 'PNG WIDGET', color: '#a78bfa' }
    : isWidget
      ? { label: 'IFRAME WIDGET', color: '#00e676' }
      : embed
        ? { label: 'PAGE', color: '#64b5f6' }
        : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${theme.panel} border ${theme.border} rounded-lg overflow-hidden glow-panel flex flex-col`}
    >
      {/* Header */}
      <div className="px-5 py-14 border-b border-[var(--c-border)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: '#ff8c0015', border: '1px solid #ff8c0040' }}>
            <Wallet className="w-5 h-5 text-[#ff8c00]" />
          </div>
          <div className="min-w-0">
            <h3 className={`font-mono font-bold text-base ${theme.textBold} truncate`}>{account.name}</h3>
            <p className={`text-[10px] font-mono ${theme.textMuted} flex items-center gap-2`}>
              <span>{account.broker}</span>
              {typeBadge && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                  style={{ background: `${typeBadge.color}15`, color: typeBadge.color }}>
                  {typeBadge.label}
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#00e676]/15 text-[#00e676] flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => { setIframeError(false); setImgError(false); setReloadKey(k => k + 1); }}
            className={`p-1.5 rounded ${theme.textMuted} hover:text-[#ff8c00] hover:bg-[#ff8c00]/10 transition-all`}
            title="Ricarica widget">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {outboundUrl && (
            <a href={outboundUrl} target="_blank" rel="noopener noreferrer"
              className={`p-1.5 rounded ${theme.textMuted} hover:text-[#ff8c00] hover:bg-[#ff8c00]/10 transition-all`}
              title="Apri su MyFxBook">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Notes */}
      {account.note && (
        <div className={`px-5 py-14.5 border-b border-[var(--c-border)] text-[11px] font-mono italic ${theme.textMuted}`}>
          {account.note}
        </div>
      )}

      {/* Embed area */}
      <div className="flex-1 relative bg-black/20 flex items-center justify-center" style={{ minHeight: embed?.type === 'image' ? 0 : 360 }}>
        {!embed ? (
          <div className={`flex flex-col items-center justify-center text-center px-6 py-16 ${theme.textMuted} text-xs font-mono`}>
            <AlertCircle className="w-6 h-6 mb-10 text-[#ff1744]" />
            Embed non valido per questo account.
          </div>
        ) : embed.type === 'image' ? (
          imgError ? (
            <div className={`flex flex-col items-center justify-center text-center px-6 py-12 ${theme.textMuted} text-xs font-mono gap-3`}>
              <AlertCircle className="w-6 h-6 text-[#ff8c00]" />
              <span>Widget temporaneamente non disponibile.</span>
              {outboundUrl && (
                <a href={outboundUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-14 rounded text-xs font-bold bg-[#ff8c00] text-black hover:bg-[#ff9f1c] transition-all">
                  <ExternalLink className="w-3.5 h-3.5" /> Apri su MyFxBook
                </a>
              )}
            </div>
          ) : (
            <a href={outboundUrl || embed.src} target="_blank" rel="noopener noreferrer"
              className="block w-full p-4 hover:bg-white/[0.02] transition-colors"
              title="Apri pagina account su MyFxBook">
              <img
                key={reloadKey}
                src={embed.src}
                alt={account.name}
                onError={() => setImgError(true)}
                className="w-full h-auto mx-auto rounded shadow-lg"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </a>
          )
        ) : iframeError ? (
          <div className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6 ${theme.textMuted} text-xs font-mono gap-3`}>
            <AlertCircle className="w-6 h-6 text-[#ff8c00]" />
            <span>Widget bloccato dal sito.</span>
            {outboundUrl && (
              <a href={outboundUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-14 rounded text-xs font-bold bg-[#ff8c00] text-black hover:bg-[#ff9f1c] transition-all">
                <ExternalLink className="w-3.5 h-3.5" /> Apri su MyFxBook
              </a>
            )}
          </div>
        ) : (
          <iframe
            key={reloadKey}
            src={embed.src}
            title={account.name}
            className="w-full h-full absolute inset-0"
            onError={() => setIframeError(true)}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="no-referrer"
            loading="lazy"
            allowFullScreen
          />
        )}
      </div>

      {/* Footer with link */}
      {outboundUrl && (
        <div className={`px-5 py-14.5 border-t border-[var(--c-border)] flex items-center justify-between text-[10px] font-mono ${theme.textMuted}`}>
          <span className="truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] pulse-live" />
            Aggiornamento live · widget MyFxBook ufficiale
          </span>
          <a href={outboundUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 ml-3 flex-shrink-0 hover:text-[#ff8c00] transition-colors">
            <ExternalLink className="w-3 h-3" /> Apri pagina
          </a>
        </div>
      )}
    </motion.div>
  );
}

// =====================================================================
// Page
// =====================================================================
export default function TradingAccounts({ isDark, theme }) {
  return (
    <div className="space-y-14 animate-fade-in">
      {/* HEADER */}
      <div>
        <h1 className={`text-3xl md:text-4xl font-black font-mono uppercase tracking-tight ${theme.textBold}`}>
          I Miei <span className="text-[#ff8c00] glow-orange">Conti Live</span>
        </h1>
        <p className={`mt-10 text-sm font-mono ${theme.textMuted}`}>
          Track record verificato · Widget MyFxBook ufficiali · Aggiornamento automatico in tempo reale
        </p>
      </div>

      {/* ACCOUNTS GRID */}
      {MY_ACCOUNTS.length === 0 ? (
        <div className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel text-center`}>
          <Wallet className="w-12 h-12 text-[#ff8c00] mx-auto mb-10 opacity-60" />
          <h3 className={`font-mono font-bold uppercase tracking-widest text-base ${theme.textBold} mb-10`}>
            Nessun account configurato
          </h3>
          <p className={`text-sm font-mono ${theme.textMuted}`}>
            Modifica <code className="text-[#ff8c00]">src/config/myAccounts.js</code> per aggiungere i conti da mostrare.
          </p>
        </div>
      ) : (
        <div className={MY_ACCOUNTS.length === 1 ? 'grid grid-cols-1 max-w-2xl mx-auto' : 'grid grid-cols-1 lg:grid-cols-2 gap-5'}>
          {MY_ACCOUNTS.map(a => (
            <AccountCard key={a.id} account={a} theme={theme} />
          ))}
        </div>
      )}

      {/* Trust footer */}
      <div className={`${theme.panel} border ${theme.border} rounded-lg p-14 glow-panel`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: '#00e67615', border: '1px solid #00e67640' }}>
            <ShieldCheck className="w-4 h-4 text-[#00e676]" />
          </div>
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#00e676] mb-10">
              Track record verificato
            </h4>
            <p className={`text-xs font-mono leading-relaxed ${theme.textMuted}`}>
              Tutti i conti mostrati sono <span className={theme.textBold}>collegati direttamente a MyFxBook</span> e
              aggiornati automaticamente dal broker tramite Investor Password. I dati che vedi sono gli stessi che si vedono
              sul sito ufficiale di MyFxBook — nessuna manipolazione, nessuna selezione di periodo. Clicca su un widget per
              visitare la pagina pubblica completa con storico operazioni, drawdown, statistiche.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
