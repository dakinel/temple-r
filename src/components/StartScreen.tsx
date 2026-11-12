import React from 'react';
import { Play, Trophy, Users, TrendingUp, MousePointer, ArrowLeftRight } from 'lucide-react';
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
    <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden">
        {/* Ticker tape micro watermark border */}
        <div className="absolute top-2.5 left-4 right-4 flex items-center justify-between text-[10px] font-mono font-bold text-emerald-400/40 tracking-wider">
          <span>NVDA ▲ +4.8%</span>
          <span>BTC ▲ +6.2%</span>
          <span>SPY ▲ +0.9%</span>
          <span>WALL STREET OPEN</span>
        </div>

        {/* Bull Market Trophy Badge */}
        <div className="w-16 h-16 mx-auto mt-4 mb-2.5 rounded-full bg-linear-to-b from-emerald-400 to-teal-700 p-1 shadow-xl flex items-center justify-center border-2 border-emerald-300">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase mb-0.5 drop-shadow">
          WALL STREET RUNNER
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-emerald-400 tracking-wide uppercase mb-3">
          Live Decision Screen · Steer Left for YES · Steer Right for NO
        </p>

        {/* Best Profit Record */}
        {highScore > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold mb-4 shadow">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>RECORD PORTFOLIO: ${highScore.toLocaleString()}</span>
          </div>
        )}

        {/* Active Trader Profile Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 mb-4 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-emerald-500/60 overflow-hidden shrink-0 shadow-md">
              <img
                src={avatarUrl}
                alt={adventurer.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  PORTFOLIO TRADER
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  DiceBear
                </span>
              </div>
              <h3 className="font-black text-white text-base tracking-wide truncate">
                {adventurer.name}
              </h3>
              <p className="text-[11px] text-teal-300 font-semibold truncate">
                {adventurer.perk}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAdventurerSelect}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Switch Face</span>
          </button>
        </div>

        {/* Simplified Controls Showcase */}
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-3.5 mb-5 text-left">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MousePointer className="w-3.5 h-3.5" />
            <span>Interactive Decision Controls</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-start gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Scroll / Move Left or Right</div>
                <div className="text-[11px] text-emerald-300">
                  <span className="font-bold text-emerald-400">◄ LEFT = YES</span> · <span className="font-bold text-rose-400">RIGHT = NO ►</span>
                </div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-start gap-2">
              <MousePointer className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Tap / Click Anywhere</div>
                <div className="text-[11px] text-slate-400">Jump over corridor obstacles</div>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Steer into Left or Right tunnel to execute trade</span>
            <span className="text-emerald-400 font-mono font-bold">A/D, Wheel or Swipe</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartGame}
          className="w-full py-3.5 px-6 bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg tracking-widest rounded-2xl transition duration-150 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 uppercase cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>ENTER TRADING CORRIDOR</span>
        </button>
      </div>
    </div>
  );
};
