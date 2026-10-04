// Keep the existing Komarev counter and history; Vercel only relays its SVG.
const UPSTREAM = 'https://komarev.com/ghpvc/?username=diaoenmao&label=Profile%20views&color=0e75b6&style=flat';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  try {
    const incomingAgent = req.headers?.['user-agent'] || '';
    // The upstream increments for github-camo. Ordinary previews remain reads.
    const userAgent = incomingAgent.startsWith('github-camo') && req.method === 'GET'
      ? incomingAgent : 'diaoenmao-profile-preview';
    const response = await fetch(UPSTREAM, {
      method: req.method,
      headers: { 'User-Agent': userAgent, Accept: 'image/svg+xml' },
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('image/svg+xml')) {
      throw new Error('Upstream unavailable');
    }
    const body = req.method === 'HEAD' ? '' : await response.text();
    if (body.length > 65536 || (body && !body.includes('<svg'))) throw new Error('Invalid SVG');
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    return res.status(200).end(body);
  } catch {
    // Do not fabricate a count or reset the existing remote counter on an outage.
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    return res.status(503).end(req.method === 'HEAD' ? undefined
      : '<svg xmlns="http://www.w3.org/2000/svg" width="142" height="20" role="img" aria-label="Profile views unavailable"><rect width="142" height="20" rx="3" fill="#555"/><text x="71" y="14" fill="#fff" text-anchor="middle" font-family="Verdana,sans-serif" font-size="11">Profile views: --</text></svg>');
  }
};
