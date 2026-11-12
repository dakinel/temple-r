import React, { useEffect } from 'react';
import { RotateCcw, Trophy, Home, TrendingDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdventurerProfile, getDiceBearAvatarUrl } from '../game/adventurers';

interface GameOverModalProps {
  stats: {
    distance: number;
    coins: number;
    score: number;
    reason?: string;
  };
  highScore: number;
  isNewHigh: boolean;
  adventurer: AdventurerProfile;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  isNewHigh,
  adventurer,
  onPlayAgain,
  onHome,
}) => {
  useEffect(() => {
    if (isNewHigh) {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#f59e0b', '#38bdf8'],
      });
    }
  }, [isNewHigh]);

  const avatarUrl = getDiceBearAvatarUrl(adventurer.seed);

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/65 flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600/70 rounded-3xl p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden">
        {/* Header with Trader Avatar and Bear Icon */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-rose-500/70 overflow-hidden shadow-lg relative">
            <img
              src={avatarUrl}
              alt={adventurer.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-black text-rose-400 tracking-wider uppercase mb-0.5 drop-shadow">
          LIQUIDATED!
        </h2>

        {/* Fatal Decision Reason Banner */}
        {stats.reason ? (
          <div className="my-3 p-3 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-100 text-xs text-left shadow-xl">
            <div className="font-mono font-black text-[10px] text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <span>⚠ LETHAL TUNNEL SELECTION:</span>
            </div>
            <div className="leading-relaxed font-semibold">
              {stats.reason}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 tracking-wider uppercase mb-1 font-medium">
            {adventurer.name} was overtaken by the Bear Market
          </p>
        )}

        <p className="text-[11px] italic text-amber-300/80 mb-3">
          &ldquo;{adventurer.quote}&rdquo;
        </p>

        {/* New Record Banner */}
        {isNewHigh && (
          <div className="mb-4 py-2 px-4 bg-emerald-500/20 border border-emerald-400/80 rounded-xl text-emerald-300 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>NEW ALL-TIME RECORD PROFIT!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Total Score:</span>
            <span className="text-xl font-black text-emerald-400 font-mono tabular-nums">
              ${stats.score.toLocaleString()}
            </span>
          </div>
          <div className="h-px bg-slate-800" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Trading Distance:</span>
            <span className="text-base font-bold text-cyan-400 font-mono tabular-nums">
              {stats.distance} meters
            </span>
          </div>
          <div className="h-px bg-slate-800" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Coins Collected:</span>
            <span className="text-base font-bold text-amber-300 font-mono tabular-nums">
              {stats.coins}
            </span>
          </div>
          <div className="h-px bg-slate-800" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Best Score:</span>
            <span className="text-xs font-semibold text-slate-300 font-mono tabular-nums">
              ${highScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black tracking-wider rounded-xl transition duration-150 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 uppercase cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>TRADE AGAIN</span>
          </button>
          <button
            onClick={onHome}
            className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold tracking-wider rounded-xl transition flex items-center justify-center gap-2 uppercase cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
