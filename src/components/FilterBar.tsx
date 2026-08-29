import React from 'react';
import { Search, Star, X, ArrowUpDown } from 'lucide-react';
import { MoodType, EntryFilter } from '../types/journal';
import { MOODS, DEFAULT_TAGS } from '../data/prompts';

interface FilterBarProps {
  filter: EntryFilter;
  setFilter: React.Dispatch<React.SetStateAction<EntryFilter>>;
  availableTags: string[];
  totalResultsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  setFilter,
  availableTags,
  totalResultsCount,
}) => {
  const allTags = Array.from(new Set([...DEFAULT_TAGS, ...availableTags]));

  const hasActiveFilters =
    filter.searchQuery.trim() !== '' ||
    filter.mood !== 'all' ||
    filter.tag !== 'all' ||
    filter.onlyFavorites;

  const resetFilters = () => {
    setFilter({
      searchQuery: '',
      mood: 'all',
      tag: 'all',
      onlyFavorites: false,
      sortBy: 'date-desc',
    });
  };

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-2xl p-3 sm:p-4 mb-6 space-y-3 shadow-xl">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            id="search-entries-input"
            type="text"
            value={filter.searchQuery}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search entries by title, thoughts, or reflections..."
            className="w-full pl-9 pr-8 py-2 bg-[#161616] border border-[#2A2A2A] rounded-xl text-xs sm:text-sm text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30 transition"
          />
          {filter.searchQuery && (
            <button
              onClick={() => setFilter((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls: Favorites, Tag filter, Sort order */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Favorites filter toggle */}
          <button
            id="filter-favorites-toggle"
            type="button"
            onClick={() => setFilter((prev) => ({ ...prev, onlyFavorites: !prev.onlyFavorites }))}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition ${
              filter.onlyFavorites
                ? 'bg-amber-950/50 border-amber-700/70 text-amber-400 font-semibold shadow-xs'
                : 'bg-[#161616] hover:bg-[#1C1C1C] border-[#2A2A2A] text-stone-300'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                filter.onlyFavorites ? 'fill-amber-400 text-amber-400' : 'text-stone-500'
              }`}
            />
            <span>Favorites</span>
          </button>

          {/* Tag selector */}
          <select
            id="filter-tag-select"
            value={filter.tag}
            onChange={(e) => setFilter((prev) => ({ ...prev, tag: e.target.value }))}
            className="px-3 py-2 bg-[#161616] border border-[#2A2A2A] rounded-xl text-xs text-stone-300 focus:outline-hidden focus:border-amber-600"
          >
            <option value="all">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>

          {/* Sort selector */}
          <div className="relative">
            <select
              id="filter-sort-select"
              value={filter.sortBy}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  sortBy: e.target.value as 'date-desc' | 'date-asc' | 'updated-desc',
                }))
              }
              className="px-3 py-2 bg-[#161616] border border-[#2A2A2A] rounded-xl text-xs text-stone-300 focus:outline-hidden focus:border-amber-600"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="updated-desc">Recently Edited</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mood Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest mr-1 font-mono-journal">
          Mood:
        </span>
        <button
          onClick={() => setFilter((prev) => ({ ...prev, mood: 'all' }))}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
            filter.mood === 'all'
              ? 'bg-amber-600 text-black font-semibold'
              : 'bg-[#161616] hover:bg-[#1F1F1F] text-stone-400 border border-[#262626]'
          }`}
        >
          All
        </button>

        {(Object.keys(MOODS) as MoodType[]).map((key) => {
          const m = MOODS[key];
          const isSelected = filter.mood === key;
          return (
            <button
              key={key}
              onClick={() => setFilter((prev) => ({ ...prev, mood: isSelected ? 'all' : key }))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                isSelected
                  ? `${m.bgColor} ${m.textColor} ${m.borderColor} font-semibold ring-1 ring-amber-500/50`
                  : 'bg-[#161616] hover:bg-[#1F1F1F] text-stone-400 border-[#262626]'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
