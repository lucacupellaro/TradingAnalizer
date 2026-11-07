// Vercel serverless CORS proxy.
// I proxy pubblici (allorigins, corsproxy.io, codetabs) non sono più affidabili:
// questa function inoltra la richiesta lato server, solo verso host in allowlist
// (per non diventare un open proxy).

const ALLOWED_HOSTS = [
  'export.arxiv.org',
  'arxiv.org',
  'www.nber.org',
  'nber.org',
  'back.nber.org',
  'www.federalreserve.gov',
  'www.bis.org',
  'papers.ssrn.com',
  'query1.finance.yahoo.com',
  'query2.finance.yahoo.com',
];

const isAllowed = (hostname) =>
  ALLOWED_HOSTS.includes(hostname);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const target = req.query.url;
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Parametro "url" mancante' });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return res.status(400).json({ error: 'URL non valido' });
  }
  if (parsed.protocol !== 'https:' || !isAllowed(parsed.hostname)) {
    return res.status(403).json({ error: `Host non consentito: ${parsed.hostname}` });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TradingAnalizer/1.0)',
        Accept: 'application/xml,application/rss+xml,application/atom+xml,application/json,text/*;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    // Il redirect finale deve restare su un host consentito
    const finalHost = new URL(upstream.url).hostname;
    if (!isAllowed(finalHost)) {
      return res.status(403).json({ error: `Redirect verso host non consentito: ${finalHost}` });
    }

    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/plain; charset=utf-8');
    // Cache CDN: 10 min fresh, 1h stale-while-revalidate
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    return res.status(upstream.status).send(body);
  } catch (e) {
    return res.status(502).json({ error: `Fetch fallito: ${e.message}` });
  }
}
