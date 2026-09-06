import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { JournalEntry, MoodType } from '../types/journal';
import { MOODS } from '../data/prompts';
import {
  TrendingUp,
  Sparkles,
  Calendar,
  Activity,
  Heart,
  PlusCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const MOOD_LEVELS: Record<
  MoodType,
  { score: number; label: string; emoji: string; color: string; hex: string }
> = {
  joyful: { score: 8, label: 'Joyful', emoji: '✨', color: 'text-amber-400', hex: '#F59E0B' },
  energized: { score: 7, label: 'Energized', emoji: '⚡', color: 'text-orange-400', hex: '#F97316' },
  inspired: { score: 6, label: 'Inspired', emoji: '💡', color: 'text-yellow-400', hex: '#EAB308' },
  grateful: { score: 5, label: 'Grateful', emoji: '🌿', color: 'text-emerald-400', hex: '#10B981' },
  calm: { score: 4, label: 'Calm', emoji: '☁️', color: 'text-sky-400', hex: '#0EA5E9' },
  reflective: { score: 3, label: 'Reflective', emoji: '🕯️', color: 'text-violet-400', hex: '#8B5CF6' },
  anxious: { score: 2, label: 'Anxious', emoji: '🌊', color: 'text-rose-400', hex: '#F43F5E' },
  melancholy: { score: 1, label: 'Melancholy', emoji: '🌧️', color: 'text-stone-400', hex: '#78716C' },
};

const SCORE_LABELS: Record<number, { emoji: string; label: string }> = {
  8: { emoji: '✨', label: 'Joyful' },
  7: { emoji: '⚡', label: 'Energized' },
  6: { emoji: '💡', label: 'Inspired' },
  5: { emoji: '🌿', label: 'Grateful' },
  4: { emoji: '☁️', label: 'Calm' },
  3: { emoji: '🕯️', label: 'Reflective' },
  2: { emoji: '🌊', label: 'Anxious' },
  1: { emoji: '🌧️', label: 'Melancholy' },
};

interface MoodTrendlineChartProps {
  entries: JournalEntry[];
  onSeedSampleData?: () => void;
  isSeeding?: boolean;
}

interface DayTrendPoint {
  date: string;
  dayLabel: string;
  fullDateStr: string;
  hasEntry: boolean;
  score: number | null;
  displayScore: number | null;
  mood: MoodType | null;
  moodLabel: string;
  moodEmoji: string;
  entriesCount: number;
  titles: string[];
  totalWords: number;
}

export const MoodTrendlineChart: React.FC<MoodTrendlineChartProps> = ({
  entries,
  onSeedSampleData,
  isSeeding = false,
}) => {
  const [timeframeDays, setTimeframeDays] = useState<number>(30);
  const [seededToast, setSeededToast] = useState<boolean>(false);

  // Build the continuous timeline points for the selected timeframe
  const chartData = useMemo<DayTrendPoint[]>(() => {
    const points: DayTrendPoint[] = [];
    const today = new Date();

    for (let i = timeframeDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayEntries = entries.filter((e) => e.date === dateStr);
      const hasEntry = dayEntries.length > 0;

      let score: number | null = null;
      let primaryMood: MoodType | null = null;

      if (hasEntry) {
        // Average score if multiple entries on same day
        const scores = dayEntries.map((e) => MOOD_LEVELS[e.mood]?.score ?? 4);
        const sum = scores.reduce((a, b) => a + b, 0);
        score = Math.round((sum / scores.length) * 10) / 10;
        primaryMood = dayEntries[dayEntries.length - 1].mood; // latest entry's mood
      }

      const moodConfig = primaryMood ? MOOD_LEVELS[primaryMood] : null;

      points.push({
        date: dateStr,
        dayLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDateStr: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        hasEntry,
        score,
        displayScore: score,
        mood: primaryMood,
        moodLabel: moodConfig ? moodConfig.label : 'No Entry',
        moodEmoji: moodConfig ? moodConfig.emoji : '—',
        entriesCount: dayEntries.length,
        titles: dayEntries.map((e) => e.title || 'Untitled'),
        totalWords: dayEntries.reduce((acc, curr) => acc + (curr.wordCount || 0), 0),
      });
    }

    return points;
  }, [entries, timeframeDays]);

  // Aggregate stats over the timeframe
  const statsSummary = useMemo(() => {
    const pointsWithScores = chartData.filter((p) => p.score !== null);
    const recordedDays = pointsWithScores.length;

    if (recordedDays === 0) {
      return {
        recordedDays: 0,
        avgScore: null,
        dominantMood: null,
        emotionalSummary: 'No entries recorded in this timeframe',
        trendDirection: 'neutral',
        trendText: 'Start writing to map your emotional landscape',
      };
    }

    const totalScore = pointsWithScores.reduce((acc, p) => acc + (p.score || 0), 0);
    const avgScore = Math.round((totalScore / recordedDays) * 10) / 10;

    // Dominant Mood
    const moodCounts: Partial<Record<MoodType, number>> = {};
    chartData.forEach((p) => {
      if (p.mood) {
        moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
      }
    });

    let dominantMood: MoodType = 'reflective';
    let maxCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = mood as MoodType;
      }
    });

    // Trend Direction: compare first half of timeframe with second half
    const half = Math.floor(chartData.length / 2);
    const firstHalfPoints = chartData.slice(0, half).filter((p) => p.score !== null);
    const secondHalfPoints = chartData.slice(half).filter((p) => p.score !== null);

    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    let trendText = 'Stable and steady';

    if (firstHalfPoints.length > 0 && secondHalfPoints.length > 0) {
      const avg1 = firstHalfPoints.reduce((a, b) => a + (b.score || 0), 0) / firstHalfPoints.length;
      const avg2 = secondHalfPoints.reduce((a, b) => a + (b.score || 0), 0) / secondHalfPoints.length;
      const diff = Math.round((avg2 - avg1) * 10) / 10;

      if (diff >= 0.5) {
        trendDirection = 'up';
        trendText = `Trending upward (+${diff} valence)`;
      } else if (diff <= -0.5) {
        trendDirection = 'down';
        trendText = `Dipping downward (${diff} valence)`;
      } else {
        trendDirection = 'stable';
        trendText = 'Balanced emotional equilibrium';
      }
    }

    // Human-friendly emotional state
    let emotionalSummary = 'Reflective & Grounded';
    if (avgScore >= 6.8) emotionalSummary = 'Radiant & Energized';
    else if (avgScore >= 5.5) emotionalSummary = 'Inspired & Uplifted';
    else if (avgScore >= 4.5) emotionalSummary = 'Serene & Grateful';
    else if (avgScore >= 3.5) emotionalSummary = 'Calm & Contemplative';
    else if (avgScore >= 2.5) emotionalSummary = 'Pensive & Processing';
    else emotionalSummary = 'Navigating Depth & Vulnerability';

    return {
      recordedDays,
      avgScore,
      dominantMood,
      emotionalSummary,
      trendDirection,
      trendText,
    };
  }, [chartData]);

  const handleSeedClick = () => {
    if (onSeedSampleData) {
      onSeedSampleData();
      setSeededToast(true);
      setTimeout(() => setSeededToast(false), 3500);
    }
  };

  // Custom Recharts Tooltip
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: DayTrendPoint = payload[0].payload;

    return (
      <div className="bg-[#141414]/95 backdrop-blur-md border border-[#2c2c2c] rounded-xl p-3.5 shadow-2xl min-w-[210px] text-stone-200">
        <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-2 mb-2">
          <span className="text-xs font-mono-journal text-stone-400 font-medium">
            {data.fullDateStr}
          </span>
          {data.hasEntry && (
            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-400 text-[10px] font-mono-journal">
              {data.entriesCount} {data.entriesCount === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        {data.hasEntry ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{data.moodEmoji}</span>
                <div>
                  <div className="text-sm font-bold font-serif-journal text-white">
                    {data.moodLabel}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono-journal">
                    Score: {data.score} / 8
                  </div>
                </div>
              </div>
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: data.mood ? MOOD_LEVELS[data.mood]?.hex : '#F59E0B' }}
              />
            </div>

            <div className="pt-1.5 border-t border-stone-800/80 space-y-1">
              <div className="text-[11px] font-serif-journal text-stone-300 font-medium line-clamp-2">
                "{data.titles[0]}"
                {data.titles.length > 1 && (
                  <span className="text-stone-500 text-[10px] ml-1">
                    (+{data.titles.length - 1} more)
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono-journal text-stone-500">
                {data.totalWords} words recorded
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-stone-500 italic py-1">
            No reflection recorded on this day
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="mood-trendline-card"
      className="bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-xl space-y-5"
    >
      {/* Header: Title, Controls, and Seed Sample Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-journal font-bold text-white text-lg flex items-center gap-2">
                Mood Trendline & Fluctuations
                {statsSummary.recordedDays > 0 && (
                  <span className="text-xs font-mono-journal font-normal px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400">
                    {statsSummary.recordedDays} of {timeframeDays} days tracked
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-400 font-mono-journal">
                Visualizing emotional valence and resonance over time
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[#181818] border border-stone-800 rounded-xl p-1 text-xs font-mono-journal">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setTimeframeDays(days)}
                className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                  timeframeDays === days
                    ? 'bg-amber-600 text-black font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>

          {/* Seed Fake / Sample Entries Button */}
          {onSeedSampleData && (
            <button
              id="btn-seed-sample-entries"
              type="button"
              onClick={handleSeedClick}
              disabled={isSeeding}
              title="Populate authentic 30-day reflection entries to test mood fluctuations"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 hover:border-amber-700 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSeeding ? 'Seeding...' : 'Seed 30-Day Sample Entries'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Seeded Success Feedback Toast */}
      {seededToast && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-mono-journal animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Successfully added realistic reflections across the last 30 days! The mood trendline has updated.
          </span>
        </div>
      )}

      {/* Highlight Insights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#161616] border border-[#242424] rounded-xl p-3">
          <span className="text-[10px] font-mono-journal uppercase text-stone-400 font-semibold block mb-1">
            Current Tone
          </span>
          <div className="text-sm font-serif-journal font-bold text-white truncate">
            {statsSummary.emotionalSummary}
          </div>
          <span className="text-[10px] font-mono-journal text-stone-400">
            Avg Score: {statsSummary.avgScore !== null ? `${statsSummary.avgScore}/8` : '—'}
          </span>
        </div>

        <div className="bg-[#161616] border border-[#242424] rounded-xl p-3">
          <span className="text-[10px] font-mono-journal uppercase text-stone-400 font-semibold block mb-1">
            Dominant Mood
          </span>
          <div className="text-sm font-serif-journal font-bold text-amber-300 flex items-center gap-1.5">
            {statsSummary.dominantMood ? (
              <>
                <span>{MOOD_LEVELS[statsSummary.dominantMood].emoji}</span>
                <span>{MOOD_LEVELS[statsSummary.dominantMood].label}</span>
              </>
            ) : (
              '—'
            )}
          </div>
          <span className="text-[10px] font-mono-journal text-stone-400">
            Most frequent reflection
          </span>
        </div>

        <div className="bg-[#161616] border border-[#242424] rounded-xl p-3">
          <span className="text-[10px] font-mono-journal uppercase text-stone-400 font-semibold block mb-1">
            Trajectory
          </span>
          <div className="text-sm font-serif-journal font-bold text-white flex items-center gap-1.5">
            <TrendingUp
              className={`w-3.5 h-3.5 ${
                statsSummary.trendDirection === 'up'
                  ? 'text-emerald-400'
                  : statsSummary.trendDirection === 'down'
                  ? 'text-rose-400 rotate-180'
                  : 'text-amber-400'
              }`}
            />
            <span className="capitalize">{statsSummary.trendDirection}</span>
          </div>
          <span className="text-[10px] font-mono-journal text-stone-400 truncate block">
            {statsSummary.trendText}
          </span>
        </div>

        <div className="bg-[#161616] border border-[#242424] rounded-xl p-3">
          <span className="text-[10px] font-mono-journal uppercase text-stone-400 font-semibold block mb-1">
            Active Density
          </span>
          <div className="text-sm font-serif-journal font-bold text-white">
            {Math.round((statsSummary.recordedDays / timeframeDays) * 100)}%
          </div>
          <span className="text-[10px] font-mono-journal text-stone-400">
            {statsSummary.recordedDays} logged days
          </span>
        </div>
      </div>

      {/* Main Recharts Area & Trendline Visualization */}
      <div className="pt-2">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -14, bottom: 0 }}
            >
              <defs>
                {/* Smooth Amber to Violet Warm Ambient Glow */}
                <linearGradient id="moodAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                  <stop offset="45%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="85%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>

                <linearGradient id="moodStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="35%" stopColor="#10B981" />
                  <stop offset="70%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#222222"
                vertical={false}
              />

              <XAxis
                dataKey="dayLabel"
                stroke="#444444"
                tick={{ fill: '#78716C', fontSize: 10, fontFamily: 'monospace' }}
                interval={timeframeDays === 7 ? 0 : timeframeDays === 14 ? 1 : 3}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#2A2A2A' }}
              />

              <YAxis
                domain={[0.5, 8.5]}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8]}
                stroke="#444444"
                tickLine={false}
                axisLine={{ stroke: '#2A2A2A' }}
                tick={({ x, y, payload }) => {
                  const item = SCORE_LABELS[payload.value];
                  if (!item) return null;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={3}
                        textAnchor="end"
                        fill="#888888"
                        fontSize={11}
                      >
                        {item.emoji}
                      </text>
                    </g>
                  );
                }}
              />

              {/* Equilibrium Reference Line */}
              <ReferenceLine
                y={4.5}
                stroke="#333333"
                strokeDasharray="4 4"
                label={{
                  value: 'Equilibrium',
                  fill: '#555555',
                  fontSize: 9,
                  position: 'insideTopRight',
                }}
              />

              <Tooltip content={renderCustomTooltip} />

              <Area
                type="monotone"
                dataKey="score"
                stroke="url(#moodStrokeGradient)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#moodAreaGradient)"
                connectNulls={true}
                activeDot={{
                  r: 6,
                  fill: '#FBBF24',
                  stroke: '#111111',
                  strokeWidth: 2,
                  className: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]',
                }}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload.hasEntry) return <g key={`dot-empty-${payload.date}`} />;
                  const color = payload.mood ? MOOD_LEVELS[payload.mood]?.hex : '#F59E0B';
                  return (
                    <circle
                      key={`dot-${payload.date}`}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill={color}
                      stroke="#111111"
                      strokeWidth={1.5}
                      className="transition-all hover:r-5 cursor-pointer"
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend and Valence Scale Guide */}
      <div className="pt-2 border-t border-[#1E1E1E] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-mono-journal text-stone-400">Valence Scale:</span>
          {Object.entries(MOOD_LEVELS).map(([key, config]) => (
            <span key={key} className="flex items-center gap-1 text-[11px] text-stone-400 font-mono-journal">
              <span>{config.emoji}</span>
              <span className="hidden md:inline">{config.label}</span>
              <span className="text-stone-400 text-[10px]">({config.score})</span>
            </span>
          ))}
        </div>

        <div className="text-[11px] text-stone-400 font-mono-journal italic">
          Hover data points for detailed journal reflections
        </div>
      </div>
    </div>
  );
};
