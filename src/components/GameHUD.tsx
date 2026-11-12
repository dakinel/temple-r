import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Magnet,
  Zap,
  Camera,
  Users,
} from 'lucide-react';
import { sound } from '../game/audio';
import { AdventurerProfile, getDiceBearAvatarUrl } from '../game/adventurers';
import { MarketQuery } from '../game/queries';
import { TradingScreen } from './TradingScreen';

interface GameHUDProps {
  score: number;
  coins: number;
  distance: number;
  isPaused: boolean;
  powerupMessage: string | null;
  hasShield: boolean;
  hasMagnet: boolean;
  cameraMode: string;
  adventurer: AdventurerProfile;
  // Stock Market Query Screen Props
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
  tradeHistory: Array<{
    ticker: string;
    action: string;
    profit: number;
  }>;
  onChooseYes: () => void;
  onChooseNo: () => void;
  // Handlers
  onOpenAdventurerSelect: () => void;
  onToggleCamera: () => void;
  onPauseToggle: () => void;
  onRestart: () => void;
  onTurnLeft: () => void;
  onTurnRight: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  coins,
  distance,
  isPaused,
  powerupMessage,
  hasShield,
  hasMagnet,
  cameraMode,
  adventurer,
  currentQuery,
  portfolioValue,
  startingCapital,
  streak,
  currentLaneX,
  decisionFeedback,
  tradeHistory,
  onOpenAdventurerSelect,
  onToggleCamera,
  onPauseToggle,
  onRestart,
}) => {
  const [isMuted, setIsMuted] = useState(!sound.enabled);

  const handleToggleMute = () => {
    const enabled = sound.toggleMute();
    setIsMuted(!enabled);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-2 sm:p-4">
      {/* Top Docked Bar: Distance + Sleek Top Query Table + Bullion & Pause */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-1 pointer-events-auto">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Run Distance Indicator */}
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-amber-500/40 rounded-xl px-3 py-1.5 shadow-xl shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
              RUN
            </span>
            <span className="text-base sm:text-lg font-black text-white font-mono tabular-nums">
              {distance}m
            </span>
          </div>

          {/* Center: Top Docked Minimal Query Table */}
          <div className="flex-1 max-w-2xl mx-auto">
            <TradingScreen
              currentQuery={currentQuery}
              portfolioValue={portfolioValue}
              startingCapital={startingCapital}
              streak={streak}
              currentLaneX={currentLaneX}
              decisionFeedback={decisionFeedback}
              tradeHistory={tradeHistory}
            />
          </div>

          {/* Right: Bullion & Pause Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasShield && (
              <div className="bg-blue-600/80 border border-blue-400 text-white p-1.5 rounded-xl shadow">
                <Shield className="w-3.5 h-3.5 text-blue-200" />
              </div>
            )}
            {hasMagnet && (
              <div className="bg-purple-600/80 border border-purple-400 text-white p-1.5 rounded-xl shadow">
                <Magnet className="w-3.5 h-3.5 text-purple-200" />
              </div>
            )}

            {/* Bullion ($) Display */}
            <div className="bg-slate-950/80 backdrop-blur-md border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-xl">
              <div className="w-4 h-4 rounded-full bg-amber-400 border border-amber-200 flex items-center justify-center text-slate-950 font-black text-[10px] shadow-inner">
                $
              </div>
              <span className="text-base sm:text-lg font-black text-amber-300 font-mono tabular-nums">
                {coins}
              </span>
            </div>

            {/* Quick Pause */}
            <button
              onClick={onPauseToggle}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition backdrop-blur-md shadow-xl cursor-pointer"
              title="Pause Run (P or Esc)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Powerup Banner (centered underneath if active) */}
        {powerupMessage && (
          <div className="self-center bg-emerald-500/90 backdrop-blur-md text-slate-950 font-bold px-3.5 py-1 rounded-full shadow-lg border border-emerald-300 text-xs tracking-wider uppercase animate-bounce flex items-center gap-1.5 mt-1">
            <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
            <span>{powerupMessage}</span>
          </div>
        )}
      </div>

      {/* Center Paused Overlay Menu */}
      {isPaused && (
        <div className="self-center my-auto pointer-events-auto bg-slate-950/95 backdrop-blur-md border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl z-30">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-950/60 border border-amber-400/50 flex items-center justify-center">
            <Pause className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">Tomb Halted</h2>
          <p className="text-slate-400 text-xs mb-5">Egyptian Temple Runner Paused</p>

          {/* Active Runner Display */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-amber-400/60 overflow-hidden shrink-0">
                <img
                  src={getDiceBearAvatarUrl(adventurer.seed)}
                  alt={adventurer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  {adventurer.name}
                </div>
                <div className="text-[10px] text-amber-400 font-medium">
                  {adventurer.perk}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onOpenAdventurerSelect();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Change</span>
            </button>
          </div>

          {/* Quick Settings: Camera & Sound */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={onToggleCamera}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
              title="Toggle Camera View (Key C)"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span className="capitalize">{cameraMode} Cam</span>
            </button>
            <button
              onClick={handleToggleMute}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
              title="Toggle Audio (Key M)"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span>Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>Audio On</span>
                </>
              )}
            </button>
          </div>

          {/* Controls Reminder */}
          <div className="bg-slate-900/60 rounded-xl p-2.5 mb-5 text-[11px] text-slate-400 text-left font-mono">
            <div className="text-amber-400 font-bold mb-1">EGYPTIAN TEMPLE CONTROLS:</div>
            <div>• <span className="text-white">A / D or ← / →</span>: Steer Left / Right Tomb Passage</div>
            <div>• <span className="text-white">Space / Up / Click</span>: Jump</div>
            <div>• <span className="text-white">S / Down</span>: Slide</div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onPauseToggle}
              className="w-full py-3 bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl tracking-wider transition uppercase shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Resume Run</span>
            </button>
            <button
              onClick={onRestart}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold rounded-xl tracking-wider transition uppercase flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Run</span>
            </button>
          </div>
        </div>
      )}

      {/* Intentionally completely open bottom area: NO bottom navigation buttons! */}
      <div className="w-full pointer-events-none" />
    </div>
  );
};
