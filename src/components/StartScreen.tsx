import React from 'react';
import { Smile } from 'lucide-react';
import { AdventurerProfile, getDiceBearAvatarUrl } from '../game/adventurers';
import { MarketQuery } from '../game/queries';

interface StartScreenProps {
  highScore: number;
  adventurer: AdventurerProfile;
  marketQueries: MarketQuery[];
  onOpenAdventurerSelect: () => void;
  onStartGame: () => void;
}

const BullRunnerIcon: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    className="w-14 h-14 mx-auto"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Pastel market bars */}
    <rect x="16" y="25" width="7" height="12" rx="1.5" fill="#F4A29E" stroke="#464558" strokeWidth="2.4" />
    <rect x="28" y="21" width="7" height="16" rx="1.5" fill="#F8C89C" stroke="#464558" strokeWidth="2.4" />
    <rect x="40" y="18" width="7" height="19" rx="1.5" fill="#9DE3E6" stroke="#464558" strokeWidth="2.4" />
    {/* Baseline */}
    <line x1="12" y1="37" x2="52" y2="37" stroke="#464558" strokeWidth="2.6" strokeLinecap="round" />
    {/* Upward bull trend arrow */}
    <path
      d="M14 31L26 21L34 25L48 12"
      stroke="#464558"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 31L26 21L34 25L48 12"
      stroke="#9DE3E6"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M41 11L50 10L49 19"
      stroke="#464558"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#9DE3E6"
    />
    {/* Playful running legs */}
    <path
      d="M27 37L23 47L17 47"
      stroke="#464558"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M36 37L41 47L47 47"
      stroke="#464558"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StartScreen: React.FC<StartScreenProps> = ({
  highScore,
  adventurer,
  onOpenAdventurerSelect,
  onStartGame,
}) => {
  const avatarUrl = getDiceBearAvatarUrl(adventurer.seed);

  return (
    <div className="absolute inset-0 z-30 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-[crashModalIn_0.22s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="max-w-sm w-full bg-[#fcf9ee] rounded-[34px] px-7 py-8 sm:px-8 sm:py-9 shadow-[0_24px_60px_rgba(15,23,42,0.45)] text-center">
        {/* Minimal Pastel Runner Chart Icon */}
        <div className="mb-2">
          <BullRunnerIcon />
        </div>

        {/* Clean Title */}
        <h1 className="text-2xl sm:text-[26px] font-black text-[#3e3c4e] tracking-[0.06em] uppercase mb-4 whitespace-nowrap">
          WALL STREET RUNNER
        </h1>

        {/* Soft Best Score Label */}
        {highScore > 0 && (
          <div className="mb-5">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#fae0c3] text-[#2c2a35] text-xs font-extrabold tracking-wider uppercase tabular-nums">
              BEST SCORE: ${highScore.toLocaleString()}
            </span>
          </div>
        )}

        {/* Crisp White Trader Card */}
        <div className="bg-white rounded-[24px] p-4 mb-6 shadow-[0_8px_24px_rgba(62,54,36,0.06)] flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-2xl bg-[#d6d9fa] border-2 border-[#efe7d8] overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={avatarUrl}
              alt={adventurer.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-black text-[#17161d] text-lg leading-tight truncate">
              {adventurer.name}
            </div>
            <button
              type="button"
              onClick={onOpenAdventurerSelect}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f6efe0] hover:bg-[#ede3ce] text-[#2a2833] font-bold text-[11px] tracking-wider uppercase transition cursor-pointer whitespace-nowrap"
            >
              <Smile className="w-3.5 h-3.5" />
              <span>SWITCH</span>
            </button>
          </div>
        </div>

        {/* Primary Mint Pill CTA */}
        <button
          type="button"
          onClick={onStartGame}
          className="w-full py-4 px-6 bg-[#35d69e] hover:bg-[#2cc48e] active:scale-[0.98] text-white font-black text-xl tracking-wider rounded-full transition shadow-[0_10px_24px_rgba(53,214,158,0.32)] uppercase cursor-pointer"
        >
          PLAY
        </button>

        {/* Quiet 1-line Control Hint */}
        <p className="mt-4 text-[11px] font-medium text-[#6e6b7c]">
          Scroll or A/D to steer · Vertical scroll for speed · Tap to jump
        </p>
      </div>
    </div>
  );
};

