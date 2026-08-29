import React, { useState } from 'react';
import { JournalEntry } from '../types/journal';
import { MOODS } from '../data/prompts';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  BookOpen,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
} from 'date-fns';

interface CalendarViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onOpenNewEntry: (presetDate?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  onSelectEntry,
  onOpenNewEntry,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // Group entries by date YYYY-MM-DD
  const entriesByDate: Record<string, JournalEntry[]> = {};
  entries.forEach((e) => {
    if (!entriesByDate[e.date]) {
      entriesByDate[e.date] = [];
    }
    entriesByDate[e.date].push(e);
  });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayEntries = entriesByDate[selectedDateStr] || [];

  // Generate calendar days
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const dateStr = format(cloneDay, 'yyyy-MM-dd');
      const dayEntries = entriesByDate[dateStr] || [];
      const isSelected = isSameDay(cloneDay, selectedDate);
      const isCurrentMonth = isSameMonth(cloneDay, monthStart);
      const isToday = isSameDay(cloneDay, new Date());

      days.push(
        <button
          key={dateStr}
          onClick={() => setSelectedDate(cloneDay)}
          className={`min-h-[70px] sm:min-h-[85px] p-1.5 sm:p-2 border rounded-xl text-left flex flex-col justify-between transition-all relative ${
            !isCurrentMonth
              ? 'bg-[#0B0B0B] border-[#1C1C1C] text-stone-700 opacity-40'
              : 'bg-[#141414] border-[#222222] text-stone-300'
          } ${
            isSelected
              ? 'ring-2 ring-amber-500 bg-[#1F1A12] border-amber-500/50 shadow-md z-10'
              : 'hover:bg-[#1A1A1A]'
          }`}
        >
          {/* Day Number */}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-mono-journal font-semibold inline-flex items-center justify-center w-5 h-5 rounded-full ${
                isToday
                  ? 'bg-amber-600 text-black font-bold'
                  : isSelected
                  ? 'text-amber-400 font-bold'
                  : 'text-stone-300'
              }`}
            >
              {format(cloneDay, 'd')}
            </span>

            {dayEntries.length > 0 && (
              <span className="text-[10px] font-mono-journal font-medium text-amber-400 bg-[#222222] border border-[#2E2E2E] px-1 rounded-sm">
                {dayEntries.length}
              </span>
            )}
          </div>

          {/* Mood dots for entries */}
          <div className="flex items-center gap-1 flex-wrap mt-1">
            {dayEntries.slice(0, 3).map((e) => {
              const mood = MOODS[e.mood] || MOODS.reflective;
              return (
                <span
                  key={e.id}
                  title={`${mood.label}: ${e.title}`}
                  className={`w-2 h-2 rounded-full ${mood.accentDot} shadow-xs`}
                />
              );
            })}
          </div>
        </button>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toISOString()} className="grid grid-cols-7 gap-1 sm:gap-2">
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid Section */}
      <div className="lg:col-span-2 bg-[#111111] border border-[#222222] rounded-2xl p-4 sm:p-6 shadow-xl">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#222222]">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif-journal font-bold text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <p className="text-xs text-amber-500/80 font-mono-journal">
              {entries.length} recorded entries
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-2.5 py-1.5 text-xs font-semibold bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] rounded-lg text-stone-200 transition"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg border border-[#2A2A2A] hover:bg-[#1C1C1C] text-stone-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg border border-[#2A2A2A] hover:bg-[#1C1C1C] text-stone-400 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-mono-journal text-stone-500 uppercase tracking-wider font-semibold">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Month Grid */}
        <div className="space-y-1 sm:space-y-2">{rows}</div>
      </div>

      {/* Selected Day Inspector Sidebar */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#222222] mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif-journal font-bold text-white text-base">
                {format(selectedDate, 'EEEE, MMM d, yyyy')}
              </h3>
            </div>
            <button
              onClick={() => onOpenNewEntry(selectedDateStr)}
              title="Add entry for this date"
              className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-semibold shadow-[0_0_12px_rgba(217,119,6,0.25)] transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {selectedDayEntries.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-stone-400 font-mono-journal">
                {selectedDayEntries.length} {selectedDayEntries.length === 1 ? 'entry' : 'entries'} on this day:
              </p>
              {selectedDayEntries.map((e) => {
                const mood = MOODS[e.mood] || MOODS.reflective;
                return (
                  <div
                    key={e.id}
                    onClick={() => onSelectEntry(e)}
                    className="p-3.5 bg-[#161616] hover:bg-[#1C1C1C] border border-[#262626] rounded-xl cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs">{mood.emoji}</span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${mood.bgColor} ${mood.textColor} ${mood.borderColor}`}
                      >
                        {mood.label}
                      </span>
                    </div>
                    <h4 className="font-serif-journal font-bold text-white text-sm group-hover:text-amber-400 transition-colors line-clamp-1">
                      {e.title}
                    </h4>
                    <p className="text-xs text-stone-400 font-serif-journal line-clamp-2 mt-1">
                      {e.content.replace(/[#*`>-]/g, '').trim()}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-stone-500 space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#181818] border border-[#262626] flex items-center justify-center text-stone-400">
                <BookOpen className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xs font-serif-journal text-stone-400">
                No entries written on {format(selectedDate, 'MMM d')}.
              </p>
              <button
                onClick={() => onOpenNewEntry(selectedDateStr)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-amber-400 text-xs font-semibold rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write for this date</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
