export interface MarketQuery {
  id: string;
  ticker: string;
  price: string;
  change: string;
  category: 'AI TECH' | 'MACRO' | 'CRYPTO' | 'EARNINGS' | 'ENERGY' | 'DEAL' | 'RISK';
  headline: string;
  question: string;
  chartTrend: 'bull' | 'bear' | 'volatile';
  
  // Tunnel Selection Specs
  leftLabel: string;   // Label for Left Tunnel
  rightLabel: string;  // Label for Right Tunnel
  correctSide: 'left' | 'right'; // Which tunnel survives!
  profit: number;      // Capital awarded for choosing correct tunnel
  successReason: string; // Explanatory message when survived
  deathReason: string;   // Dramatic liquidation obituary when wrong tunnel is chosen
}

export const MARKET_QUERIES: MarketQuery[] = [
  {
    id: 'nvda_datacenter',
    ticker: 'NVDA',
    price: '$145.20',
    change: '+4.8%',
    category: 'AI TECH',
    headline: 'Blackwell GPU Demand Outstrips Supply by 400%',
    question: 'Cloud hyperscalers increase 2026 AI CapEx by $60B. Go LONG?',
    chartTrend: 'bull',
    leftLabel: 'BUY / LONG (YES)',
    rightLabel: 'PASS / SHORT (NO)',
    correctSide: 'left',
    profit: 15000,
    successReason: 'Blackwell delivery numbers smash consensus! Stock breaks out +11%.',
    deathReason: 'Wrong Tunnel! You shorted NVDA during a parabolic AI supercycle. Infinite loss liquidation!',
  },
  {
    id: 'crypto_rugpull',
    ticker: 'PEPE-INU',
    price: '$0.000042',
    change: '+920%',
    category: 'CRYPTO',
    headline: 'Anonymous Meme Token Has Hidden Mint Function in Contract',
    question: 'Telegram group hyping 10,000x gain. Buy the speculative frenzy?',
    chartTrend: 'volatile',
    leftLabel: 'BUY ALL-IN (YES)',
    rightLabel: 'AVOID / PASS (NO)',
    correctSide: 'right',
    profit: 18000,
    successReason: 'Dodged the trap! Smart contract drained $40M 5 minutes later. Capital preserved!',
    deathReason: 'Wrong Tunnel! Rug pulled! The creator dumped 100% of the liquidity. Your portfolio dropped to $0.',
  },
  {
    id: 'fed_pivot',
    ticker: 'FED',
    price: '4.25%',
    change: '-50 bps',
    category: 'MACRO',
    headline: 'Federal Reserve Cuts Benchmark Rate by 50 bps',
    question: 'Massive liquidity injection hitting markets. Overweight High-Beta Growth?',
    chartTrend: 'bull',
    leftLabel: 'RISK-ON / EXPAND',
    rightLabel: 'STAY IN CASH',
    correctSide: 'left',
    profit: 14000,
    successReason: 'Liquidity tidal wave! Growth equities and indices rally across the board.',
    deathReason: 'Wrong Tunnel! Sidelined in zero-yield cash during explosive rally. LPs revoked funding!',
  },
  {
    id: 'biotech_rejection',
    ticker: 'BIO-X',
    price: '$68.50',
    change: '-34%',
    category: 'RISK',
    headline: 'FDA Issues Complete Response Letter with Major Toxicity Flags',
    question: 'Stock halted pre-market. Buy the dip on reopening?',
    chartTrend: 'bear',
    leftLabel: 'BUY THE DIP',
    rightLabel: 'CUT / AVOID',
    correctSide: 'right',
    profit: 16500,
    successReason: 'Disciplined risk control! Drug was cancelled entirely, saving millions in capital.',
    deathReason: 'Wrong Tunnel! Caught a falling knife! Stock reopened down -94% into bankruptcy liquidation!',
  },
  {
    id: 'btc_etf',
    ticker: 'BTC',
    price: '$96,400',
    change: '+5.7%',
    category: 'CRYPTO',
    headline: 'Sovereign Wealth Funds Allocate $12B into Spot Bitcoin',
    question: 'Approaching the psychological $100K barrier. Enter Bull Position?',
    chartTrend: 'bull',
    leftLabel: 'LONG / BUY',
    rightLabel: 'FADE / SHORT',
    correctSide: 'left',
    profit: 19500,
    successReason: 'Historic breakout! Bitcoin blasts through $100K with massive institutional bids.',
    deathReason: 'Wrong Tunnel! Shorted sovereign spot inflows. Leverage wiped out margin overnight!',
  },
  {
    id: 'deepfake_ceo',
    ticker: 'CYBR',
    price: '$55.00',
    change: '+45%',
    category: 'DEAL',
    headline: 'Deepfake AI Video of CEO Claims $80B Hostile Takeover',
    question: 'SEC confirms video is fraudulent fabrication. Chase the rumor?',
    chartTrend: 'volatile',
    leftLabel: 'CHASE RUMOR',
    rightLabel: 'DISMISS / SHORT',
    correctSide: 'right',
    profit: 17000,
    successReason: 'Sharp market intelligence! Fraudulent spike collapsed 10 minutes later.',
    deathReason: 'Wrong Tunnel! Fell for AI deepfake fraud! SEC halted trading and funds were frozen.',
  },
  {
    id: 'aapl_buyback',
    ticker: 'AAPL',
    price: '$242.00',
    change: '+2.1%',
    category: 'EARNINGS',
    headline: 'Apple Authorizes Record $110B Stock Repurchase Program',
    question: 'Services revenue margins hit record 75%. Accumulate Shares?',
    chartTrend: 'bull',
    leftLabel: 'ACCUMULATE (YES)',
    rightLabel: 'SELL / SHORT (NO)',
    correctSide: 'left',
    profit: 12500,
    successReason: 'Corporate buyback floor lifted share prices relentlessly. Steady gains locked in!',
    deathReason: 'Wrong Tunnel! Tried to fight a $110 Billion corporate buyback machine. Obliterated!',
  },
  {
    id: 'crude_embargo',
    ticker: 'CRUDE',
    price: '$86.20',
    change: '+6.1%',
    category: 'ENERGY',
    headline: 'Strategic Maritime Strait Shut Down Due to Naval Conflict',
    question: 'Global tanker fleet rerouting around Cape. Go LONG Crude Futures?',
    chartTrend: 'bull',
    leftLabel: 'LONG CRUDE',
    rightLabel: 'SHORT CRUDE',
    correctSide: 'left',
    profit: 15500,
    successReason: 'Energy supply shock pushed oil to $98/bbl. Massive commodity profits!',
    deathReason: 'Wrong Tunnel! Refused to hedge severe supply disruption. Fuel cost spikes bankrupted portfolio!',
  },
];
