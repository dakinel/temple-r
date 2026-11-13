import React, { useEffect } from 'react';
import { Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdventurerProfile, getDiceBearAvatarUrl } from '../game/adventurers';
import { CrashType } from '../game/characterController';

interface GameOverModalProps {
  stats: {
    distance: number;
    coins: number;
    score: number;
    reason?: string;
    crashType?: CrashType;
  };
  highScore: number;
  isNewHigh: boolean;
  adventurer: AdventurerProfile;
  onPlayAgain: () => void;
  onHome: () => void;
}

const CrashChartIcon: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    className="w-14 h-14 mx-auto"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Coral bearish bars */}
    <rect x="16" y="20" width="7" height="17" rx="1.5" fill="#F4A29E" stroke="#464558" strokeWidth="2.4" />
    <rect x="28" y="24" width="7" height="13" rx="1.5" fill="#F8C89C" stroke="#464558" strokeWidth="2.4" />
    <rect x="40" y="29" width="7" height="8" rx="1.5" fill="#F4A29E" stroke="#464558" strokeWidth="2.4" />
    {/* Baseline */}
    <line x1="12" y1="37" x2="52" y2="37" stroke="#464558" strokeWidth="2.6" strokeLinecap="round" />
    {/* Downward trend arrow */}
    <path
      d="M14 14L27 23L35 19L49 30"
      stroke="#464558"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 14L27 23L35 19L49 30"
      stroke="#F4A29E"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M42 31L50 31L49 23"
      stroke="#464558"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#F4A29E"
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

const WallCrashIcon: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    className="w-14 h-14 mx-auto"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Egyptian sandstone wall blocks with turquoise crack */}
    <rect x="14" y="14" width="16" height="11" rx="2" fill="#F7C98E" stroke="#464558" strokeWidth="2.4" />
    <rect x="34" y="14" width="16" height="11" rx="2" fill="#9DE3E6" stroke="#464558" strokeWidth="2.4" />
    <rect x="14" y="27" width="13" height="10" rx="2" fill="#F4A29E" stroke="#464558" strokeWidth="2.4" />
    <rect x="31" y="27" width="19" height="10" rx="2" fill="#F7C98E" stroke="#464558" strokeWidth="2.4" />
    {/* Impact crack */}
    <path
      d="M32 10L29 21L35 26L30 37"
      stroke="#464558"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Baseline */}
    <line x1="12" y1="37" x2="52" y2="37" stroke="#464558" strokeWidth="2.6" strokeLinecap="round" />
    {/* Running legs */}
    <path
      d="M27 37L22 47L16 47"
      stroke="#464558"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M37 37L42 47L48 47"
      stroke="#464558"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#35d69e', '#f7c98e', '#9de3e6', '#f4a29e'],
      });
    }
  }, [isNewHigh]);

  const avatarUrl = getDiceBearAvatarUrl(adventurer.seed);
  const isCornerCrash = stats.crashType === 'corner_wall';

  const summaryLine = stats.reason
    ? stats.reason.split('.')[0]
    : `${stats.distance}m · ${stats.coins} coins`;

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-[crashModalIn_0.22s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="max-w-sm w-full bg-[#fcf9ee] rounded-[34px] px-7 py-8 sm:px-8 sm:py-9 shadow-[0_24px_60px_rgba(15,23,42,0.45)] text-center">
        {/* Minimal Pastel Line Icon */}
        <div className="mb-2">
          {isCornerCrash ? <WallCrashIcon /> : <CrashChartIcon />}
        </div>

        {/* Clean Title */}
        <h2 className="text-2xl sm:text-[28px] font-black text-[#3e3c4e] tracking-[0.06em] uppercase mb-4">
          {isCornerCrash ? 'WALL IMPACT' : 'LIQUIDATED'}
        </h2>

        {/* Soft Score Pill */}
        <div className="mb-5">
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase tabular-nums ${
              isNewHigh
                ? 'bg-[#c9f5e4] text-[#0c5940]'
                : 'bg-[#fae0c3] text-[#2c2a35]'
            }`}
          >
            {isNewHigh
              ? `NEW BEST: $${stats.score.toLocaleString()}`
              : `SCORE: $${stats.score.toLocaleString()} · BEST: $${highScore.toLocaleString()}`}
          </span>
        </div>

        {/* Crisp White Trader & Result Card */}
        <div className="bg-white rounded-[24px] p-4 mb-6 shadow-[0_8px_24px_rgba(62,54,36,0.06)] flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-2xl bg-[#d6d9fa] border-2 border-[#efe7d8] overflow-hidden shrink-0">
            <img
              src={avatarUrl}
              alt={adventurer.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-black text-[#17161d] text-lg leading-tight truncate tabular-nums">
              {stats.distance}m · ${stats.score.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-[#6e6b7c] mt-0.5 line-clamp-1">
              {summaryLine}
            </div>
            <button
              type="button"
              onClick={onHome}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f6efe0] hover:bg-[#ede3ce] text-[#2a2833] font-bold text-[11px] tracking-wider uppercase transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>MENU</span>
            </button>
          </div>
        </div>

        {/* Primary Mint Pill CTA */}
        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full py-4 px-6 bg-[#35d69e] hover:bg-[#2cc48e] active:scale-[0.98] text-white font-black text-xl tracking-wider rounded-full transition shadow-[0_10px_24px_rgba(53,214,158,0.32)] uppercase cursor-pointer"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};
