import React, { useState } from 'react';
import { X, Check, Dices, Sparkles, User, ShieldCheck } from 'lucide-react';
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
  const [customName, setCustomName] = useState('');

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
    const seed = `${randomWord}${randomNum}`;
    setCustomSeed(seed);
    if (!customName) {
      setCustomName(`${randomWord} ${randomNum}`);
    }
  };

  const handleApplyCustom = () => {
    const seed = customSeed.trim() || 'CustomExplorer';
    const name = customName.trim() || seed;
    const customProfile: AdventurerProfile = {
      id: `custom_${Date.now()}`,
      name,
      seed,
      title: 'Custom Rogue Adventurer',
      quote: 'I make my own rules in this temple!',
      shirtColor: 0x2b5b75,
      vestColor: 0x7a4e27,
      pantsColor: 0x9e895c,
      perk: 'Custom Explorer Vitality',
    };
    onSelectAdventurer(customProfile);
    onClose();
  };

  const previewSeed = customSeed.trim() || 'CustomExplorer';

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-stone-900 border-2 border-amber-600/60 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-400 uppercase tracking-wider">
                Select Your Adventurer
              </h2>
              <p className="text-xs text-stone-400">
                Powered by DiceBear Adventurer API &bull; Live faces on your 3D runner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Preset Roster Grid */}
          <div>
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Temple Hall of Fame</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ADVENTURER_ROSTER.map((hero) => {
                const isSelected = currentAdventurer.seed === hero.seed;
                const avatarUrl = getDiceBearAvatarUrl(hero.seed);

                return (
                  <div
                    key={hero.id}
                    onClick={() => {
                      onSelectAdventurer(hero);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 shadow-lg ring-1 ring-amber-400'
                        : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-800/40'
                    }`}
                  >
                    {/* Active Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 bg-amber-500 text-stone-950 p-1 rounded-full shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-2.5">
                      {/* DiceBear Avatar Face */}
                      <div className="w-14 h-14 rounded-2xl bg-stone-900 border-2 border-amber-500/40 overflow-hidden shrink-0 shadow">
                        <img
                          src={avatarUrl}
                          alt={hero.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition duration-200"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-white truncate tracking-wide">
                          {hero.name}
                        </h4>
                        <span className="text-[11px] text-amber-400/90 font-medium block truncate">
                          {hero.title}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold block truncate mt-0.5">
                          {hero.perk}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] italic text-stone-400 border-t border-stone-800/80 pt-2 line-clamp-1">
                      &ldquo;{hero.quote}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Adventurer Face Generator */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Dices className="w-4 h-4 text-amber-400" />
              <span>Create Custom Adventurer Face</span>
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Enter any name or seed to instantly generate a unique adventurer face with the DiceBear API!
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Live Avatar Preview */}
              <div className="w-20 h-20 rounded-2xl bg-stone-900 border-2 border-amber-500/70 overflow-hidden shrink-0 shadow-lg relative">
                <img
                  src={getDiceBearAvatarUrl(previewSeed)}
                  alt="Custom preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Input & Controls */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSeed}
                    onChange={(e) => setCustomSeed(e.target.value)}
                    placeholder="Enter seed / name (e.g. Lara, Jones, Shadow)"
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleRandomize}
                    className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Generate Random Avatar Face"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Random</span>
                  </button>
                </div>

                <button
                  onClick={handleApplyCustom}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Equip Custom Adventurer Face</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
