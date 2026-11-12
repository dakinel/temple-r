export interface OhlcCandle {
  open: number;
  close: number;
  high: number;
  low: number;
  bull: boolean;
}

export interface LiveStockQuote {
  symbol: string;
  price: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  changePct: number;
  candles: OhlcCandle[];
}

export interface MarketQuery {
  id: string;
  ticker: string;
  price: string;
  change: string;
  category: 'AI TECH' | 'MACRO' | 'CRYPTO' | 'EARNINGS' | 'ENERGY' | 'DEAL' | 'RISK';
  headline: string;
  question: string;
  chartTrend: 'bull' | 'bear' | 'volatile';
  candles?: OhlcCandle[];
  marketSource?: 'live' | 'snapshot';

  // Tunnel Selection Specs
  leftLabel: string; // Label for Left Tunnel (YES)
  rightLabel: string; // Label for Right Tunnel (NO)
  correctSide: 'left' | 'right'; // Which tunnel matches the market signal!
  profit: number; // Dollar reward for choosing correct tunnel
  successReason: string;
  deathReason: string;
}

function formatPrice(symbol: string, value: number): string {
  if (symbol === 'BTC' || value >= 1000) {
    return `$${Math.round(value).toLocaleString()}`;
  }
  return `$${value.toFixed(2)}`;
}

