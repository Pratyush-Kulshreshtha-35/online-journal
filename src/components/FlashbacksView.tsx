import React, { useMemo } from 'react';
import { JournalEntry } from '../types/journal';
import { History, Calendar, Sparkles, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { EntryCard } from './EntryCard';

interface FlashbacksViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entry: JournalEntry) => void;
  onWriteNewEntry: () => void;
}

export const FlashbacksView: React.FC<FlashbacksViewProps> = ({
  entries,
  onSelectEntry,
  onEditEntry,
  onDeleteEntry,
  onWriteNewEntry,
}) => {
  // Find entries that match "On this day" (same MM-DD in previous years or exactly 7 / 30 days ago)
  const { onThisDayEntries, recentMilestoneEntries } = useMemo(() => {
    const today = new Date();
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayStr = today.toISOString().split('T')[0];

    const onThisDay: JournalEntry[] = [];
    const milestones: { label: string; entry: JournalEntry }[] = [];

    // Target milestones: 7 days ago, 14 days ago, 30 days ago, 60 days ago, 90 days ago, 365 days ago
    const targetDeltas: { days: number; label: string }[] = [
      { days: 7, label: '1 Week Ago' },
      { days: 14, label: '2 Weeks Ago' },
      { days: 30, label: '1 Month Ago' },
      { days: 60, label: '2 Months Ago' },
      { days: 90, label: '3 Months Ago' },
      { days: 365, label: '1 Year Ago' },
    ];

    entries.forEach((e) => {
      if (e.date === todayStr) return; // Skip today's entry

      const entryDate = new Date(e.date + 'T00:00:00');
      const entryMonthDay = e.date.slice(5);

      if (entryMonthDay === todayMonthDay) {
        onThisDay.push(e);
      }

      // Check approximate day differences
      const diffMs = today.getTime() - entryDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      for (const target of targetDeltas) {
        if (Math.abs(diffDays - target.days) <= 1) {
          milestones.push({ label: target.label, entry: e });
          break;
        }
      }
    });

    return {
      onThisDayEntries: onThisDay,
      recentMilestoneEntries: milestones,
    };
  }, [entries]);

  return (
    <div id="flashbacks-view" className="space-y-8 animate-fade-in pb-12">
      {/* Hero Header */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#161616] via-[#121212] to-[#0D0D0D] border border-[#242424] rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-950/50 border border-amber-800/50 text-amber-400 flex items-center justify-center shadow-lg">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif-journal font-bold text-white">
              On This Day & Time Travel
            </h2>
            <p className="text-xs text-stone-400 font-mono-journal">
              Revisiting past thoughts to honor how much you've grown
            </p>
          </div>
        </div>
        <p className="text-stone-300 font-serif-journal text-sm sm:text-base max-w-2xl leading-relaxed mt-3">
          "We do not learn from experience... we learn from reflecting on experience." Reading past entries reveals recurring patterns, forgotten breakthroughs, and the quiet resilience of your former self.
        </p>
      </div>

      {/* On This Day exact matches */}
      {onThisDayEntries.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-serif-journal font-bold text-white">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Written on this calendar day in past years</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onThisDayEntries.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                onSelect={onSelectEntry}
                onEdit={onEditEntry}
                onDelete={onDeleteEntry}
              />
            ))}
          </div>
        </div>
      ) : (
        recentMilestoneEntries.length === 0 && (
          <div className="p-8 bg-[#121212] border border-[#222222] rounded-3xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-[#262626] text-amber-500 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif-journal text-lg font-bold text-white">
                Building Your Timeline
              </h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                As you continue journaling regularly, your memories from 1 week ago, 1 month ago, and exact anniversary dates will populate here automatically.
              </p>
            </div>
            <button
              onClick={onWriteNewEntry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-xs shadow-md transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Write Today's Memory</span>
            </button>
          </div>
        )
      )}

      {/* Milestone Flashbacks */}
      {recentMilestoneEntries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-serif-journal font-bold text-white">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Milestone Reflections</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMilestoneEntries.map(({ label, entry }) => (
              <div key={entry.id} className="relative flex flex-col">
                <div className="mb-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/50 border border-amber-800/40 text-amber-400 text-[10px] font-mono-journal w-fit">
                  {label}
                </div>
                <EntryCard
                  entry={entry}
                  onSelect={onSelectEntry}
                  onEdit={onEditEntry}
                  onDelete={onDeleteEntry}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
