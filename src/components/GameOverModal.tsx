import React, { useEffect } from 'react';
import { RotateCcw, Trophy, Home, Skull } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdventurerProfile, getDiceBearAvatarUrl } from '../game/adventurers';

interface GameOverModalProps {
  stats: {
    distance: number;
    coins: number;
    score: number;
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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#ffaa00', '#ffffff', '#e03a3e'],
      });
    }
  }, [isNewHigh]);

  const avatarUrl = getDiceBearAvatarUrl(adventurer.seed);

  return (
    <div className="absolute inset-0 z-40 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-stone-900 border-2 border-rose-600/60 rounded-3xl p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden">
        {/* Header with Adventurer Avatar Face and Skull badge */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-16 h-16 rounded-2xl bg-stone-950 border-2 border-rose-500/70 overflow-hidden shadow-lg relative">
            <img
              src={avatarUrl}
              alt={adventurer.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow">
              <Skull className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-black text-rose-400 tracking-wider uppercase mb-0.5 drop-shadow">
          CAUGHT!
        </h2>
        <p className="text-xs text-stone-400 tracking-wider uppercase mb-1 font-medium">
          {adventurer.name} was overtaken by the spider
        </p>
        <p className="text-[11px] italic text-amber-300/80 mb-4">
          &ldquo;{adventurer.quote}&rdquo;
        </p>

        {/* New High Score Banner */}
        {isNewHigh && (
          <div className="mb-4 py-2 px-4 bg-amber-500/20 border border-amber-400/80 rounded-xl text-amber-300 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>NEW ALL-TIME RECORD!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 mb-5 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-400">Total Score:</span>
            <span className="text-xl font-black text-amber-400 font-mono">
              {stats.score.toLocaleString()}
            </span>
          </div>
          <div className="h-px bg-stone-800" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-400">Distance Run:</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {stats.distance} meters
            </span>
          </div>
          <div className="h-px bg-stone-800" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-400">Coins Gathered:</span>
            <span className="text-base font-bold text-yellow-300 font-mono">
              {stats.coins}
            </span>
          </div>
          <div className="h-px bg-stone-800" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-400">Best Record:</span>
            <span className="text-xs font-semibold text-stone-300 font-mono">
              {highScore.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black tracking-wider rounded-xl transition duration-150 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 uppercase cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RUN AGAIN</span>
          </button>
          <button
            onClick={onHome}
            className="py-3 px-5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold tracking-wider rounded-xl transition flex items-center justify-center gap-2 uppercase cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
