import React from 'react';
import { JournalStats, JournalEntry, MoodType } from '../types/journal';
import { MOODS } from '../data/prompts';
import { Flame, BookOpen, PenTool, Star, Sparkles, TrendingUp } from 'lucide-react';

interface AnalyticsViewProps {
  stats: JournalStats;
  entries: JournalEntry[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats, entries }) => {
  const totalMoodsCount = Object.values(stats.moodCounts).reduce((a, b) => a + b, 0) || 1;

  // Sorted tags by count
  const sortedTags = Object.entries(stats.tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Day of week distribution
  const dayOfWeekCounts: Record<string, number> = {
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
  };
  const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  entries.forEach((e) => {
    try {
      const d = new Date(e.date + 'T00:00:00');
      const dayName = daysArr[d.getDay()];
      if (dayName) {
        dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
      }
    } catch {}
  });

  const maxDayCount = Math.max(...Object.values(dayOfWeekCounts), 1);

  const avgWordsPerEntry =
    stats.totalEntries > 0 ? Math.round(stats.totalWords / stats.totalEntries) : 0;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono-journal text-stone-400">
              Active Streak
            </span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif-journal font-bold text-white">
              {stats.currentStreak}
            </span>
            <span className="text-xs text-amber-500/80 font-mono-journal">days</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 font-mono-journal">
            Best streak: {stats.longestStreak} days
          </p>
        </div>

        {/* Total Entries */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono-journal text-stone-400">
              Total Entries
            </span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif-journal font-bold text-white">
              {stats.totalEntries}
            </span>
            <span className="text-xs text-stone-400 font-mono-journal">written</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 font-mono-journal">
            {stats.entriesThisMonth} written this month
          </p>
        </div>

        {/* Total Words */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono-journal text-stone-400">
              Words Written
            </span>
            <PenTool className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif-journal font-bold text-white">
              {stats.totalWords.toLocaleString()}
            </span>
            <span className="text-xs text-stone-400 font-mono-journal">words</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 font-mono-journal">
            ~{avgWordsPerEntry} avg words per entry
          </p>
        </div>

        {/* Starred Memories */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono-journal text-stone-400">
              Favorite Entries
            </span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif-journal font-bold text-white">
              {stats.favoriteCount}
            </span>
            <span className="text-xs text-stone-400 font-mono-journal">saved</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 font-mono-journal">Bookmarked highlights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
            <div>
              <h3 className="font-serif-journal font-bold text-white text-lg">
                Emotional Landscape
              </h3>
              <p className="text-xs text-stone-400 font-mono-journal">Distribution of recorded moods</p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3 pt-1">
            {(Object.keys(MOODS) as MoodType[]).map((key) => {
              const count = stats.moodCounts[key] || 0;
              const percentage = totalMoodsCount > 0 ? Math.round((count / totalMoodsCount) * 100) : 0;
              const m = MOODS[key];

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-stone-300">
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </span>
                    <span className="text-stone-400 font-mono-journal">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#1C1C1C] rounded-full overflow-hidden border border-[#262626]">
                    <div
                      className={`h-full ${m.accentDot} transition-all duration-500 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Writing Habits by Day of Week */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div>
                <h3 className="font-serif-journal font-bold text-white text-lg">
                  Writing Rhythm
                </h3>
                <p className="text-xs text-stone-400 font-mono-journal">Journal activity by day of the week</p>
              </div>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>

            <div className="grid grid-cols-7 gap-2 pt-6 items-end h-48">
              {daysArr.map((dayName) => {
                const count = dayOfWeekCounts[dayName] || 0;
                const barHeightPercent = Math.max(12, Math.round((count / maxDayCount) * 100));

                return (
                  <div key={dayName} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-mono-journal text-stone-400 font-semibold">
                      {count}
                    </span>
                    <div
                      className="w-full bg-amber-600 rounded-t-lg transition-all duration-300 hover:bg-amber-500 shadow-[0_0_12px_rgba(217,119,6,0.2)]"
                      style={{ height: `${barHeightPercent}%` }}
                    />
                    <span className="text-xs font-mono-journal text-stone-400 font-medium">
                      {dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frequent Themes & Tags */}
          <div className="pt-4 border-t border-[#222222]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono-journal mb-2.5">
              Prominent Themes & Tags
            </h4>
            {sortedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sortedTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-[#161616] text-stone-300 text-xs font-medium border border-[#282828]"
                  >
                    #{tag} <span className="text-amber-500/80 font-mono-journal ml-1">({count})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">No tags added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
