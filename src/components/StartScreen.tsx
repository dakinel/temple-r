import React from 'react';
import { Play, Trophy, Users, Flame, Sparkles } from 'lucide-react';
import { AdventurerProfile, getDiceBearAvatarUrl } from '../game/adventurers';

interface StartScreenProps {
  highScore: number;
  adventurer: AdventurerProfile;
  onOpenAdventurerSelect: () => void;
  onStartGame: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  highScore,
  adventurer,
  onOpenAdventurerSelect,
  onStartGame,
}) => {
  const avatarUrl = getDiceBearAvatarUrl(adventurer.seed);

  return (
    <div className="absolute inset-0 z-30 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="max-w-lg w-full bg-stone-900 border-2 border-amber-600/60 rounded-3xl p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden">
        {/* Decorative corner carvings */}
        <div className="absolute top-2 left-2 text-amber-500/30 text-xs font-mono">◆ ◈ ◆</div>
        <div className="absolute top-2 right-2 text-amber-500/30 text-xs font-mono">◆ ◈ ◆</div>

        {/* Golden Idol Badge */}
        <div className="w-16 h-16 mx-auto mb-2.5 rounded-full bg-linear-to-b from-amber-400 to-yellow-700 p-1 shadow-xl flex items-center justify-center border-2 border-amber-200">
          <div className="w-full h-full rounded-full bg-stone-900 flex items-center justify-center">
            <Flame className="w-8 h-8 text-amber-400 fill-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-amber-400 tracking-wider uppercase mb-1 drop-shadow-md">
          TEMPLE RUN 3D
        </h1>
        <p className="text-xs sm:text-sm font-medium text-amber-200/80 tracking-wide uppercase mb-3">
          Escape the Demon Spider’s Lair
        </p>

        {/* High Score Card */}
        {highScore > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold mb-4 shadow">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>BEST RECORD: {highScore.toLocaleString()} PTS</span>
          </div>
        )}

        {/* Active Adventurer Profile Card with DiceBear Avatar Face */}
        <div className="bg-stone-950/70 border border-amber-600/40 rounded-2xl p-3.5 mb-4 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-stone-900 border-2 border-amber-500/60 overflow-hidden shrink-0 shadow-md">
              <img
                src={avatarUrl}
                alt={adventurer.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  RUNNER
                </span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                  DiceBear
                </span>
              </div>
              <h3 className="font-black text-white text-base tracking-wide truncate">
                {adventurer.name}
              </h3>
              <p className="text-[11px] text-emerald-400 font-semibold truncate">
                {adventurer.perk}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAdventurerSelect}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Switch Face</span>
          </button>
        </div>

        {/* Controls Instructions Grid */}
        <div className="grid grid-cols-2 gap-2 text-left bg-stone-950/70 border border-stone-800 rounded-2xl p-3 mb-5 text-[11px] text-stone-300">
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">90° Turns</span>
            <span className="text-stone-300">Left/Right Arrow or Swipe</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Lane Shift</span>
            <span className="text-stone-300">A / D keys or Tap D-Pad</span>
          </div>
          <div className="flex flex-col gap-0.5 pt-1.5 border-t border-stone-800">
            <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Jump Over Logs</span>
            <span className="text-stone-300">Up Arrow / Space</span>
          </div>
          <div className="flex flex-col gap-0.5 pt-1.5 border-t border-stone-800">
            <span className="font-bold text-rose-400 uppercase tracking-wider text-[10px]">Slide Under Spikes</span>
            <span className="text-stone-300">Down Arrow / S</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartGame}
          className="w-full py-3.5 px-6 bg-linear-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 font-black text-lg tracking-widest rounded-2xl transition duration-150 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 uppercase cursor-pointer"
        >
          <Play className="w-5 h-5 fill-stone-950" />
          <span>START RUNNING</span>
        </button>
      </div>
    </div>
  );
};
