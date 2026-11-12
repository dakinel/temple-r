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
  CornerUpLeft,
  CornerUpRight,
  ChevronDown,
  ChevronUp,
  Shield,
  Magnet,
  Zap,
  Camera,
} from 'lucide-react';
import { sound } from '../game/audio';
import { AdventurerProfile, getDiceBearAvatarUrl } from '../game/adventurers';

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
  onOpenAdventurerSelect,
  onToggleCamera,
  onPauseToggle,
  onRestart,
  onTurnLeft,
  onTurnRight,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
}) => {
  const [isMuted, setIsMuted] = useState(!sound.enabled);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  const handleToggleMute = () => {
    const enabled = sound.toggleMute();
    setIsMuted(!enabled);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto pointer-events-auto gap-2">
        <div className="flex items-center gap-2">
          {/* Adventurer Face & Name Badge */}
          <button
            onClick={onOpenAdventurerSelect}
            className="bg-stone-900/85 hover:bg-stone-800/90 border border-amber-600/50 rounded-xl p-1.5 pr-2.5 shadow-lg flex items-center gap-2 transition group cursor-pointer"
            title="Click to Switch Adventurer Face"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-950 border border-amber-500/60 overflow-hidden shrink-0">
              <img
                src={getDiceBearAvatarUrl(adventurer.seed)}
                alt={adventurer.name}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-150"
              />
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-[10px] font-black text-amber-400 tracking-wider uppercase truncate max-w-[85px]">
                {adventurer.name}
              </span>
              <span className="text-[9px] text-stone-400 truncate max-w-[85px]">
                {adventurer.perk}
              </span>
            </div>
          </button>

          {/* Score & Multiplier */}
          <div className="bg-stone-900/80 border border-amber-600/40 rounded-xl px-3 sm:px-4 py-2 shadow-lg backdrop-blur-none flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-400">Score</span>
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="h-8 w-px bg-stone-700 mx-1" />
          <div className="flex flex-col">
            <span className="text-[10px] tracking-widest uppercase font-semibold text-emerald-400">Meters</span>
            <span className="text-xl font-black text-emerald-200 font-mono">
              {distance}m
            </span>
          </div>
        </div>
      </div>

        {/* Center: Active Powerup Banner */}
        {powerupMessage && (
          <div className="bg-amber-500 text-stone-950 font-bold px-4 py-1.5 rounded-full shadow-lg border border-amber-300 text-xs tracking-wider uppercase animate-bounce flex items-center gap-2">
            <Zap className="w-4 h-4 text-stone-950 fill-stone-950" />
            <span>{powerupMessage}</span>
          </div>
        )}

        {/* Coins & Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Active Powerup Badges */}
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

          {/* Coins Display */}
          <div className="bg-stone-900/80 border border-amber-500/50 rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-lg">
            <div className="w-5 h-5 rounded-full bg-amber-400 border border-amber-200 flex items-center justify-center text-stone-950 font-bold text-xs shadow-inner">
              $
            </div>
            <span className="text-xl font-black text-amber-300 font-mono">
              {coins}
            </span>
          </div>

          {/* Camera View Toggle */}
          <button
            onClick={onToggleCamera}
            className={`p-2.5 rounded-xl border transition active:scale-95 flex items-center gap-1 ${
              cameraMode === 'front'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-stone-900/80 border-stone-700 text-stone-200 hover:text-white hover:bg-stone-800'
            }`}
            title={`Camera View: ${cameraMode.toUpperCase()} (Press C to switch)`}
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Mute button */}
          <button
            onClick={handleToggleMute}
            className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-200 hover:text-white hover:bg-stone-800 transition active:scale-95"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Pause button */}
          <button
            onClick={onPauseToggle}
            className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-200 hover:text-white hover:bg-stone-800 transition active:scale-95"
            title={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5" />}
          </button>

          {/* Quick Restart */}
          <button
            onClick={onRestart}
            className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-200 hover:text-white hover:bg-stone-800 transition active:scale-95"
            title="Restart Run"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Paused Overlay */}
      {isPaused && (
        <div className="self-center my-auto pointer-events-auto bg-stone-950/90 border-2 border-amber-600 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <h2 className="text-2xl font-black text-amber-400 uppercase tracking-widest mb-2">Game Paused</h2>
          <p className="text-stone-300 text-sm mb-6">The ancient spider lurks behind you...</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onPauseToggle}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl tracking-wider transition uppercase shadow-lg"
            >
              Resume Run
            </button>
            <button
              onClick={onRestart}
              className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-xl tracking-wider transition uppercase"
            >
              Restart
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Ergonomic Bottom Control Dock */}
      <div className="w-full max-w-3xl mx-auto pointer-events-auto transition-transform duration-300 flex flex-col items-center">
        {/* Collapse / Expand Toggle Tab */}
        <button
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
          className="bg-stone-900/90 border border-stone-700/80 border-b-0 text-stone-400 hover:text-amber-300 px-4 py-1.5 rounded-t-xl text-xs font-medium flex items-center gap-1.5 transition shadow"
        >
          {isControlsCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Show Controls & Touch D-Pad
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Hide Controls (Zen Mode)
            </>
          )}
        </button>

        {!isControlsCollapsed && (
          <div className="w-full bg-stone-950/85 border border-stone-800 rounded-2xl p-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* 90-Degree Turn Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider hidden sm:inline mr-1">Turns:</span>
              <button
                onClick={onTurnLeft}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/60 text-amber-200 active:scale-95 transition font-bold text-sm shadow"
              >
                <CornerUpLeft className="w-5 h-5 text-amber-400" />
                <span>Turn Left (90°)</span>
              </button>
              <button
                onClick={onTurnRight}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/60 text-amber-200 active:scale-95 transition font-bold text-sm shadow"
              >
                <span>Turn Right (90°)</span>
                <CornerUpRight className="w-5 h-5 text-amber-400" />
              </button>
            </div>

            {/* Movement & Action D-Pad */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider hidden sm:inline mr-1">Actions:</span>
              <button
                onClick={onMoveLeft}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 active:scale-95 transition"
                title="Lane Left (Left Arrow or A)"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={onJump}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-emerald-700/40 hover:bg-emerald-700/60 border border-emerald-500/60 text-emerald-200 active:scale-95 transition font-bold text-xs"
                title="Jump Over Obstacle (Up Arrow / W / Space)"
              >
                <ArrowUp className="w-4 h-4 text-emerald-400" />
                <span>Jump</span>
              </button>
              <button
                onClick={onSlide}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-rose-700/40 hover:bg-rose-700/60 border border-rose-500/60 text-rose-200 active:scale-95 transition font-bold text-xs"
                title="Slide Under Arch (Down Arrow / S)"
              >
                <ArrowDown className="w-4 h-4 text-rose-400" />
                <span>Slide</span>
              </button>
              <button
                onClick={onMoveRight}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 active:scale-95 transition"
                title="Lane Right (Right Arrow or D)"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Keyboard shortcut guide badge */}
            <div className="hidden lg:flex flex-col text-[10px] text-stone-400 text-right leading-tight">
              <span>Keys: <b className="text-amber-300">A / D</b> = Lane Shift</span>
              <span><b className="text-amber-300">Left / Right Arrows</b> = 90° Turn</span>
              <span><b className="text-emerald-300">Space / Up</b> = Jump | <b className="text-rose-300">Down / S</b> = Slide</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
