import React, { useState } from 'react';
import { PROMPTS } from '../data/prompts';
import { DailyPrompt } from '../types/journal';
import { Sparkles, Shuffle, PenLine, Heart, Compass, Target, Sun } from 'lucide-react';

interface PromptsDeckProps {
  onSelectPrompt: (promptText: string) => void;
}

export const PromptsDeck: React.FC<PromptsDeckProps> = ({ onSelectPrompt }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePromptIndex, setActivePromptIndex] = useState<number>(0);

  const categories = ['All', 'Gratitude', 'Reflection', 'Growth', 'Mindfulness', 'Creativity', 'Goals'];

  const filteredPrompts =
    selectedCategory === 'All'
      ? PROMPTS
      : PROMPTS.filter((p) => p.category === selectedCategory);

  const handleShuffle = () => {
    const nextIdx = Math.floor(Math.random() * filteredPrompts.length);
    setActivePromptIndex(nextIdx);
  };

  const featuredPrompt: DailyPrompt = filteredPrompts[activePromptIndex % filteredPrompts.length] || PROMPTS[0];

  return (
    <div className="space-y-8">
      {/* Featured Prompt Hero Card */}
      <div className="relative bg-gradient-to-br from-amber-900 to-stone-900 text-stone-100 rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-semibold uppercase tracking-wider font-mono-journal">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Prompt of the Moment</span>
            </span>

            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-medium backdrop-blur-xs transition"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>
          </div>

          <div>
            <span className="text-xs text-amber-300/80 font-mono-journal block mb-1">
              Category: {featuredPrompt.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-journal font-bold leading-snug tracking-tight text-white">
              "{featuredPrompt.text}"
            </h2>
            {featuredPrompt.followUp && (
              <p className="text-stone-300 font-serif-journal italic text-sm mt-2">
                {featuredPrompt.followUp}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onSelectPrompt(featuredPrompt.text)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition"
            >
              <PenLine className="w-4 h-4" />
              <span>Write to this Prompt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category filter tabs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif-journal font-bold text-white text-xl">
              Inspiration Catalog
            </h3>
            <p className="text-xs text-stone-400 font-mono-journal">Curated prompts for deep personal reflection</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setActivePromptIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-black shadow-[0_0_12px_rgba(217,119,6,0.3)]'
                  : 'bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-stone-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrompts.map((prompt) => (
          <div
            key={prompt.id}
            className="group bg-[#111111] hover:bg-[#161616] border border-[#222222] hover:border-[#333333] rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-semibold font-mono-journal uppercase tracking-wider text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40 inline-block mb-3">
                {prompt.category}
              </span>
              <p className="font-serif-journal text-base font-medium text-stone-200 leading-relaxed group-hover:text-amber-200 transition-colors">
                "{prompt.text}"
              </p>
              {prompt.followUp && (
                <p className="text-xs text-stone-400 font-serif-journal italic mt-2">
                  {prompt.followUp}
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#222222] flex items-center justify-end">
              <button
                onClick={() => onSelectPrompt(prompt.text)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 group-hover:underline"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Write Entry</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
