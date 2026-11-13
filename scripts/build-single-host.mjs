import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';
import { transform } from 'esbuild';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');

console.log('1/4 Building production bundle...');
execSync('npx vite build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
});

const assetFiles = fs.readdirSync(assetsDir);
const cssFile = assetFiles.find((f) => f.endsWith('.css'));
const jsFile = assetFiles.find((f) => f.endsWith('.js'));

if (!jsFile) {
  throw new Error('Could not find compiled JS bundle in dist/assets');
}

const rawHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const rawCss = cssFile ? fs.readFileSync(path.join(assetsDir, cssFile), 'utf8') : '';
const rawJs = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

console.log('2/4 Converting JS bundle to standalone IIFE...');
const { code: iifeJs } = await transform(rawJs, {
  format: 'iife',
  target: 'es2020',
  minify: true,
});

// Prevent any literal </script inside JS strings from closing the inline HTML <script> tag
const safeJs = iifeJs.replace(/<\/script/gi, '<\\/script');
const safeCss = rawCss.replace(/<\/style/gi, '<\\/style');

console.log('3/4 Writing standalone single-file HTML (wall-street-runner.html)...');
let singleHtml = rawHtml
  // Remove external stylesheet link and module script emitted by Vite
  .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>\s*/gi, '')
  .replace(/<script[^>]*type=["']module["'][^>]*><\/script>\s*/gi, '');

const styleBlock = safeCss ? `    <style>${safeCss}</style>\n  </head>` : '  </head>';
const scriptBlock = `    <script>\n${safeJs}\n    </script>\n  </body>`;

singleHtml = singleHtml
  .replace('</head>', () => styleBlock)
  .replace('</body>', () => scriptBlock);

const htmlOutPath = path.join(rootDir, 'wall-street-runner.html');
fs.writeFileSync(htmlOutPath, singleHtml, 'utf8');

console.log('4/4 Writing standalone zero-dependency Node host (host-game.mjs)...');
const gzippedHtmlBase64 = zlib.gzipSync(Buffer.from(singleHtml, 'utf8'), { level: 9 }).toString('base64');

const hostServerSource = `#!/usr/bin/env node
// Standalone single-file host for Wall Street Runner (zero external dependencies)
// Run anywhere with: node host-game.mjs
import http from 'node:http';
import zlib from 'node:zlib';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const EMBEDDED_HTML_GZ_B64 = '${gzippedHtmlBase64}';
const GAME_HTML_GZ = Buffer.from(EMBEDDED_HTML_GZ_B64, 'base64');
const GAME_HTML_RAW = zlib.gunzipSync(GAME_HTML_GZ);

const SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'META', 'GOOGL', 'AMD', 'SPY', 'BTC-USD'];
const CACHE_TTL_MS = 60_000;
let cachedQuotes = [];
let cacheTimestamp = 0;

async function fetchYahooQuote(symbol) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(symbol) + '?interval=1d&range=5d';
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') return null;

    const q = result?.indicators?.quote?.[0];
    const volumes = q?.volume;
    const candles = [];
    let lastValidVolume = 0;
    if (q?.open && q?.close && q?.high && q?.low) {
      for (let i = 0; i < q.close.length; i++) {
        const o = q.open[i], c = q.close[i], h = q.high[i], l = q.low[i], v = volumes?.[i];
        if (typeof v === 'number' && v > 0) lastValidVolume = v;
        if (typeof o === 'number' && typeof c === 'number' && typeof h === 'number' && typeof l === 'number') {
          candles.push({ open: o, close: c, high: h, low: l, bull: c >= o });
        }
      }
    }

    const latestCandle = candles[candles.length - 1];
    const priorCandle = candles.length >= 2 ? candles[candles.length - 2] : undefined;
    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose ?? priorCandle?.close ?? meta.chartPreviousClose ?? price;
    const dayHigh = meta.regularMarketDayHigh ?? latestCandle?.high ?? price;
    const dayLow = meta.regularMarketDayLow ?? latestCandle?.low ?? price;
    const volume = meta.regularMarketVolume ?? lastValidVolume;
    const changePct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

    return { symbol: symbol.replace('-USD', ''), price, prevClose, dayHigh, dayLow, volume, changePct, candles };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getLiveMarketQuotes() {
  const now = Date.now();
  if (cachedQuotes.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedQuotes;
  }
  const results = await Promise.all(SYMBOLS.map((s) => fetchYahooQuote(s)));
  const valid = results.filter((q) => q !== null);
  if (valid.length > 0) {
    cachedQuotes = valid;
    cacheTimestamp = now;
  }
  return cachedQuotes;
}

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (urlPath === '/api/market-data') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    try {
      const quotes = await getLiveMarketQuotes();
      res.end(JSON.stringify({
        quotes,
        source: quotes.length > 0 ? 'live' : 'unavailable',
        updatedAt: new Date().toISOString(),
      }));
    } catch {
      res.end(JSON.stringify({
        quotes: [],
        source: 'unavailable',
        updatedAt: new Date().toISOString(),
      }));
    }
    return;
  }

  const acceptEncoding = String(req.headers['accept-encoding'] || '');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
    res.end(GAME_HTML_GZ);
  } else {
    res.end(GAME_HTML_RAW);
  }
});

server.listen(PORT, HOST, () => {
  console.log(\`Wall Street Runner hosted at http://localhost:\${PORT}\`);
});
`;

const hostOutPath = path.join(rootDir, 'host-game.mjs');
fs.writeFileSync(hostOutPath, hostServerSource, 'utf8');

const htmlSizeKB = (fs.statSync(htmlOutPath).size / 1024).toFixed(1);
const hostSizeKB = (fs.statSync(hostOutPath).size / 1024).toFixed(1);
console.log(`Done!\n - wall-street-runner.html (${htmlSizeKB} KB)\n - host-game.mjs (${hostSizeKB} KB)`);
