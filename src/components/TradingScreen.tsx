import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { MarketQuery } from '../game/queries';

interface TradingScreenProps {
  currentQuery: MarketQuery;
  portfolioValue: number;
  startingCapital: number;
  streak: number;
  currentLaneX: number;
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
  streak,
  decisionFeedback,
}) => {
  const isUp = !currentQuery.change.startsWith('-');

  return (
    <div className="pointer-events-auto w-full max-w-2xl mx-auto">
      <div className="bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-xl text-slate-100">
        {decisionFeedback ? (
          <div className="flex items-center justify-between gap-3 py-0.5">
            <div className="flex items-center gap-2 min-w-0">
              {decisionFeedback.profit >= 0 ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              )}
              <span className="text-sm sm:text-lg font-bold text-white truncate">
                {decisionFeedback.text}
              </span>
            </div>
            <span
              className={`font-mono tabular-nums text-sm sm:text-lg font-black shrink-0 ${
                decisionFeedback.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {decisionFeedback.profit >= 0 ? '+' : ''}${decisionFeedback.profit.toLocaleString()}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {/* Minimal Metadata Row */}
            <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-mono tabular-nums">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-black text-white tracking-wide">
                  {currentQuery.ticker}
                </span>
                <span className="text-slate-300 font-semibold">
                  {currentQuery.price}
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className={isUp ? 'font-bold text-emerald-400' : 'font-bold text-rose-400'}>
                  {currentQuery.change}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {streak > 1 && (
                  <>
                    <span className="font-bold text-amber-400">{streak}x</span>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                  </>
                )}
                <span className="font-bold text-amber-300">
                  +${currentQuery.profit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Minimal Bigger Query Text */}
            <p className="text-base sm:text-xl font-bold text-white leading-snug tracking-tight">
              {currentQuery.question}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
