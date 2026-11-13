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
  correctSide: 'left' | 'right'; // Which tunnel matches YES or NO
  profit: number; // Dollar reward for choosing correct tunnel
  successReason: string;
  deathReason: string;
}

interface BabankQuestionEntry {
  num: number;
  topic: string;
  category: MarketQuery['category'];
  question: string;
  answer: 'YES' | 'NO';
  explanation: string;
}

export const BABANK_QUESTION_BANK: BabankQuestionEntry[] = [
  // 6. Stocks & stock exchanges (51-60)
  { num: 51, topic: 'STOCKS', category: 'EARNINGS', question: "Does owning a company's stock make you a shareholder?", answer: 'YES', explanation: 'Shares represent ownership.' },
  { num: 52, topic: 'VOTING', category: 'EARNINGS', question: 'Can common shareholders have voting rights?', answer: 'YES', explanation: 'They can vote on certain corporate matters.' },
  { num: 53, topic: 'DIVIDENDS', category: 'EARNINGS', question: 'Does every stock pay dividends?', answer: 'NO', explanation: 'Companies can choose not to pay dividends.' },
  { num: 54, topic: 'EQUITY', category: 'DEAL', question: 'Can a private company have shareholders?', answer: 'YES', explanation: 'Private companies can issue shares.' },
  { num: 55, topic: 'IPO', category: 'DEAL', question: "Is an IPO a company's first public offering of shares?", answer: 'YES', explanation: 'IPO means Initial Public Offering.' },
  { num: 56, topic: 'EXCHANGE', category: 'RISK', question: 'Does delisting mean a stock is removed from an exchange?', answer: 'YES', explanation: 'Its exchange listing ends.' },
  { num: 57, topic: 'CAPITAL', category: 'DEAL', question: 'Can a company issue new shares to raise capital?', answer: 'YES', explanation: 'This is a form of equity financing.' },
  { num: 58, topic: 'SHARES', category: 'EARNINGS', question: "Does owning 10% of a company's shares always give you 10% of its profits?", answer: 'NO', explanation: 'Profit distributions depend on dividends and share rights.' },
  { num: 59, topic: 'CLASSES', category: 'DEAL', question: 'Can a company have multiple classes of shares?', answer: 'YES', explanation: 'Different classes can have different voting rights.' },
  { num: 60, topic: 'NYSE', category: 'MACRO', question: 'Is a stock exchange a marketplace for securities?', answer: 'YES', explanation: 'Exchanges facilitate securities trading.' },

  // 7. Accounting & financial statements (61-70)
  { num: 61, topic: 'BALANCE', category: 'EARNINGS', question: 'Must total assets equal total liabilities plus equity?', answer: 'YES', explanation: 'This is the accounting equation.' },
  { num: 62, topic: 'GAAP', category: 'EARNINGS', question: 'Is depreciation considered a non-cash expense?', answer: 'YES', explanation: 'It allocates asset costs over time.' },
  { num: 63, topic: 'AR', category: 'EARNINGS', question: 'Is accounts receivable money owed to a company by customers?', answer: 'YES', explanation: 'It represents unpaid customer invoices.' },
  { num: 64, topic: 'AP', category: 'EARNINGS', question: 'Is accounts payable money a company owes to suppliers?', answer: 'YES', explanation: 'It represents outstanding obligations.' },
  { num: 65, topic: 'ASSETS', category: 'EARNINGS', question: 'Is inventory classified as an asset?', answer: 'YES', explanation: 'It represents goods held for sale or production.' },
  { num: 66, topic: 'AMORT', category: 'EARNINGS', question: 'Does amortization apply to certain intangible assets?', answer: 'YES', explanation: 'It allocates their cost over useful lives.' },
  { num: 67, topic: 'EQUITY', category: 'EARNINGS', question: "Is retained earnings part of shareholders' equity?", answer: 'YES', explanation: 'It represents accumulated retained profits and losses.' },
  { num: 68, topic: 'CASHFLOW', category: 'EARNINGS', question: 'Does cash flow equal net income in every accounting period?', answer: 'NO', explanation: 'Accrual accounting creates differences.' },
  { num: 69, topic: 'GOODWILL', category: 'DEAL', question: 'Is goodwill classified as an intangible asset?', answer: 'YES', explanation: 'It can arise from business acquisitions.' },
  { num: 70, topic: 'OCF', category: 'EARNINGS', question: 'Can a company report a net loss while generating positive operating cash flow?', answer: 'YES', explanation: 'Non-cash expenses can create this situation.' },

  // 8. Bonds & fixed income (71-80)
  { num: 71, topic: 'BONDS', category: 'MACRO', question: 'Does a bond represent a debt obligation?', answer: 'YES', explanation: 'The issuer borrows money from investors.' },
  { num: 72, topic: 'CREDIT', category: 'MACRO', question: 'Is a bondholder generally a creditor rather than an owner?', answer: 'YES', explanation: 'Bondholders lend money to the issuer.' },
  { num: 73, topic: 'COUPON', category: 'MACRO', question: "Does a bond's coupon represent its stated interest payment?", answer: 'YES', explanation: 'It specifies the contractual interest rate.' },
  { num: 74, topic: 'TREASURY', category: 'MACRO', question: 'Can bonds be issued by governments?', answer: 'YES', explanation: 'Governments borrow through bond issuance.' },
  { num: 75, topic: 'CORPBOND', category: 'RISK', question: 'Can corporate bonds carry credit risk?', answer: 'YES', explanation: 'Issuers may fail to meet obligations.' },
  { num: 76, topic: 'MATURITY', category: 'MACRO', question: "Does a bond's maturity date indicate when principal is due?", answer: 'YES', explanation: 'It is the contractual repayment date.' },
  { num: 77, topic: 'ZEROCPN', category: 'MACRO', question: 'Is a zero-coupon bond issued without regular coupon payments?', answer: 'YES', explanation: 'It generally pays its value at maturity.' },
  { num: 78, topic: 'GOVBOND', category: 'RISK', question: 'Are government bonds always free of risk?', answer: 'NO', explanation: 'They can carry inflation, interest-rate and credit risks.' },
  { num: 79, topic: 'DISCOUNT', category: 'MACRO', question: 'Can a bond trade below its face value?', answer: 'YES', explanation: 'It can trade at a discount.' },
  { num: 80, topic: 'YIELD', category: 'MACRO', question: 'Is bond yield the same as its coupon rate in every case?', answer: 'NO', explanation: 'Yield also depends on market price and cash flows.' },

  // 9. Options & derivatives (81-90)
  { num: 81, topic: 'CALLS', category: 'RISK', question: 'Does a call option give its buyer the right to purchase an asset?', answer: 'YES', explanation: 'It provides a right, not an obligation.' },
  { num: 82, topic: 'PUTS', category: 'RISK', question: 'Does a put option give its buyer the right to sell an asset?', answer: 'YES', explanation: 'It provides a right, not an obligation.' },
  { num: 83, topic: 'STRIKE', category: 'RISK', question: 'Is the strike price the predetermined exercise price of an option?', answer: 'YES', explanation: 'It is specified in the contract.' },
  { num: 84, topic: 'PREMIUM', category: 'RISK', question: 'Does an option premium represent the price paid for an option?', answer: 'YES', explanation: 'Buyers pay this amount to acquire the contract.' },
  { num: 85, topic: 'OPTIONS', category: 'RISK', question: 'Can an option buyer lose the entire premium?', answer: 'YES', explanation: 'The option can expire worthless.' },
  { num: 86, topic: 'AMEROPT', category: 'RISK', question: 'Does an American-style option allow exercise before expiration?', answer: 'YES', explanation: 'It can generally be exercised any time up to expiration.' },
  { num: 87, topic: 'EUROOPT', category: 'RISK', question: 'Can a European-style option be exercised only at expiration?', answer: 'YES', explanation: 'That is its defining exercise feature.' },
  { num: 88, topic: 'INTRINSIC', category: 'RISK', question: "Does intrinsic value form part of an option's total value?", answer: 'YES', explanation: 'Option value includes intrinsic and time value.' },
  { num: 89, topic: 'IV', category: 'RISK', question: 'Is implied volatility derived from option market prices?', answer: 'YES', explanation: "It reflects the market's implied volatility expectation." },
  { num: 90, topic: 'FUTURES', category: 'ENERGY', question: 'Does a futures contract create an obligation for both parties?', answer: 'YES', explanation: 'Both sides have contractual obligations.' },

  // 10. Investment funds & ETFs (91-100)
  { num: 91, topic: 'ETF', category: 'MACRO', question: 'Can an ETF trade throughout the stock exchange trading day?', answer: 'YES', explanation: 'ETFs trade like listed securities.' },
  { num: 92, topic: 'INDEX', category: 'MACRO', question: 'Does an index fund aim to track a benchmark index?', answer: 'YES', explanation: 'It seeks to replicate index performance.' },
  { num: 93, topic: 'BONDETF', category: 'MACRO', question: 'Can ETFs hold bonds instead of stocks?', answer: 'YES', explanation: 'Bond ETFs are widely available.' },
  { num: 94, topic: 'ACTIVEETF', category: 'MACRO', question: 'Does every ETF passively track an index?', answer: 'NO', explanation: 'Actively managed ETFs also exist.' },
  { num: 95, topic: 'FUNDS', category: 'EARNINGS', question: 'Can mutual funds charge management fees?', answer: 'YES', explanation: 'Management and operating expenses may apply.' },
  { num: 96, topic: 'EXPENSE', category: 'EARNINGS', question: "Is an ETF's expense ratio an annual operating cost?", answer: 'YES', explanation: 'It expresses fund expenses as a percentage of assets.' },
  { num: 97, topic: 'NAV', category: 'MACRO', question: 'Can an ETF trade at a price different from its NAV?', answer: 'YES', explanation: 'Premiums and discounts can occur.' },
  { num: 98, topic: 'DIVERSIFY', category: 'RISK', question: 'Does diversification guarantee that an ETF will make a profit?', answer: 'NO', explanation: 'Diversified funds can still lose value.' },
  { num: 99, topic: 'SPY', category: 'MACRO', question: 'Can an ETF provide exposure to an entire stock market index?', answer: 'YES', explanation: 'Index ETFs can track broad market benchmarks.' },
  { num: 100, topic: 'RISK', category: 'RISK', question: 'Is an ETF always less risky than an individual stock?', answer: 'NO', explanation: 'Risk depends on its underlying holdings and strategy.' },

  // 11. Macroeconomics & central banking (101-110)
  { num: 101, topic: 'CPI', category: 'MACRO', question: 'Does inflation measure the general increase in prices?', answer: 'YES', explanation: 'It measures changes in consumer prices.' },
  { num: 102, topic: 'DEFLATION', category: 'MACRO', question: 'Does deflation refer to a sustained decrease in the general price level?', answer: 'YES', explanation: 'It means prices are falling overall.' },
  { num: 103, topic: 'RATES', category: 'MACRO', question: 'Can rising interest rates increase borrowing costs?', answer: 'YES', explanation: 'Loans generally become more expensive.' },
  { num: 104, topic: 'FED', category: 'MACRO', question: 'Is the Federal Reserve the central bank of the United States?', answer: 'YES', explanation: 'It conducts US monetary policy.' },
  { num: 105, topic: 'FOMC', category: 'MACRO', question: 'Does monetary policy influence the money supply and credit conditions?', answer: 'YES', explanation: 'Central banks use monetary policy tools.' },
  { num: 106, topic: 'GDP', category: 'MACRO', question: 'Is GDP a measure of economic output?', answer: 'YES', explanation: 'It measures the value of final goods and services produced.' },
  { num: 107, topic: 'CYCLE', category: 'MACRO', question: 'Does a recession always mean negative stock market returns?', answer: 'NO', explanation: 'Stock markets can rise during recessions.' },
  { num: 108, topic: 'FEDRATE', category: 'MACRO', question: 'Can a central bank lower interest rates to stimulate economic activity?', answer: 'YES', explanation: 'Lower rates can encourage borrowing and spending.' },
  { num: 109, topic: 'LABOR', category: 'MACRO', question: 'Does unemployment measure the percentage of the labor force without jobs but seeking work?', answer: 'YES', explanation: 'That is the standard unemployment concept.' },
  { num: 110, topic: 'FX', category: 'MACRO', question: 'Can currency depreciation make imports more expensive?', answer: 'YES', explanation: 'Foreign goods cost more in the weaker currency.' },

  // 12. Risk management (111-120)
  { num: 111, topic: 'RISK', category: 'RISK', question: 'Is diversification a method of managing investment risk?', answer: 'YES', explanation: 'It spreads exposure across investments.' },
  { num: 112, topic: 'STDDEV', category: 'RISK', question: 'Does a higher standard deviation indicate greater historical return variability?', answer: 'YES', explanation: 'Standard deviation measures dispersion.' },
  { num: 113, topic: 'BETA', category: 'RISK', question: 'Does a beta of 1 indicate market-level systematic sensitivity?', answer: 'YES', explanation: 'It represents approximately equal sensitivity to the benchmark.' },
  { num: 114, topic: 'LOWBETA', category: 'RISK', question: 'Does a beta below 1 necessarily mean an investment cannot lose money?', answer: 'NO', explanation: 'Lower beta does not eliminate losses.' },
  { num: 115, topic: 'REBALANCE', category: 'RISK', question: 'Can portfolio rebalancing restore target asset allocations?', answer: 'YES', explanation: 'It adjusts holdings toward desired weights.' },
  { num: 116, topic: 'EXPOSURE', category: 'RISK', question: 'Is concentration risk associated with holding too much exposure to one investment?', answer: 'YES', explanation: 'Large individual exposures increase dependency.' },
  { num: 117, topic: 'LIQUIDITY', category: 'RISK', question: 'Can liquidity risk make it difficult to sell an asset quickly at a fair price?', answer: 'YES', explanation: 'Limited buyers can make execution difficult.' },
  { num: 118, topic: 'STOPLOSS', category: 'RISK', question: 'Does a stop-loss order guarantee the exact execution price?', answer: 'NO', explanation: 'Gaps and slippage can cause worse execution.' },
  { num: 119, topic: 'ALPHA', category: 'RISK', question: 'Can diversification reduce company-specific investment risk?', answer: 'YES', explanation: 'Different holdings spread individual company exposure.' },
  { num: 120, topic: 'SYSRISK', category: 'RISK', question: 'Is systematic risk completely eliminated through diversification?', answer: 'NO', explanation: 'Broad market risk remains.' },

  // 13. Trading terminology (121-130)
  { num: 121, topic: 'MKTORDER', category: 'AI TECH', question: 'Does a market order generally prioritize immediate execution over price certainty?', answer: 'YES', explanation: 'It executes at available market prices.' },
  { num: 122, topic: 'LMTORDER', category: 'AI TECH', question: 'Does a limit order specify the maximum buying or minimum selling price?', answer: 'YES', explanation: 'It sets a price boundary.' },
  { num: 123, topic: 'FILL', category: 'AI TECH', question: 'Can a limit order remain unfilled?', answer: 'YES', explanation: 'The market may never reach its limit price.' },
  { num: 124, topic: 'BID', category: 'AI TECH', question: 'Is the bid price the highest price a buyer is willing to pay?', answer: 'YES', explanation: 'It represents the best available buying price.' },
  { num: 125, topic: 'ASK', category: 'AI TECH', question: 'Is the ask price the lowest price a seller is willing to accept?', answer: 'YES', explanation: 'It represents the best available selling price.' },
  { num: 126, topic: 'SPREAD', category: 'AI TECH', question: 'Does the bid-ask spread represent the difference between bid and ask prices?', answer: 'YES', explanation: 'It measures the quoted price gap.' },
  { num: 127, topic: 'SLIPPAGE', category: 'RISK', question: 'Does slippage occur when execution differs from the expected price?', answer: 'YES', explanation: 'It reflects execution price differences.' },
  { num: 128, topic: 'DAYTRADE', category: 'AI TECH', question: 'Is a day trade opened and closed within the same trading day?', answer: 'YES', explanation: 'It is an intraday trading position.' },
  { num: 129, topic: 'MARGIN', category: 'RISK', question: 'Does a margin account allow investors to borrow money from a broker?', answer: 'YES', explanation: 'It enables leveraged trading.' },
  { num: 130, topic: 'MARGINCALL', category: 'RISK', question: 'Can a margin call occur when account equity falls below required levels?', answer: 'YES', explanation: 'Brokers may require additional funds or position reductions.' },

  // 14. Technical analysis & chart patterns (131-140)
  { num: 131, topic: 'MA', category: 'AI TECH', question: 'Is a moving average calculated using historical prices?', answer: 'YES', explanation: 'It smooths price data over a period.' },
  { num: 132, topic: 'RSI', category: 'AI TECH', question: 'Is RSI a momentum oscillator?', answer: 'YES', explanation: 'It measures the speed and magnitude of price movements.' },
  { num: 133, topic: 'RSI', category: 'AI TECH', question: 'Is the standard RSI calculation based on a 0–100 scale?', answer: 'YES', explanation: 'RSI values range from 0 to 100.' },
  { num: 134, topic: 'RSI', category: 'RISK', question: 'Is an RSI reading above 70 commonly considered overbought?', answer: 'YES', explanation: 'It is a conventional technical threshold.' },
  { num: 135, topic: 'RSI', category: 'AI TECH', question: 'Is an RSI reading below 30 commonly considered oversold?', answer: 'YES', explanation: 'It is a conventional technical threshold.' },
  { num: 136, topic: 'MACD', category: 'AI TECH', question: 'Does MACD use moving averages to measure momentum?', answer: 'YES', explanation: 'It compares exponential moving averages.' },
  { num: 137, topic: 'GOLDENX', category: 'AI TECH', question: 'Is a Golden Cross formed when a shorter moving average crosses above a longer one?', answer: 'YES', explanation: 'It is commonly interpreted as bullish.' },
  { num: 138, topic: 'DEATHX', category: 'RISK', question: 'Is a Death Cross formed when a shorter moving average crosses below a longer one?', answer: 'YES', explanation: 'It is commonly interpreted as bearish.' },
  { num: 139, topic: 'OHLC', category: 'AI TECH', question: 'Does a candlestick chart display opening, closing, high and low prices?', answer: 'YES', explanation: 'These are its four core price points.' },
  { num: 140, topic: 'DOJI', category: 'AI TECH', question: 'Does a doji candlestick indicate that opening and closing prices are approximately equal?', answer: 'YES', explanation: 'It reflects price indecision.' },

  // 15. Corporate actions & ownership (141-150)
  { num: 141, topic: 'BUYBACK', category: 'DEAL', question: 'Can a company buy back its own shares?', answer: 'YES', explanation: 'This is known as a share repurchase.' },
  { num: 142, topic: 'SPLIT', category: 'DEAL', question: 'Can a stock split increase the number of outstanding shares?', answer: 'YES', explanation: 'Existing shares are divided into more shares.' },
  { num: 143, topic: 'REVSPLIT', category: 'DEAL', question: 'Does a reverse stock split reduce the number of outstanding shares?', answer: 'YES', explanation: 'Multiple shares are consolidated into fewer shares.' },
  { num: 144, topic: 'M&A', category: 'DEAL', question: 'Can mergers combine two previously separate companies?', answer: 'YES', explanation: 'Mergers consolidate businesses.' },
  { num: 145, topic: 'ACQUIRE', category: 'DEAL', question: 'Does an acquisition involve one company purchasing another?', answer: 'YES', explanation: 'It involves obtaining control or ownership.' },
  { num: 146, topic: 'RIGHTS', category: 'DEAL', question: 'Can a rights issue give existing shareholders the opportunity to buy additional shares?', answer: 'YES', explanation: 'It offers shares to existing investors under specified terms.' },
  { num: 147, topic: 'SPINOFF', category: 'DEAL', question: 'Does a spin-off create a separate independent company from part of an existing business?', answer: 'YES', explanation: 'A business unit becomes a separate entity.' },
  { num: 148, topic: 'SPLIT', category: 'DEAL', question: "Does a stock split automatically increase an investor's proportional ownership?", answer: 'NO', explanation: "The investor's share count and total shares adjust proportionally." },
  { num: 149, topic: 'PREF', category: 'EARNINGS', question: 'Can preferred shareholders have priority over common shareholders for dividends?', answer: 'YES', explanation: 'Preferred shares often carry dividend priority.' },
  { num: 150, topic: 'AGM', category: 'DEAL', question: 'Does a shareholder meeting allow investors to vote on certain corporate decisions?', answer: 'YES', explanation: 'Eligible shareholders exercise voting rights.' },

  // 16. Cryptocurrency & digital assets (151-160)
  { num: 151, topic: 'BTC', category: 'CRYPTO', question: 'Is Bitcoin a decentralized digital currency?', answer: 'YES', explanation: 'It operates on a decentralized network.' },
  { num: 152, topic: 'LEDGER', category: 'CRYPTO', question: 'Is blockchain a type of distributed ledger technology?', answer: 'YES', explanation: 'Records are maintained across network participants.' },
  { num: 153, topic: 'VOLATILE', category: 'CRYPTO', question: 'Can cryptocurrency prices experience high volatility?', answer: 'YES', explanation: 'Digital assets can experience large price swings.' },
  { num: 154, topic: 'ETH', category: 'CRYPTO', question: 'Is Ethereum the name of a blockchain network?', answer: 'YES', explanation: 'It supports smart contracts and decentralized applications.' },
  { num: 155, topic: 'CONTRACTS', category: 'CRYPTO', question: 'Are smart contracts programs that execute predefined conditions?', answer: 'YES', explanation: 'They automate contractual logic.' },
  { num: 156, topic: 'STABLE', category: 'CRYPTO', question: 'Does a stablecoin aim to maintain a relatively stable value?', answer: 'YES', explanation: 'It is designed to track a reference asset.' },
  { num: 157, topic: 'BACKING', category: 'CRYPTO', question: 'Are all cryptocurrencies backed by physical assets?', answer: 'NO', explanation: 'Many have no physical backing.' },
  { num: 158, topic: 'ONCHAIN', category: 'CRYPTO', question: 'Can blockchain transactions be publicly verifiable?', answer: 'YES', explanation: 'Many public blockchains expose transaction records.' },
  { num: 159, topic: 'PRIVKEY', category: 'CRYPTO', question: 'Does a private key help authorize cryptocurrency transactions?', answer: 'YES', explanation: 'It provides cryptographic control over assets.' },
  { num: 160, topic: 'MINING', category: 'CRYPTO', question: 'Is cryptocurrency mining used by some blockchain networks to validate transactions?', answer: 'YES', explanation: 'Proof-of-work networks use mining.' },

  // 17. Financial ratios & business performance (161-170)
  { num: 161, topic: 'LIQUID', category: 'EARNINGS', question: 'Is the current ratio calculated by dividing current assets by current liabilities?', answer: 'YES', explanation: 'It measures short-term liquidity.' },
  { num: 162, topic: 'QUICK', category: 'EARNINGS', question: 'Does the quick ratio exclude inventory from current assets?', answer: 'YES', explanation: 'It measures more immediate liquidity.' },
  { num: 163, topic: 'MARGIN', category: 'EARNINGS', question: 'Is gross margin calculated as gross profit divided by revenue?', answer: 'YES', explanation: 'It measures profitability after direct costs.' },
  { num: 164, topic: 'NETMARGIN', category: 'EARNINGS', question: 'Is net profit margin calculated by dividing net income by revenue?', answer: 'YES', explanation: 'It measures the share of revenue retained as profit.' },
  { num: 165, topic: 'ROE', category: 'RISK', question: 'Does a higher ROE always indicate a better-performing company?', answer: 'NO', explanation: 'High debt can artificially increase ROE.' },
  { num: 166, topic: 'WC', category: 'EARNINGS', question: 'Is working capital calculated as current assets minus current liabilities?', answer: 'YES', explanation: 'It measures short-term financial resources.' },
  { num: 167, topic: 'PEG', category: 'EARNINGS', question: 'Does the PEG ratio incorporate expected earnings growth into valuation?', answer: 'YES', explanation: 'It relates P/E to earnings growth.' },
  { num: 168, topic: 'EV', category: 'DEAL', question: 'Is enterprise value calculated using market capitalization, debt and cash adjustments?', answer: 'YES', explanation: 'It estimates the value of the entire business.' },
  { num: 169, topic: 'P/E', category: 'EARNINGS', question: 'Does a negative P/E ratio generally indicate negative earnings?', answer: 'YES', explanation: 'Negative earnings can produce a negative ratio.' },
  { num: 170, topic: 'CAPEX', category: 'ENERGY', question: 'Is capital expenditure commonly abbreviated as CAPEX?', answer: 'YES', explanation: 'It refers to spending on long-term assets.' },

  // 18. Financial markets & institutions (171-180)
  { num: 171, topic: 'SP500', category: 'MACRO', question: 'Is the S&P 500 an index of approximately 500 leading US companies?', answer: 'YES', explanation: 'It tracks a broad selection of large US companies.' },
  { num: 172, topic: 'NDX100', category: 'AI TECH', question: 'Is the Nasdaq-100 heavily weighted toward technology and growth companies?', answer: 'YES', explanation: 'It has substantial exposure to these sectors.' },
  { num: 173, topic: 'DOW', category: 'MACRO', question: 'Is the Dow Jones Industrial Average a price-weighted index?', answer: 'YES', explanation: 'Higher-priced components have greater influence.' },
  { num: 174, topic: 'VIX', category: 'RISK', question: 'Does the VIX measure expected stock market volatility?', answer: 'YES', explanation: 'It reflects implied volatility from S&P 500 options.' },
  { num: 175, topic: 'NYSE', category: 'MACRO', question: "Is the NYSE one of the world's major stock exchanges?", answer: 'YES', explanation: 'It is a major US securities exchange.' },
  { num: 176, topic: 'SEC', category: 'MACRO', question: 'Does the SEC regulate US securities markets?', answer: 'YES', explanation: 'It oversees securities markets and disclosures.' },
  { num: 177, topic: 'BROKER', category: 'DEAL', question: 'Is a brokerage firm an intermediary between investors and financial markets?', answer: 'YES', explanation: 'Brokers facilitate securities transactions.' },
  { num: 178, topic: 'CLEARING', category: 'RISK', question: 'Does a clearinghouse help manage counterparty risk in financial transactions?', answer: 'YES', explanation: 'It facilitates clearing and settlement.' },
  { num: 179, topic: 'INDEX', category: 'MACRO', question: 'Is an index fund required to outperform its benchmark?', answer: 'NO', explanation: 'Its objective is generally to track the benchmark.' },
  { num: 180, topic: 'ETRADE', category: 'AI TECH', question: 'Can stock markets operate through electronic trading systems?', answer: 'YES', explanation: 'Electronic platforms match orders.' },

  // 19. Investment strategies (181-190)
  { num: 181, topic: 'DCA', category: 'MACRO', question: 'Does dollar-cost averaging involve investing fixed amounts at regular intervals?', answer: 'YES', explanation: 'It spreads purchases over time.' },
  { num: 182, topic: 'VALUE', category: 'EARNINGS', question: 'Is value investing focused on buying securities believed to be undervalued?', answer: 'YES', explanation: 'It seeks a discount to estimated intrinsic value.' },
  { num: 183, topic: 'GROWTH', category: 'AI TECH', question: 'Is growth investing focused on companies with strong growth potential?', answer: 'YES', explanation: 'It emphasizes future earnings or revenue expansion.' },
  { num: 184, topic: 'MOMENTUM', category: 'AI TECH', question: 'Does momentum investing focus on assets with strong recent price trends?', answer: 'YES', explanation: 'It seeks to benefit from price persistence.' },
  { num: 185, topic: 'ARB', category: 'DEAL', question: 'Is arbitrage based on exploiting price differences between markets or instruments?', answer: 'YES', explanation: 'It seeks to capture pricing discrepancies.' },
  { num: 186, topic: 'HEDGE', category: 'RISK', question: 'Does hedging aim to reduce exposure to financial risk?', answer: 'YES', explanation: 'It offsets potential adverse movements.' },
  { num: 187, topic: 'DIVERSIFY', category: 'RISK', question: 'Is portfolio diversification the same as investing exclusively in stocks?', answer: 'NO', explanation: 'Diversification can include multiple asset classes.' },
  { num: 188, topic: 'DRIP', category: 'EARNINGS', question: 'Can reinvested dividends purchase additional shares?', answer: 'YES', explanation: 'Dividend reinvestment increases share holdings.' },
  { num: 189, topic: 'PASSIVE', category: 'MACRO', question: 'Is passive investing generally associated with minimizing active trading decisions?', answer: 'YES', explanation: 'It often follows predefined market benchmarks.' },
  { num: 190, topic: 'ACTIVE', category: 'EARNINGS', question: 'Does active investing attempt to outperform a benchmark?', answer: 'YES', explanation: 'Active managers select investments to seek excess returns.' },

  // 20. Advanced financial knowledge (191-200)
  { num: 191, topic: '10-K', category: 'EARNINGS', question: 'Is an SEC 10-K an annual financial filing for US public companies?', answer: 'YES', explanation: 'It contains detailed annual disclosures.' },
  { num: 192, topic: '10-Q', category: 'EARNINGS', question: 'Is an SEC 10-Q a quarterly financial filing?', answer: 'YES', explanation: 'It provides quarterly company information.' },
  { num: 193, topic: '8-K', category: 'DEAL', question: 'Is an SEC 8-K used to report certain significant corporate events?', answer: 'YES', explanation: 'It reports material current events.' },
  { num: 194, topic: 'INSIDER', category: 'DEAL', question: 'Does insider ownership refer to shares held by company insiders?', answer: 'YES', explanation: 'It measures ownership by executives, directors and other insiders.' },
  { num: 195, topic: '13F', category: 'DEAL', question: 'Is a 13F filing used to disclose certain institutional investment holdings?', answer: 'YES', explanation: "It reports qualifying investment managers' holdings." },
  { num: 196, topic: 'FISCAL', category: 'EARNINGS', question: "Does a company's fiscal year always have to end on December 31?", answer: 'NO', explanation: 'Companies can use different fiscal year-ends.' },
  { num: 197, topic: 'IMPAIR', category: 'EARNINGS', question: "Is goodwill impairment recognized when goodwill's carrying value exceeds its recoverable amount under applicable accounting rules?", answer: 'YES', explanation: 'Impairment recognizes a reduction in value.' },
  { num: 198, topic: 'CONVBOND', category: 'DEAL', question: 'Can a company issue convertible bonds that can be converted into shares?', answer: 'YES', explanation: 'They combine debt with an equity conversion feature.' },
  { num: 199, topic: 'COE', category: 'EARNINGS', question: 'Does the cost of equity represent the return shareholders require for investing in a company?', answer: 'YES', explanation: 'It represents the required return on equity.' },
  { num: 200, topic: 'WACC', category: 'DEAL', question: 'Is WACC the abbreviation for Weighted Average Cost of Capital?', answer: 'YES', explanation: 'It measures the weighted cost of financing.' },
];

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

