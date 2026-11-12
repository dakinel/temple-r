import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OhlcCandle {
  open: number;
  close: number;
  high: number;
  low: number;
  bull: boolean;
}

interface LiveStockQuote {
  symbol: string;
  price: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  changePct: number;
  candles: OhlcCandle[];
}

const SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'META', 'GOOGL', 'AMD', 'SPY', 'BTC-USD'];
const CACHE_TTL_MS = 60_000;

let cachedQuotes: LiveStockQuote[] = [];
let cacheTimestamp = 0;

async function fetchYahooQuote(symbol: string): Promise<LiveStockQuote | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            previousClose?: number;
            regularMarketDayHigh?: number;
            regularMarketDayLow?: number;
            regularMarketVolume?: number;
          };
          indicators?: {
            quote?: Array<{
              open?: Array<number | null>;
              close?: Array<number | null>;
              high?: Array<number | null>;
              low?: Array<number | null>;
            }>;
          };
        }>;
      };
    };

    const result = json.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') return null;

    const q = result?.indicators?.quote?.[0];
    const volumes = (q as { volume?: Array<number | null> } | undefined)?.volume;
    const candles: OhlcCandle[] = [];
    let lastValidVolume = 0;
    if (q?.open && q?.close && q?.high && q?.low) {
      const len = q.close.length;
      for (let i = 0; i < len; i++) {
        const o = q.open[i];
        const c = q.close[i];
        const h = q.high[i];
        const l = q.low[i];
        const v = volumes?.[i];
        if (typeof v === 'number' && v > 0) {
          lastValidVolume = v;
        }
        if (typeof o === 'number' && typeof c === 'number' && typeof h === 'number' && typeof l === 'number') {
          candles.push({
            open: o,
            close: c,
            high: h,
            low: l,
            bull: c >= o,
          });
        }
      }
    }

    const latestCandle = candles[candles.length - 1];
    const priorCandle = candles.length >= 2 ? candles[candles.length - 2] : undefined;
    const price = meta.regularMarketPrice;
    const prevClose =
      meta.previousClose ??
      priorCandle?.close ??
      meta.chartPreviousClose ??
      price;
    const dayHigh = meta.regularMarketDayHigh ?? latestCandle?.high ?? price;
    const dayLow = meta.regularMarketDayLow ?? latestCandle?.low ?? price;
    const volume = meta.regularMarketVolume ?? lastValidVolume;
    const changePct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

    return {
      symbol: symbol.replace('-USD', ''),
      price,
      prevClose,
      dayHigh,
      dayLow,
      volume,
      changePct,
      candles,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getLiveMarketQuotes(): Promise<LiveStockQuote[]> {
  const now = Date.now();
  if (cachedQuotes.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedQuotes;
  }

  const results = await Promise.all(SYMBOLS.map((s) => fetchYahooQuote(s)));
  const valid = results.filter((q): q is LiveStockQuote => q !== null);
  if (valid.length > 0) {
    cachedQuotes = valid;
    cacheTimestamp = now;
  }
  return cachedQuotes;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get('/api/market-data', async (_req: Request, res: Response) => {
    try {
      const quotes = await getLiveMarketQuotes();
      res.json({
        quotes,
        source: quotes.length > 0 ? 'live' : 'unavailable',
        updatedAt: new Date().toISOString(),
      });
    } catch {
      res.json({
        quotes: [],
        source: 'unavailable',
        updatedAt: new Date().toISOString(),
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
