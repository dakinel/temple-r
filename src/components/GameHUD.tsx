import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Shield,
  Magnet,
  Zap,
  Camera,
} from 'lucide-react';
import { sound } from '../game/audio';
import { AdventurerProfile, getDiceBearAvatarUrl } from '../game/adventurers';
import { TradingScreen } from './TradingScreen';
import { MarketQuery } from '../game/queries';

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
  score,
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
  onChooseYes,
  onChooseNo,
  onOpenAdventurerSelect,
  onToggleCamera,
  onPauseToggle,
  onRestart,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
}) => {
  const [isMuted, setIsMuted] = useState(!sound.enabled);

  const handleToggleMute = () => {
    const enabled = sound.toggleMute();
    setIsMuted(!enabled);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-4">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto pointer-events-auto gap-2">
        <div className="flex items-center gap-2">
          {/* Active Runner Avatar */}
          <button
            onClick={onOpenAdventurerSelect}
            className="bg-slate-900/90 hover:bg-slate-800/90 border border-emerald-500/50 rounded-xl p-1.5 pr-2.5 shadow-lg flex items-center gap-2 transition group cursor-pointer"
            title="Switch Trader Avatar"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-950 border border-emerald-400/60 overflow-hidden shrink-0">
              <img
                src={getDiceBearAvatarUrl(adventurer.seed)}
                alt={adventurer.name}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-150"
              />
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-[10px] font-black text-emerald-400 tracking-wider uppercase truncate max-w-[85px]">
                {adventurer.name}
              </span>
              <span className="text-[9px] text-slate-400 truncate max-w-[85px]">
                {adventurer.perk}
              </span>
            </div>
          </button>

          {/* Distance Indicator */}
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl px-3 sm:px-4 py-2 shadow-lg flex items-center gap-2">
            <span className="text-[10px] tracking-widest uppercase font-semibold text-emerald-400">
              Run
            </span>
            <span className="text-base sm:text-lg font-black text-white font-mono tabular-nums">
              {distance}m
            </span>
          </div>
        </div>

        {/* Center: Active Powerup Banner */}
        {powerupMessage && (
          <div className="bg-emerald-500 text-slate-950 font-bold px-4 py-1.5 rounded-full shadow-lg border border-emerald-300 text-xs tracking-wider uppercase animate-bounce flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>{powerupMessage}</span>
          </div>
        )}

        {/* Coins & Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {hasShield && (
            <div className="bg-blue-600/90 border border-blue-400 text-white p-2 rounded-xl shadow flex items-center gap-1">
              <Shield className="w-4 h-4 text-blue-200" />
            </div>
          )}
          {hasMagnet && (
            <div className="bg-purple-600/90 border border-purple-400 text-white p-2 rounded-xl shadow flex items-center gap-1">
              <Magnet className="w-4 h-4 text-purple-200" />
            </div>
          )}

          {/* Bullion / Coins Display */}
          <div className="bg-slate-900/90 border border-amber-500/50 rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-lg">
            <div className="w-5 h-5 rounded-full bg-amber-400 border border-amber-200 flex items-center justify-center text-slate-950 font-black text-xs shadow-inner">
              $
            </div>
            <span className="text-base sm:text-lg font-black text-amber-300 font-mono tabular-nums">
              {coins}
            </span>
          </div>

          {/* Camera View Toggle */}
          <button
            onClick={onToggleCamera}
            className={`p-2 sm:p-2.5 rounded-xl border transition active:scale-95 flex items-center gap-1 cursor-pointer ${
              cameraMode === 'front'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800'
            }`}
            title={`Camera: ${cameraMode.toUpperCase()} (Key C)`}
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Mute button */}
          <button
            onClick={handleToggleMute}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Pause button */}
          <button
            onClick={onPauseToggle}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Quick Restart */}
          <button
            onClick={onRestart}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            title="Restart Run"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Feature: In-Front Floating Screen with Stock Market Queries */}
      <div className="w-full flex justify-center my-auto px-2 pointer-events-auto z-20">
        <TradingScreen
          currentQuery={currentQuery}
          portfolioValue={portfolioValue}
          startingCapital={startingCapital}
          streak={streak}
          currentLaneX={currentLaneX}
          decisionFeedback={decisionFeedback}
          tradeHistory={tradeHistory}
          onChooseYes={onChooseYes}
          onChooseNo={onChooseNo}
        />
      </div>

      {/* Center Paused Overlay */}
      {isPaused && (
        <div className="self-center my-auto pointer-events-auto bg-slate-950/95 border-2 border-emerald-500 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl z-30">
          <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-widest mb-1">Trading Halted</h2>
          <p className="text-slate-300 text-sm mb-6">Market paused. Resume when ready.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onPauseToggle}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl tracking-wider transition uppercase shadow-lg cursor-pointer"
            >
              Resume Trading
            </button>
            <button
              onClick={onRestart}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl tracking-wider transition uppercase cursor-pointer"
            >
              Restart Bull Run
            </button>
          </div>
        </div>
      )}

      {/* Sleek Floating Bottom Control Strip */}
      <div className="w-full max-w-xl mx-auto pointer-events-auto flex flex-col items-center gap-1.5">
        <div className="flex items-center justify-between w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-1.5 shadow-xl">
          <button
            onClick={onMoveLeft}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="Steer Left (YES / BUY)"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Left (YES)</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onJump}
              className="px-4 py-2 rounded-xl bg-emerald-600/50 hover:bg-emerald-600/70 border border-emerald-400/60 text-emerald-100 active:scale-95 transition flex items-center gap-1 text-xs font-black uppercase tracking-wider cursor-pointer shadow"
              title="Jump (Tap or Click Screen)"
            >
              <ArrowUp className="w-4 h-4 text-emerald-300" />
              <span>Jump</span>
            </button>
            <button
              onClick={onSlide}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 active:scale-95 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Slide"
            >
              <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Slide</span>
            </button>
          </div>
          <button
            onClick={onMoveRight}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="Steer Right (NO / PASS)"
          >
            <span>Right (NO)</span>
            <ArrowRight className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