export function shuffleQueries<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const DEFAULT_SNAPSHOT_QUOTES: LiveStockQuote[] = [
  {
    symbol: 'NVDA',
    price: 145.2,
    prevClose: 139.82,
    dayHigh: 146.1,
    dayLow: 139.6,
    volume: 48200000,
    changePct: 3.85,
    candles: [
      { open: 135, close: 137.4, high: 138, low: 134.5, bull: true },
      { open: 137.4, close: 136.8, high: 138.2, low: 136, bull: false },
      { open: 136.8, close: 139.8, high: 140.5, low: 136.4, bull: true },
      { open: 139.8, close: 142.6, high: 143.1, low: 139.2, bull: true },
      { open: 142.6, close: 145.2, high: 146.1, low: 139.6, bull: true },
    ],
  },
  {
    symbol: 'SPY',
    price: 598.4,
    prevClose: 591.4,
    dayHigh: 599.1,
    dayLow: 592.8,
    volume: 52100000,
    changePct: 1.18,
    candles: [
      { open: 588, close: 589.5, high: 590.2, low: 587.1, bull: true },
      { open: 589.5, close: 591.2, high: 592, low: 589, bull: true },
      { open: 591.2, close: 590.4, high: 592.5, low: 589.8, bull: false },
      { open: 590.4, close: 591.4, high: 593, low: 590, bull: true },
      { open: 591.4, close: 598.4, high: 599.1, low: 592.8, bull: true },
    ],
  },
  {
    symbol: 'TSLA',
    price: 248.1,
    prevClose: 256.88,
    dayHigh: 256.2,
    dayLow: 246.9,
    volume: 61700000,
    changePct: -3.42,
    candles: [
      { open: 263, close: 260.5, high: 264, low: 259, bull: false },
      { open: 260.5, close: 258.2, high: 261, low: 257.1, bull: false },
      { open: 258.2, close: 259.4, high: 260, low: 256.5, bull: true },
      { open: 259.4, close: 256.88, high: 259.8, low: 254.9, bull: false },
      { open: 256.88, close: 248.1, high: 256.2, low: 246.9, bull: false },
    ],
  },
  {
    symbol: 'BTC',
    price: 94800,
    prevClose: 91020,
    dayHigh: 95250,
    dayLow: 90900,
    volume: 38400000,
    changePct: 4.15,
    candles: [
      { open: 88200, close: 89400, high: 89900, low: 87900, bull: true },
      { open: 89400, close: 90100, high: 90600, low: 89100, bull: true },
      { open: 90100, close: 89700, high: 90800, low: 89300, bull: false },
      { open: 89700, close: 91020, high: 91500, low: 89500, bull: true },
      { open: 91020, close: 94800, high: 95250, low: 90900, bull: true },
    ],
  },
  {
    symbol: 'AAPL',
    price: 238.1,
    prevClose: 234.26,
    dayHigh: 238.9,
    dayLow: 234.0,
    volume: 41000000,
    changePct: 1.64,
    candles: [
      { open: 231, close: 232.5, high: 233, low: 230.5, bull: true },
      { open: 232.5, close: 233.1, high: 234, low: 232, bull: true },
      { open: 233.1, close: 232.8, high: 234.2, low: 232.1, bull: false },
      { open: 232.8, close: 234.26, high: 235, low: 232.6, bull: true },
      { open: 234.26, close: 238.1, high: 238.9, low: 234, bull: true },
    ],
  },
  {
    symbol: 'AMD',
    price: 141.6,
    prevClose: 145.45,
    dayHigh: 145.1,
    dayLow: 140.8,
    volume: 33900000,
    changePct: -2.65,
    candles: [
      { open: 150, close: 148.5, high: 151, low: 147.8, bull: false },
      { open: 148.5, close: 147.2, high: 149, low: 146.5, bull: false },
      { open: 147.2, close: 148.1, high: 148.9, low: 146.1, bull: true },
      { open: 148.1, close: 145.45, high: 148.4, low: 144.8, bull: false },
      { open: 145.45, close: 141.6, high: 145.1, low: 140.8, bull: false },
    ],
  },
];

