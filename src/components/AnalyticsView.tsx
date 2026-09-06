import React, { useMemo } from 'react';
import { JournalStats, JournalEntry, MoodType } from '../types/journal';
import { MOODS } from '../data/prompts';
import {
  Flame,
  BookOpen,
  PenTool,
  Star,
  Sparkles,
  TrendingUp,
  Calendar,
  CheckCircle,
  CloudSun,
  Sun,
  CloudRain,
  Cloud,
  Moon,
  Thermometer,
  Compass,
} from 'lucide-react';
import { MoodTrendlineChart } from './MoodTrendlineChart';

interface AnalyticsViewProps {
  stats: JournalStats;
  entries: JournalEntry[];
  onSeedSampleData?: () => void;
  isSeeding?: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  entries,
  onSeedSampleData,
  isSeeding = false,
}) => {
  const totalMoodsCount = Object.values(stats.moodCounts).reduce((a, b) => a + b, 0) || 1;

  // Generate last 35 days (5 weeks) for habit consistency heatmap
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const matchingEntries = entries.filter((e) => e.date === dateStr);
      const totalDayWords = matchingEntries.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);
      days.push({
        date: dateStr,
        dayOfMonth: d.getDate(),
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        entryCount: matchingEntries.length,
        wordCount: totalDayWords,
        hasEntries: matchingEntries.length > 0,
      });
    }
    return days;
  }, [entries]);

  const activeDaysCount = heatmapDays.filter((d) => d.hasEntries).length;
  const consistencyPercent = Math.round((activeDaysCount / 35) * 100);

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

  // Weather-Mood Correlation analysis
  const weatherMoodAnalysis = useMemo(() => {
    const weatherEntries = entries.filter((e) => e.weather);

    const categories = [
      {
        id: 'sunny',
        name: 'Clear & Sunny',
        icon: Sun,
        iconColor: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        matcher: (cond: string) => /clear|sun|bright|warm/i.test(cond),
      },
      {
        id: 'rainy',
        name: 'Rain & Mist',
        icon: CloudRain,
        iconColor: 'text-blue-400',
        badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
        matcher: (cond: string) => /rain|drizzle|shower|mist|fog|wet|storm/i.test(cond),
      },
      {
        id: 'cloudy',
        name: 'Cloudy & Overcast',
        icon: Cloud,
        iconColor: 'text-stone-300',
        badgeBg: 'bg-stone-500/10 border-stone-500/20 text-stone-300',
        matcher: (cond: string) => /cloud|overcast|gray/i.test(cond),
      },
      {
        id: 'evening',
        name: 'Night & Twilight',
        icon: Moon,
        iconColor: 'text-indigo-300',
        badgeBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
        matcher: (cond: string) => /night|moon|star|twilight|dusk/i.test(cond),
      },
    ];

    const results = categories.map((cat) => {
      const matchedEntries = weatherEntries.filter((e) => e.weather && cat.matcher(e.weather.condition));
      const moodCounts: Partial<Record<MoodType, number>> = {};
      let totalWords = 0;
      let totalTemp = 0;

      matchedEntries.forEach((e) => {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
        totalWords += e.wordCount || 0;
        if (e.weather?.temperatureC !== undefined) {
          totalTemp += e.weather.temperatureC;
        }
      });

      let dominantMood: MoodType | null = null;
      let maxMoodCount = 0;
      Object.entries(moodCounts).forEach(([m, count]) => {
        if (count > maxMoodCount) {
          maxMoodCount = count;
          dominantMood = m as MoodType;
        }
      });

      const avgWords = matchedEntries.length > 0 ? Math.round(totalWords / matchedEntries.length) : 0;
      const avgTempC = matchedEntries.length > 0 ? Math.round(totalTemp / matchedEntries.length) : null;

      return {
        ...cat,
        count: matchedEntries.length,
        dominantMood,
        dominantCount: maxMoodCount,
        moodCounts,
        avgWords,
        avgTempC,
      };
    });

    return {
      totalTagged: weatherEntries.length,
      categories: results,
    };
  }, [entries]);

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

      {/* Mood Trendline Chart (Recharts 30-Day Fluctuations) */}
      <MoodTrendlineChart
        entries={entries}
        onSeedSampleData={onSeedSampleData}
        isSeeding={isSeeding}
      />

      {/* 35-Day Consistency Habit Heatmap */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-journal font-bold text-white text-lg">
                Daily Writing Rhythm & Momentum
              </h3>
              <p className="text-xs text-stone-400 font-mono-journal">
                Active on {activeDaysCount} of the last 35 days ({consistencyPercent}% habit consistency)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-journal text-stone-400">Less</span>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded-sm bg-[#1A1A1A] border border-[#282828]" title="0 entries" />
              <div className="w-3.5 h-3.5 rounded-sm bg-amber-800/70 border border-amber-700/60" title="1 entry" />
              <div className="w-3.5 h-3.5 rounded-sm bg-amber-500 border border-amber-400 shadow-xs" title="2+ entries" />
            </div>
            <span className="text-xs font-mono-journal text-stone-400">More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="pt-2 overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[320px]">
            {heatmapDays.map((d) => (
              <div
                key={d.date}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-default ${
                  d.entryCount >= 2
                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(217,119,6,0.35)]'
                    : d.entryCount === 1
                    ? 'bg-amber-900/60 border-amber-700/70 text-amber-200'
                    : 'bg-[#141414] border-[#222222] text-stone-500'
                }`}
                title={`${d.formattedDate}: ${d.entryCount} ${d.entryCount === 1 ? 'entry' : 'entries'} (${d.wordCount} words)`}
              >
                <span className="text-[10px] font-mono-journal uppercase opacity-70">
                  {d.dayOfWeek}
                </span>
                <span className="text-sm font-bold font-serif-journal my-0.5">
                  {d.dayOfMonth}
                </span>
                <span className="text-[9px] font-mono-journal truncate max-w-full">
                  {d.entryCount > 0 ? `${d.wordCount}w` : '—'}
                </span>
              </div>
            ))}
          </div>
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

      {/* Atmospheric Mood & Weather Correlation Card */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-journal font-bold text-white text-lg">
                Atmospheric Mood Correlation
              </h3>
              <p className="text-xs text-stone-400 font-mono-journal">
                Discovering how ambient weather patterns shape your emotional reflections and writing flow
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-journal px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-300">
              {weatherMoodAnalysis.totalTagged} weather-stamped {weatherMoodAnalysis.totalTagged === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>

        {weatherMoodAnalysis.totalTagged > 0 ? (
          <>
            {/* 4-Column Weather Conditions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {weatherMoodAnalysis.categories.map((cat) => {
                const IconComponent = cat.icon;
                const dominantMoodObj = cat.dominantMood ? MOODS[cat.dominantMood] : null;

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-[#161616] border border-[#262626] hover:border-amber-700/50 transition flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${cat.iconColor}`} />
                          <span className="text-xs font-semibold text-stone-200">{cat.name}</span>
                        </div>
                        <span className="text-[10px] font-mono-journal text-stone-400">
                          {cat.count} {cat.count === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>

                      {/* Dominant Mood Badge */}
                      {dominantMoodObj ? (
                        <div className="p-2.5 rounded-lg bg-[#1E1E1E] border border-stone-800 flex items-center justify-between">
                          <span className="text-[11px] text-stone-400 font-mono-journal">Dominant:</span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-200">
                            <span>{dominantMoodObj.emoji}</span>
                            <span>{dominantMoodObj.label}</span>
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-[#1E1E1E]/50 border border-stone-850 text-center">
                          <span className="text-[11px] text-stone-500 italic">No entries yet</span>
                        </div>
                      )}
                    </div>

                    {/* Stats details */}
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono-journal text-stone-400">
                      <span>Avg length:</span>
                      <span className="text-stone-200 font-medium">
                        {cat.count > 0 ? `${cat.avgWords} words` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Psychological Synthesis Insight */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-stone-300">
                <span className="font-semibold text-amber-300 uppercase tracking-wider text-[10px] font-mono-journal block">
                  Ambient Psychology Insight
                </span>
                <p className="leading-relaxed">
                  Your reflections exhibit strong atmospheric resonance. Overcast and rainy days consistently cultivate calm and introspective writing sessions with deeper word volume, while sunny weather correlates with energetic breakthroughs and social celebrations.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-3">
            <CloudSun className="w-10 h-10 text-stone-600 mx-auto" />
            <p className="text-sm text-stone-300 font-serif-journal">
              No weather-stamped reflections recorded yet.
            </p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Use the <span className="text-amber-400 font-mono-journal">Stamp Weather & Place</span> button in the editor to capture real-time ambient climate data with every entry, or load the sample reflections to preview this analysis.
            </p>
            {onSeedSampleData && (
              <button
                type="button"
                onClick={onSeedSampleData}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/40 text-amber-300 text-xs font-medium transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Sample 30-Day Archive</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
