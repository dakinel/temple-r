import React from 'react';
import { Flame, CheckCircle2 } from 'lucide-react';
import { MarketQuery } from '../game/queries';

interface TradingScreenProps {
  currentQuery: MarketQuery;
  portfolioValue: number;
  startingCapital: number;
  streak: number;
  currentLaneX: number; // < -0.35 is Left Tunnel, > 0.35 is Right Tunnel
  decisionFeedback: {
    text: string;
    profit: number;
    isYes: boolean;
  } | null;
  tradeHistory?: Array<{
    ticker: string;
    action: string;
    profit: number;
  }>;
  onChooseYes?: () => void;
  onChooseNo?: () => void;
}

export const TradingScreen: React.FC<TradingScreenProps> = ({
  currentQuery,
  portfolioValue,
  startingCapital,
  streak,
  currentLaneX,
  decisionFeedback,
}) => {
  const isLeaningLeft = currentLaneX < -0.35;
  const isLeaningRight = currentLaneX > 0.35;
  const totalProfit = portfolioValue - startingCapital;
  const isNetProfit = totalProfit >= 0;

  return (
    <div className="pointer-events-auto w-full max-w-3xl mx-auto transition-all duration-200">
      {/* Minimal Top Query Strip (Small height, no bulky nav buttons) */}
      <div className="relative bg-slate-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-xl shadow-amber-950/20 text-slate-100 flex flex-col gap-1 overflow-hidden">
        {/* Real-time Decision Toast Feedback */}
        {decisionFeedback ? (
          <div className="flex items-center justify-between py-0.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 min-w-0">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  decisionFeedback.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              />
              <span className="text-xs font-semibold text-white truncate">
                {decisionFeedback.text}
              </span>
            </div>
            <span
              className={`font-mono text-xs font-black shrink-0 ml-2 ${
                decisionFeedback.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {decisionFeedback.profit >= 0 ? '+' : ''}${decisionFeedback.profit.toLocaleString()}
            </span>
          </div>
        ) : (
          <>
            {/* Top Row: Ticker Badge, Headline, Net Profit, and Potential Stake */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-black text-[11px] tracking-wider shrink-0">
                  {currentQuery.ticker} {currentQuery.change}
                </span>
                <span className="text-white font-bold text-xs truncate">
                  {currentQuery.headline}
                </span>
              </div>

              {/* Potential Stake & Streak */}
              <div className="flex items-center gap-2 shrink-0">
                {streak > 1 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                    <Flame className="w-3 h-3" />
                    <span>{streak}x</span>
                  </span>
                )}
                <span className="font-mono text-[11px] font-black text-amber-300">
                  +${currentQuery.profit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bottom Row: Question & Left vs Right Road indicators (sleek text tags, no bulky nav buttons) */}
            <div className="flex items-center justify-between gap-2 text-[11px] font-mono border-t border-slate-800/80 pt-1">
              <span className="text-slate-300 truncate max-w-sm hidden sm:inline">
                {currentQuery.question}
              </span>

              {/* Road choices */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                {/* Left Tunnel Tag */}
                <span
                  className={`px-2 py-0.5 rounded-md transition-all duration-150 flex items-center gap-1 text-[10px] font-bold ${
                    isLeaningLeft
                      ? 'bg-emerald-500/40 text-emerald-200 border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-105'
                      : 'bg-slate-900/90 text-emerald-400/80 border border-emerald-900/60'
                  }`}
                >
                  <span>◄ Left:</span>
                  <span className="text-white truncate max-w-[110px]">
                    {currentQuery.leftLabel}
                  </span>
                </span>

                <span className="text-slate-600 text-[10px]">|</span>

                {/* Right Tunnel Tag */}
                <span
                  className={`px-2 py-0.5 rounded-md transition-all duration-150 flex items-center gap-1 text-[10px] font-bold ${
                    isLeaningRight
                      ? 'bg-rose-500/40 text-rose-200 border border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)] scale-105'
                      : 'bg-slate-900/90 text-rose-400/80 border border-rose-900/60'
                  }`}
                >
                  <span className="text-white truncate max-w-[110px]">
                    {currentQuery.rightLabel}
                  </span>
                  <span>: Right ►</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