function formatPct(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function formatVol(vol: number): string {
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`;
  return `${vol}`;
}

export function buildQueriesFromMarketData(quotes: LiveStockQuote[]): MarketQuery[] {
  return quotes.map((q, idx) => {
    const priceStr = formatPrice(q.symbol, q.price);
    const prevStr = formatPrice(q.symbol, q.prevClose);
    const highStr = formatPrice(q.symbol, q.dayHigh);
    const lowStr = formatPrice(q.symbol, q.dayLow);
    const pctStr = formatPct(q.changePct);
    const volStr = formatVol(q.volume);

    const spread = Math.max(0.01, q.dayHigh - q.dayLow);
    const rangePos = Math.max(0, Math.min(1, (q.price - q.dayLow) / spread));
    const rangePct = Math.round(rangePos * 100);

    const avgClose =
      q.candles.length > 0
        ? q.candles.reduce((acc, c) => acc + c.close, 0) / q.candles.length
        : q.prevClose;
    const avgStr = formatPrice(q.symbol, avgClose);
    const vsAvgPct = avgClose > 0 ? ((q.price - avgClose) / avgClose) * 100 : q.changePct;
    const vsAvgStr = formatPct(vsAvgPct);
    const totalBars = Math.max(1, q.candles.length);
    const bullCandles = q.candles.filter((c) => c.bull).length;
    const isBullishSetup =
      q.changePct >= 0.35 || (q.changePct > -0.35 && vsAvgPct >= 0.5 && rangePos >= 0.55);

    const reward = 8 + ((idx * 3 + Math.round(Math.abs(q.changePct) * 2)) % 8);
    const category: MarketQuery['category'] =
      q.symbol === 'BTC'
        ? 'CRYPTO'
        : q.symbol === 'SPY'
          ? 'MACRO'
          : q.symbol === 'NVDA' || q.symbol === 'AMD'
            ? 'AI TECH'
            : 'EARNINGS';

    if (q.changePct >= 1.0 && idx % 2 === 1) {
      return {
        id: `live_${q.symbol}_no_short`,
        ticker: q.symbol,
        price: priceStr,
        change: pctStr,
        category,
        headline: `${q.symbol} ${priceStr} (${pctStr}) · High ${highStr}`,
        question: `${bullCandles}/${totalBars} green bars & ${vsAvgStr} above 5D avg ${avgStr}. Short ${q.symbol}?`,
        chartTrend: 'bull',
        candles: q.candles,
        marketSource: 'live',
        leftLabel: 'SHORT NOW (YES)',
        rightLabel: 'STAY LONG (NO)',
        correctSide: 'right',
        profit: reward,
        successReason: `Smart hold! ${q.symbol} stayed strong above ${avgStr} at ${priceStr}. +$${reward}!`,
        deathReason: `Wrong Tunnel! Shorting ${q.symbol} while holding ${pctStr} above 5D avg ${avgStr} squeezed you out.`,
      };
    }

    if (q.changePct >= 1.0) {
      return {
        id: `live_${q.symbol}_breakout`,
        ticker: q.symbol,
        price: priceStr,
        change: pctStr,
        category,
        headline: `${q.symbol} ${priceStr} (${pctStr}) · Vol ${volStr}`,
        question: `Holding ${rangePct}% of day range (${lowStr}–${highStr}) above ${prevStr}. Go LONG?`,
        chartTrend: 'bull',
        candles: q.candles,
        marketSource: 'live',
        leftLabel: 'BUY / LONG (YES)',
        rightLabel: 'FADE / SHORT (NO)',
        correctSide: 'left',
        profit: reward,
        successReason: `${q.symbol} held momentum above ${prevStr} (${bullCandles}/${totalBars} green bars). +$${reward}!`,
        deathReason: `Wrong Tunnel! You faded ${q.symbol} while trading ${pctStr} near session high ${highStr}.`,
      };
    }

    if (q.changePct <= -1.0 && idx % 2 === 0) {
      return {
        id: `live_${q.symbol}_bear_trend`,
        ticker: q.symbol,
        price: priceStr,
        change: pctStr,
        category,
        headline: `${q.symbol} ${priceStr} (${pctStr}) · Low ${lowStr}`,
        question: `Trading ${vsAvgStr} below 5D avg ${avgStr} near day low ${lowStr}. Stay bearish?`,
        chartTrend: 'bear',
        candles: q.candles,
        marketSource: 'live',
        leftLabel: 'STAY BEARISH (YES)',
        rightLabel: 'BUY DIP (NO)',
        correctSide: 'left',
        profit: reward,
        successReason: `Sharp read! ${q.symbol} stayed weak under ${avgStr} near ${lowStr}. +$${reward}!`,
        deathReason: `Wrong Tunnel! Buying ${q.symbol} while sliding ${pctStr} below ${prevStr} caught the drop.`,
      };
    }

    if (q.changePct <= -1.0) {
      return {
        id: `live_${q.symbol}_breakdown`,
        ticker: q.symbol,
        price: priceStr,
        change: pctStr,
        category,
        headline: `${q.symbol} ${priceStr} (${pctStr}) · Low ${lowStr}`,
        question: `Pressed to ${rangePct}% of range near low ${lowStr} vs ${prevStr} close. Buy dip?`,
        chartTrend: 'bear',
        candles: q.candles,
        marketSource: 'live',
        leftLabel: 'BUY DIP (YES)',
        rightLabel: 'AVOID / SHORT (NO)',
        correctSide: 'right',
        profit: reward,
        successReason: `Good defense! ${q.symbol} stayed weak below ${prevStr} at ${priceStr}. +$${reward}!`,
        deathReason: `Wrong Tunnel! You bought ${q.symbol} while down ${pctStr} near session low ${lowStr}.`,
      };
    }

    if (isBullishSetup) {
      return {
        id: `live_${q.symbol}_trend`,
        ticker: q.symbol,
        price: priceStr,
        change: pctStr,
        category,
        headline: `${q.symbol} ${priceStr} (${pctStr}) · 5D Avg ${avgStr}`,
        question: `Above 5D avg ${avgStr} (${bullCandles}/${totalBars} green bars) on ${volStr} vol. Accumulate?`,
        chartTrend: 'bull',
        candles: q.candles,
        marketSource: 'live',
        leftLabel: 'ACCUMULATE (YES)',
        rightLabel: 'STAY OUT (NO)',
        correctSide: 'left',
        profit: reward,
        successReason: `${q.symbol} held support above ${avgStr} and pushed higher. +$${reward}!`,
        deathReason: `Wrong Tunnel! ${q.symbol} held above its 5-day average ${avgStr} and left shorts behind.`,
      };
    }

    return {
      id: `live_${q.symbol}_resistance`,
      ticker: q.symbol,
      price: priceStr,
      change: pctStr,
      category,
      headline: `${q.symbol} ${priceStr} (${pctStr}) · 5D Avg ${avgStr}`,
      question: `Stalling ${vsAvgStr} below 5D avg ${avgStr} (${rangePct}% of range). Go LONG?`,
      chartTrend: 'bear',
      candles: q.candles,
      marketSource: 'live',
      leftLabel: 'GO LONG (YES)',
      rightLabel: 'PASS / SHORT (NO)',
      correctSide: 'right',
      profit: reward,
      successReason: `Disciplined call! ${q.symbol} rejected under ${avgStr} resistance. +$${reward}!`,
      deathReason: `Wrong Tunnel! ${q.symbol} failed below its 5-day average ${avgStr}.`,
    };
  });
}

// Baseline stock-market-data snapshot queries (used prior to live sync or if offline)
export const MARKET_QUERIES: MarketQuery[] = [
  {
    id: 'nvda_market_data',
    ticker: 'NVDA',
    price: '$145.20',
    change: '+3.85%',
    category: 'AI TECH',
    headline: 'NVDA $145.20 (+3.85%) · Range $139.60–$146.10',
    question: 'Holding 86% of day range ($139.60–$146.10) above $139.82. Go LONG?',
    chartTrend: 'bull',
    candles: [
      { open: 135, close: 137.4, high: 138, low: 134.5, bull: true },
      { open: 137.4, close: 136.8, high: 138.2, low: 136, bull: false },
      { open: 136.8, close: 139.8, high: 140.5, low: 136.4, bull: true },
      { open: 139.8, close: 142.6, high: 143.1, low: 139.2, bull: true },
      { open: 142.6, close: 145.2, high: 146.1, low: 139.6, bull: true },
    ],
    marketSource: 'snapshot',
    leftLabel: 'BUY / LONG (YES)',
    rightLabel: 'FADE / SHORT (NO)',
    correctSide: 'left',
    profit: 10,
    successReason: 'NVDA held momentum above $139.82 prev close and broke through $146! +$10!',
    deathReason: 'Wrong Tunnel! Shorting NVDA while holding +3.85% near intraday highs wiped the position.',
  },
  {
    id: 'tsla_market_data',
    ticker: 'TSLA',
    price: '$248.10',
    change: '-3.42%',
    category: 'RISK',
    headline: 'TSLA $248.10 (-3.42%) · Prev Close $256.88',
    question: 'Pressed near session low $246.90 below $256.88 prev close. Buy dip?',
    chartTrend: 'bear',
    candles: [
      { open: 263, close: 260.5, high: 264, low: 259, bull: false },
      { open: 260.5, close: 258.2, high: 261, low: 257.1, bull: false },
      { open: 258.2, close: 259.4, high: 260, low: 256.5, bull: true },
      { open: 259.4, close: 256.88, high: 259.8, low: 254.9, bull: false },
      { open: 256.88, close: 248.1, high: 256.2, low: 246.9, bull: false },
    ],
    marketSource: 'snapshot',
    leftLabel: 'BUY DIP (YES)',
    rightLabel: 'AVOID / SHORT (NO)',
    correctSide: 'right',
    profit: 12,
    successReason: 'Disciplined call! TSLA stayed weak below $256.88 prev close. +$12!',
    deathReason: 'Wrong Tunnel! Stepping in front of -3.42% selling pressure below $256.88 triggered losses.',
  },
  {
    id: 'spy_market_data',
    ticker: 'SPY',
    price: '$598.40',
    change: '+1.18%',
    category: 'MACRO',
    headline: 'SPY $598.40 (+1.18%) · 5D Avg $591.20',
    question: '4/5 green bars & +1.2% above 5D avg $591.20. Short SPY now?',
    chartTrend: 'bull',
    candles: [
      { open: 588, close: 589.5, high: 590.2, low: 587.1, bull: true },
      { open: 589.5, close: 591.2, high: 592, low: 589, bull: true },
      { open: 591.2, close: 590.4, high: 592.5, low: 589.8, bull: false },
      { open: 590.4, close: 591.4, high: 593, low: 590, bull: true },
      { open: 591.4, close: 598.4, high: 599.1, low: 592.8, bull: true },
    ],
    marketSource: 'snapshot',
    leftLabel: 'SHORT NOW (YES)',
    rightLabel: 'STAY LONG (NO)',
    correctSide: 'right',
    profit: 8,
    successReason: 'SPY climbed cleanly above its $591.20 5-day average. +$8!',
    deathReason: 'Wrong Tunnel! Fading broad index strength above $591.20 missed the rally.',
  },
  {
    id: 'amd_market_data',
    ticker: 'AMD',
    price: '$141.60',
    change: '-2.65%',
    category: 'EARNINGS',
    headline: 'AMD $141.60 (-2.65%) · 5D Avg $146.90',
    question: 'Trading 3.6% below 5D avg $146.90 near low $140.80. Stay bearish?',
    chartTrend: 'bear',
    candles: [
      { open: 150, close: 148.5, high: 151, low: 147.8, bull: false },
      { open: 148.5, close: 147.2, high: 149, low: 146.5, bull: false },
      { open: 147.2, close: 148.1, high: 148.9, low: 146.1, bull: true },
      { open: 148.1, close: 145.45, high: 148.4, low: 144.8, bull: false },
      { open: 145.45, close: 141.6, high: 145.1, low: 140.8, bull: false },
    ],
    marketSource: 'snapshot',
    leftLabel: 'STAY BEARISH (YES)',
    rightLabel: 'BUY DIP (NO)',
    correctSide: 'left',
    profit: 11,
    successReason: 'Clean read! AMD rejected below its $146.90 5-day average. +$11!',
    deathReason: 'Wrong Tunnel! Going long below $146.90 resistance hit immediate drawdown.',
  },
  {
    id: 'btc_market_data',
    ticker: 'BTC',
    price: '$94,800',
    change: '+4.15%',
    category: 'CRYPTO',
    headline: 'BTC $94,800 (+4.15%) · High $95,250',
    question: 'Holding upper 92% of day range above $91,020 prev close. Go LONG?',
    chartTrend: 'bull',
    candles: [
      { open: 88200, close: 89400, high: 89900, low: 87900, bull: true },
      { open: 89400, close: 90100, high: 90600, low: 89100, bull: true },
      { open: 90100, close: 89700, high: 90800, low: 89300, bull: false },
      { open: 89700, close: 91020, high: 91500, low: 89500, bull: true },
      { open: 91020, close: 94800, high: 95250, low: 90900, bull: true },
    ],
    marketSource: 'snapshot',
    leftLabel: 'BUY / LONG (YES)',
    rightLabel: 'SHORT (NO)',
    correctSide: 'left',
    profit: 15,
    successReason: 'BTC broke past $94K with strong trend follow-through! +$15!',
    deathReason: 'Wrong Tunnel! Shorting +4.15% spot momentum into $95,250 liquidated margin.',
  },
  {
    id: 'aapl_market_data',
    ticker: 'AAPL',
    price: '$238.10',
    change: '+1.64%',
    category: 'EARNINGS',
    headline: 'AAPL $238.10 (+1.64%) · Prev Close $234.26',
    question: 'Above prev close $234.26 near session high $238.90. Accumulate?',
    chartTrend: 'bull',
    candles: [
      { open: 231, close: 232.5, high: 233, low: 230.5, bull: true },
      { open: 232.5, close: 233.1, high: 234, low: 232, bull: true },
      { open: 233.1, close: 232.8, high: 234.2, low: 232.1, bull: false },
      { open: 232.8, close: 234.26, high: 235, low: 232.6, bull: true },
      { open: 234.26, close: 238.1, high: 238.9, low: 234, bull: true },
    ],
    marketSource: 'snapshot',
    leftLabel: 'ACCUMULATE (YES)',
    rightLabel: 'SELL / SHORT (NO)',
    correctSide: 'left',
    profit: 7,
    successReason: 'AAPL stayed firm above $234.26 support through the close. +$7!',
    deathReason: 'Wrong Tunnel! Shorting steady +1.64% bids into session highs failed.',
  },
  {
    id: 'msft_market_data',
    ticker: 'MSFT',
    price: '$434.20',
    change: '-1.88%',
    category: 'EARNINGS',
    headline: 'MSFT $434.20 (-1.88%) · Low $433.40',
    question: 'Below prev close $442.52 pressing intraday low $433.40. Chase LONG?',
    chartTrend: 'bear',
    candles: [
      { open: 446, close: 444.2, high: 447, low: 443.5, bull: false },
      { open: 444.2, close: 443.1, high: 445, low: 442.2, bull: false },
      { open: 443.1, close: 443.9, high: 444.8, low: 442.5, bull: true },
      { open: 443.9, close: 442.52, high: 444.1, low: 441.2, bull: false },
      { open: 442.52, close: 434.2, high: 442.1, low: 433.4, bull: false },
    ],
    marketSource: 'snapshot',
    leftLabel: 'CHASE LONG (YES)',
    rightLabel: 'STAY OUT (NO)',
    correctSide: 'right',
    profit: 9,
    successReason: 'Avoided catching weakness near $433.40 lows! +$9!',
    deathReason: 'Wrong Tunnel! Long entry against -1.88% selling pressure hit support break.',
  },
];

export async function fetchLiveMarketQueries(): Promise<{
  queries: MarketQuery[];
  source: 'live' | 'snapshot';
}> {
  try {
    const res = await fetch('/api/market-data');
    if (!res.ok) return { queries: MARKET_QUERIES, source: 'snapshot' };
    const data = (await res.json()) as {
      quotes?: LiveStockQuote[];
      source?: string;
    };
    if (data.quotes && data.quotes.length > 0) {
      return {
        queries: buildQueriesFromMarketData(data.quotes),
        source: 'live',
      };
    }
  } catch {
    // Fallback cleanly to built-in stock market data snapshot
  }
  return { queries: MARKET_QUERIES, source: 'snapshot' };
}
