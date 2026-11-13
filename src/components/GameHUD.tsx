import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Shield,
  Magnet,
  Zap,
  Camera,
  Smile,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { sound } from '../game/audio';
import { CornerStatus } from '../game/characterController';
import { AdventurerProfile, getDiceBearAvatarUrl } from '../game/adventurers';
import { MarketQuery } from '../game/queries';
import { TradingScreen } from './TradingScreen';

interface GameHUDProps {
  score: number;
  coins: number;
  distance: number;
  speedMultiplier: number;
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
  cornerStatus?: CornerStatus | null;
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

const PauseChartIcon: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    className="w-14 h-14 mx-auto"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Two crisp pastel pause pillars */}
    <rect x="20" y="15" width="9" height="22" rx="2.5" fill="#F8C89C" stroke="#464558" strokeWidth="2.5" />
    <rect x="35" y="15" width="9" height="22" rx="2.5" fill="#9DE3E6" stroke="#464558" strokeWidth="2.5" />
    {/* Baseline */}
    <line x1="12" y1="37" x2="52" y2="37" stroke="#464558" strokeWidth="2.6" strokeLinecap="round" />
    {/* Stationary resting legs */}
    <path
      d="M27 37L25 47L19 47"
      stroke="#464558"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M37 37L39 47L45 47"
      stroke="#464558"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  distance,
  speedMultiplier,
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
  cornerStatus,
  onChooseYes,
  onChooseNo,
  onOpenAdventurerSelect,
  onToggleCamera,
  onPauseToggle,
  onRestart,
}) => {
  const [isMuted, setIsMuted] = useState(!sound.enabled);
  const isLeaningLeft = currentLaneX < -0.35;
  const isLeaningRight = currentLaneX > 0.35;
  const leftAction = currentQuery.leftLabel.replace(/\s*\(YES\)/i, '');
  const rightAction = currentQuery.rightLabel.replace(/\s*\(NO\)/i, '');

  const handleToggleMute = () => {
    const enabled = sound.toggleMute();
    setIsMuted(!enabled);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-2 sm:p-4">
      {/* Top Docked Bar: Distance + Sleek Top Query Table + Bullion & Pause */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-1 pointer-events-auto">
        <div className="flex items-start justify-between gap-2">
          {/* Left: Run Distance & Scroll Speed Indicator */}
          <div className="flex items-center gap-2.5 bg-slate-950/88 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-xl shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
                RUN
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono tabular-nums">
                {distance}m
              </span>
            </div>
            <div className="w-px h-4 bg-slate-700/80" />
            <span
              className={`text-xs sm:text-sm font-black font-mono tabular-nums ${
                speedMultiplier > 1.05
                  ? 'text-emerald-400'
                  : speedMultiplier < 0.95
                    ? 'text-sky-300'
                    : 'text-slate-300'
              }`}
              title="Vertical Scroll to Adjust Speed"
            >
              {speedMultiplier.toFixed(1)}x
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
            />
          </div>

          {/* Right: Bullion & Pause Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasShield && (
              <div className="bg-blue-600/85 border border-blue-400 text-white p-1.5 rounded-xl shadow">
                <Shield className="w-3.5 h-3.5 text-blue-200" />
              </div>
            )}
            {hasMagnet && (
              <div className="bg-purple-600/85 border border-purple-400 text-white p-1.5 rounded-xl shadow">
                <Magnet className="w-3.5 h-3.5 text-purple-200" />
              </div>
            )}

            {/* Dollar Score Display */}
            <div className="bg-slate-950/88 border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-xl">
              <div className="w-4 h-4 rounded-full bg-amber-400 border border-amber-200 flex items-center justify-center text-slate-950 font-black text-[10px] shadow-inner">
                $
              </div>
              <span className="text-base sm:text-lg font-black text-amber-300 font-mono tabular-nums">
                {score.toLocaleString()}
              </span>
            </div>

            {/* Quick Pause */}
            <button
              onClick={onPauseToggle}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-950/88 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow-xl cursor-pointer"
              title="Pause Run (P or Esc)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Powerup Banner */}
        {powerupMessage && (
          <div className="self-center bg-[#fcf9ee] text-[#17161d] font-bold px-4 py-1.5 rounded-full shadow-lg border border-[#efe7d8] text-xs tracking-wider uppercase flex items-center gap-1.5 mt-1">
            <Zap className="w-3.5 h-3.5 text-[#2cc48e] fill-[#35d69e]" />
            <span>{powerupMessage}</span>
          </div>
        )}

        {/* 90-Degree Corner Turn Timing Prompt */}
        {cornerStatus && (
          <div
            className={`self-center mt-1 px-4 py-1.5 rounded-full font-mono font-black tracking-wider uppercase shadow-2xl flex items-center gap-2 transition-transform ${
              cornerStatus.inTurnWindow
                ? 'bg-[#fae0c3] text-[#17161d] scale-105 text-xs sm:text-sm'
                : 'bg-[#fcf9ee]/95 text-[#3e3c4e] text-[11px] sm:text-xs'
            }`}
          >
            <span>
              {cornerStatus.turnDir === 'left'
                ? cornerStatus.inTurnWindow
                  ? '◄ TURN LEFT NOW!'
                  : `◄ LEFT IN ${Math.ceil(cornerStatus.distToPivot)}m`
                : cornerStatus.inTurnWindow
                  ? '► TURN RIGHT NOW!'
                  : `RIGHT IN ${Math.ceil(cornerStatus.distToPivot)}m ►`}
            </span>
          </div>
        )}
      </div>

      {/* Unified Minimal Cream Pause Card */}
      {isPaused && (
        <div className="fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4 pointer-events-auto animate-[crashModalIn_0.22s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="max-w-sm w-full bg-[#fcf9ee] rounded-[34px] px-7 py-8 sm:px-8 sm:py-9 shadow-[0_24px_60px_rgba(15,23,42,0.45)] text-center">
            <div className="mb-2">
              <PauseChartIcon />
            </div>

            <h2 className="text-2xl sm:text-[28px] font-black text-[#3e3c4e] tracking-[0.06em] uppercase mb-4">
              PAUSED
            </h2>

            <div className="mb-5">
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#fae0c3] text-[#2c2a35] text-xs font-extrabold tracking-wider uppercase tabular-nums">
                {distance}m · ${score.toLocaleString()}
              </span>
            </div>

            {/* Crisp White Trader Card */}
            <div className="bg-white rounded-[24px] p-4 mb-4 shadow-[0_8px_24px_rgba(62,54,36,0.06)] flex items-center gap-4 text-left">
              <div className="w-16 h-16 rounded-2xl bg-[#d6d9fa] border-2 border-[#efe7d8] overflow-hidden shrink-0">
                <img
                  src={getDiceBearAvatarUrl(adventurer.seed)}
                  alt={adventurer.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-black text-[#17161d] text-lg leading-tight truncate">
                  {adventurer.name}
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={onOpenAdventurerSelect}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f6efe0] hover:bg-[#ede3ce] text-[#2a2833] font-bold text-[11px] tracking-wider uppercase transition cursor-pointer"
                  >
                    <Smile className="w-3.5 h-3.5" />
                    <span>SWITCH</span>
                  </button>
                  <button
                    type="button"
                    onClick={onRestart}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f6efe0] hover:bg-[#ede3ce] text-[#2a2833] font-bold text-[11px] tracking-wider uppercase transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESTART</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Clean Quick Toggles */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={onToggleCamera}
                className="py-2.5 px-3 rounded-full bg-white hover:bg-[#f6efe0] text-[#2a2833] shadow-[0_4px_14px_rgba(62,54,36,0.06)] transition flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                title="Toggle Camera View (C)"
              >
                <Camera className="w-4 h-4 text-[#464558]" />
                <span className="capitalize">{cameraMode}</span>
              </button>
              <button
                type="button"
                onClick={handleToggleMute}
                className="py-2.5 px-3 rounded-full bg-white hover:bg-[#f6efe0] text-[#2a2833] shadow-[0_4px_14px_rgba(62,54,36,0.06)] transition flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                title="Toggle Audio (M)"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-[#e06c75]" />
                    <span>MUTED</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-[#2cc48e]" />
                    <span>SOUND</span>
                  </>
                )}
              </button>
            </div>

            {/* Primary Mint Pill CTA */}
            <button
              type="button"
              onClick={onPauseToggle}
              className="w-full py-4 px-6 bg-[#35d69e] hover:bg-[#2cc48e] active:scale-[0.98] text-white font-black text-xl tracking-wider rounded-full transition shadow-[0_10px_24px_rgba(53,214,158,0.32)] uppercase cursor-pointer"
            >
              RESUME
            </button>
          </div>
        </div>
      )}

      {/* Bottom Corner YES / NO Directional Arrow Controls */}
      <div className="w-full flex items-end justify-between gap-4 pointer-events-none">
        {/* Bottom-Left Corner: YES (Left Tunnel) */}
        <button
          type="button"
          data-interactive="true"
          onClick={onChooseYes}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 sm:px-4 sm:py-3 transition-transform duration-150 cursor-pointer shadow-xl ${
            isLeaningLeft
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 scale-105'
              : 'bg-slate-950/90 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
          }`}
          title="Steer Left (YES)"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 shrink-0" />
          <div className="flex flex-col items-start text-left">
            <span className="text-base sm:text-xl font-black tracking-wide leading-none text-emerald-300">
              YES
            </span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-200 mt-1 whitespace-nowrap">
              {leftAction}
            </span>
          </div>
        </button>

        {/* Bottom-Right Corner: NO (Right Tunnel) */}
        <button
          type="button"
          data-interactive="true"
          onClick={onChooseNo}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 sm:px-4 sm:py-3 transition-transform duration-150 cursor-pointer shadow-xl ${
            isLeaningRight
              ? 'bg-rose-950/95 border-rose-400 text-rose-200 scale-105'
              : 'bg-slate-950/90 border-rose-500/50 text-rose-300 hover:border-rose-400'
          }`}
          title="Steer Right (NO)"
        >
          <div className="flex flex-col items-end text-right">
            <span className="text-base sm:text-xl font-black tracking-wide leading-none text-rose-300">
              NO
            </span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-200 mt-1 whitespace-nowrap">
              {rightAction}
            </span>
          </div>
          <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400 shrink-0" />
        </button>
      </div>
    </div>
  );
};
