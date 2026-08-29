import React from 'react';
import { BookOpen, PenLine, Sparkles, Filter } from 'lucide-react';

interface EmptyStateProps {
  isFiltered: boolean;
  onOpenNewEntry: () => void;
  onResetFilters?: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isFiltered,
  onOpenNewEntry,
  onResetFilters,
  onSelectPrompt,
}) => {
  if (isFiltered) {
    return (
      <div className="text-center py-16 px-4 bg-[#111111] border border-[#222222] rounded-2xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#181818] border border-[#262626] flex items-center justify-center text-stone-500 mb-3">
          <Filter className="w-5 h-5 text-amber-500" />
        </div>
        <h3 className="text-lg font-serif-journal font-bold text-white">
          No matching entries found
        </h3>
        <p className="text-xs text-stone-400 font-mono-journal max-w-sm mx-auto mt-1 mb-4">
          Try adjusting your search query, mood filter, or tag selection to see your journal notes.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] text-amber-400 rounded-xl text-xs font-semibold transition"
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16 px-4 bg-[#111111] border border-dashed border-[#262626] rounded-3xl max-w-2xl mx-auto space-y-6">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400 shadow-xl">
        <BookOpen className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-serif-journal font-bold text-white">
          Your Journal is Ready
        </h3>
        <p className="text-sm text-stone-400 font-serif-journal max-w-md mx-auto leading-relaxed">
          Record your daily reflections, gratitude, and milestones securely in your private cloud journal.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onOpenNewEntry}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-semibold rounded-xl text-sm shadow-[0_0_15px_rgba(217,119,6,0.25)] transition"
        >
          <PenLine className="w-4 h-4" />
          <span>Write First Entry</span>
        </button>

        {onSelectPrompt && (
          <button
            onClick={() => onSelectPrompt('What is one small thing that brought me a smile today?')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#181818] hover:bg-[#222222] text-stone-300 rounded-xl font-medium text-xs border border-[#2A2A2A] transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Start with a Daily Prompt</span>
          </button>
        )}
      </div>
    </div>
  );
};