function findMatchingQuote(
  entry: BabankQuestionEntry,
  quotes: LiveStockQuote[]
): LiveStockQuote {
  if (entry.category === 'CRYPTO') {
    const btc = quotes.find((q) => q.symbol === 'BTC');
    if (btc) return btc;
  }
  if (entry.category === 'MACRO') {
    const macroPool = quotes.filter((q) => q.symbol === 'SPY' || q.symbol === 'AAPL' || q.symbol === 'MSFT');
    if (macroPool.length > 0) {
      return macroPool[Math.floor(Math.random() * macroPool.length)];
    }
  }
  if (entry.category === 'AI TECH') {
    const techPool = quotes.filter((q) =>
      ['NVDA', 'AMD', 'MSFT', 'GOOGL', 'META', 'AAPL'].includes(q.symbol)
    );
    if (techPool.length > 0) {
      return techPool[Math.floor(Math.random() * techPool.length)];
    }
  }
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function buildQueriesFromMarketData(
  quotes: LiveStockQuote[],
  source: 'live' | 'snapshot' = 'live'
): MarketQuery[] {
  const safeQuotes = quotes.length > 0 ? quotes : DEFAULT_SNAPSHOT_QUOTES;
  const randomizedBank = shuffleQueries(BABANK_QUESTION_BANK);

  return randomizedBank.map((entry) => {
    const quote = findMatchingQuote(entry, safeQuotes);
    const priceStr = formatPrice(quote.symbol, quote.price);
    const pctStr = formatPct(quote.changePct);
    const reward = 8 + ((entry.num * 3 + Math.round(Math.abs(quote.changePct))) % 9);
    const isYes = entry.answer === 'YES';

    return {
      id: `babank_q${entry.num}_${quote.symbol}`,
      ticker: `${quote.symbol} · ${entry.topic}`,
      price: priceStr,
      change: pctStr,
      category: entry.category,
      headline: `${quote.symbol} ${priceStr} (${pctStr}) · ${entry.topic}`,
      question: entry.question,
      chartTrend: quote.changePct >= 0.4 ? 'bull' : quote.changePct <= -0.4 ? 'bear' : 'volatile',
      candles: quote.candles,
      marketSource: source,
      leftLabel: 'TRUE (YES)',
      rightLabel: 'FALSE (NO)',
      correctSide: isYes ? 'left' : 'right',
      profit: reward,
      successReason: `Correct! ${entry.explanation} +$${reward}!`,
      deathReason: `Wrong Tunnel! Answer is ${entry.answer} — ${entry.explanation}`,
    };
  });
}

// Baseline full Babank Yes/No bank paired with market snapshot quotes
export const MARKET_QUERIES: MarketQuery[] = buildQueriesFromMarketData(
  DEFAULT_SNAPSHOT_QUOTES,
  'snapshot'
);

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
        queries: buildQueriesFromMarketData(data.quotes, 'live'),
        source: 'live',
      };
    }
  } catch {
    // Fallback cleanly to built-in question bank + market snapshot
  }
  return { queries: MARKET_QUERIES, source: 'snapshot' };
}
