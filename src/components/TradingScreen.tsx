import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  CheckCircle2,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { MarketQuery } from '../game/queries';

interface TradingScreenProps {
  currentQuery: MarketQuery;
  portfolioValue: number;
  startingCapital: number;
  streak: number;
  currentLaneX: number; // < -0.3 is Left (YES), > 0.3 is Right (NO)
  decisionFeedback: {
    text: string;
    profit: number;
    isYes: boolean;
  } | null;
  tradeHistory: Array<{
    ticker: string;
    action: string;
    profit: number;
  }>;
  onChooseYes: () => void;
  onChooseNo: () => void;
}

export const TradingScreen: React.FC<TradingScreenProps> = ({
  currentQuery,
  portfolioValue,
  startingCapital,
  streak,
  currentLaneX,
  decisionFeedback,
  tradeHistory,
  onChooseYes,
  onChooseNo,
}) => {
  const isLeaningYes = currentLaneX < -0.25;
  const isLeaningNo = currentLaneX > 0.25;
  const totalProfit = portfolioValue - startingCapital;
  const isNetProfit = totalProfit >= 0;

  return (
    <div className="pointer-events-auto w-full max-w-xl mx-auto transition-all duration-200">
      {/* Holographic Premium Bloomberg Glass Terminal Screen */}
      <div className="relative bg-slate-950/85 backdrop-blur-xl border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-[0_15px_60px_rgba(0,0,0,0.85)] text-slate-100 overflow-hidden">
        {/* Glow ambient highlight */}
        <div
          className={`absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl transition-opacity duration-300 pointer-events-none ${
            isLeaningYes ? 'bg-emerald-500/25 opacity-100' : 'bg-emerald-500/10 opacity-40'
          }`}
        />
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl transition-opacity duration-300 pointer-events-none ${
            isLeaningNo ? 'bg-rose-500/25 opacity-100' : 'bg-rose-500/10 opacity-40'
          }`}
        />

        {/* Top Header: Terminal Brand & Portfolio Value */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3 text-xs">
          {/* Ticker & Category */}
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-black text-xs tracking-wider">
              {currentQuery.ticker}
            </div>
            <span className="font-mono text-slate-300 text-xs font-bold">
              {currentQuery.price}
            </span>
            <span
              className={`font-mono font-bold text-[11px] ${
                currentQuery.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currentQuery.change}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:inline">
              &bull; {currentQuery.category}
            </span>
          </div>

          {/* Portfolio Live Value */}
          <div className="flex items-center gap-3">
            {streak > 1 && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                <Flame className="w-3.5 h-3.5" />
                <span>{streak}x STREAK</span>
              </div>
            )}
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Portfolio Net
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-white tabular-nums">
                ${portfolioValue.toLocaleString()}
                <span
                  className={`text-[11px] ml-1 font-bold ${
                    isNetProfit ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  ({isNetProfit ? '+' : ''}${totalProfit.toLocaleString()})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Query Body */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase mb-1 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
            <span>Market Scenario & Query</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug mb-1">
            {currentQuery.headline}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            {currentQuery.question}
          </p>
        </div>

        {/* Interactive YES / NO Gate Controls (Steer or Tap) */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          {/* LEFT: YES / BUY */}
          <button
            onClick={onChooseYes}
            className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer flex flex-col justify-between overflow-hidden ${
              isLeaningYes
                ? 'bg-emerald-500/30 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-[1.02]'
                : 'bg-slate-900/90 border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Move Left</span>
              </span>
              {isLeaningYes && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
              {currentQuery.yesAction}
            </div>
            <div className="text-[10px] text-emerald-300/80 font-mono mt-0.5">
              Potential: +${currentQuery.yesProfit.toLocaleString()}
            </div>
          </button>

          {/* RIGHT: NO / PASS */}
          <button
            onClick={onChooseNo}
            className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer flex flex-col justify-between overflow-hidden ${
              isLeaningNo
                ? 'bg-rose-500/30 border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.4)] scale-[1.02]'
                : 'bg-slate-900/90 border-slate-700/80 hover:border-rose-500/60 hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1 justify-end w-full">
                <span>Move Right</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              {isLeaningNo && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping absolute top-3.5 left-3.5" />
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-white tracking-wide uppercase text-right">
              {currentQuery.noAction}
            </div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5 text-right">
              {currentQuery.noProfit >= 0 ? `+` : ``}${currentQuery.noProfit.toLocaleString()}
            </div>
          </button>
        </div>

        {/* Live Steering Hint Banner */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
          <span>Scroll Left or Key A to choose YES</span>
          <span>Scroll Right or Key D to choose NO</span>
        </div>

        {/* Real-time Decision Toast Feedback */}
        {decisionFeedback && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  decisionFeedback.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              />
              <span className="text-xs text-white truncate font-medium">
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
        )}

        {/* Recent Trades Bar */}
        {tradeHistory.length > 0 && !decisionFeedback && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-400 overflow-hidden">
            <span className="text-slate-500 uppercase tracking-wider shrink-0">Recent:</span>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              {tradeHistory.slice(-2).map((trade, idx) => (
                <div key={idx} className="flex items-center gap-1 font-mono shrink-0">
                  <span className="text-slate-300">{trade.ticker}</span>
                  <span
                    className={trade.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}
                  >
                    {trade.profit >= 0 ? '+' : ''}${trade.profit.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
