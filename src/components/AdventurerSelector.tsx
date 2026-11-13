import React, { useState } from 'react';
import { X, Check, Dices } from 'lucide-react';
import {
  AdventurerProfile,
  ADVENTURER_ROSTER,
  getDiceBearAvatarUrl,
} from '../game/adventurers';

interface AdventurerSelectorProps {
  currentAdventurer: AdventurerProfile;
  onSelectAdventurer: (profile: AdventurerProfile) => void;
  onClose: () => void;
}

export const AdventurerSelector: React.FC<AdventurerSelectorProps> = ({
  currentAdventurer,
  onSelectAdventurer,
  onClose,
}) => {
  const [customSeed, setCustomSeed] = useState('');

  const randomSeedWords = [
    'Explorer',
    'ShadowFox',
    'RelicHunter',
    'GoldRaider',
    'Maya',
    'TempleWanderer',
    'CanyonJack',
    'ThunderBird',
    'JungleViper',
    'Blaze',
  ];

  const handleRandomize = () => {
    const randomWord = randomSeedWords[Math.floor(Math.random() * randomSeedWords.length)];
    const randomNum = Math.floor(Math.random() * 900) + 100;
    setCustomSeed(`${randomWord}${randomNum}`);
  };

  const handleApplyCustom = () => {
    const seed = customSeed.trim() || 'CustomExplorer';
    const customProfile: AdventurerProfile = {
      id: `custom_${Date.now()}`,
      name: seed,
      seed,
      title: 'Custom Trader',
      quote: 'Built for the trading corridor.',
      shirtColor: 0x2b5b75,
      vestColor: 0x7a4e27,
      pantsColor: 0x9e895c,
      perk: 'Custom Runner',
    };
    onSelectAdventurer(customProfile);
    onClose();
  };

  const previewSeed = customSeed.trim() || 'CustomExplorer';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-[crashModalIn_0.22s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="bg-[#fcf9ee] rounded-[34px] w-full max-w-lg max-h-[88vh] flex flex-col shadow-[0_24px_60px_rgba(15,23,42,0.45)] overflow-hidden">
        {/* Minimal Header */}
        <div className="px-7 pt-7 pb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-black text-[#3e3c4e] uppercase tracking-[0.06em]">
            SELECT RUNNER
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close runner selector"
            className="w-10 h-10 rounded-full bg-[#f6efe0] hover:bg-[#ede3ce] text-[#2a2833] flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-7 pb-7 overflow-y-auto space-y-5">
          {/* Minimal Roster Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ADVENTURER_ROSTER.map((hero) => {
              const isSelected = currentAdventurer.seed === hero.seed;
              const avatarUrl = getDiceBearAvatarUrl(hero.seed);

              return (
                <button
                  type="button"
                  key={hero.id}
                  onClick={() => {
                    onSelectAdventurer(hero);
                    onClose();
                  }}
                  className={`p-3.5 rounded-[22px] bg-white transition text-center relative group cursor-pointer shadow-[0_6px_18px_rgba(62,54,36,0.06)] ${
                    isSelected
                      ? 'ring-2 ring-[#35d69e]'
                      : 'hover:bg-[#fffdf8]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#35d69e] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-[#d6d9fa] border-2 border-[#efe7d8] overflow-hidden">
                    <img
                      src={avatarUrl}
                      alt={hero.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      loading="lazy"
                    />
                  </div>
                  <div className="font-black text-sm text-[#17161d] truncate">
                    {hero.name}
                  </div>
                  <div className="text-[11px] font-medium text-[#6e6b7c] truncate mt-0.5">
                    {hero.perk}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Minimal Custom Runner Box */}
          <div className="bg-white rounded-[24px] p-4 shadow-[0_8px_24px_rgba(62,54,36,0.06)] flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#d6d9fa] border-2 border-[#efe7d8] overflow-hidden shrink-0">
              <img
                src={getDiceBearAvatarUrl(previewSeed)}
                alt="Custom runner preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customSeed}
                  onChange={(e) => setCustomSeed(e.target.value)}
                  placeholder="Custom name..."
                  className="flex-1 min-w-0 bg-[#fcf9ee] border border-[#ebe3d0] rounded-full px-3.5 py-2 text-sm font-medium text-[#17161d] placeholder-[#928e9f] focus:outline-none focus:border-[#35d69e]"
                />
                <button
                  type="button"
                  onClick={handleRandomize}
                  aria-label="Randomize custom face"
                  className="w-10 h-10 rounded-full bg-[#f6efe0] hover:bg-[#ede3ce] text-[#2a2833] flex items-center justify-center transition cursor-pointer shrink-0"
                  title="Randomize"
                >
                  <Dices className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleApplyCustom}
                className="w-full py-2.5 px-5 bg-[#35d69e] hover:bg-[#2cc48e] active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-full transition shadow-[0_6px_16px_rgba(53,214,158,0.28)] cursor-pointer"
              >
                USE CUSTOM
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

