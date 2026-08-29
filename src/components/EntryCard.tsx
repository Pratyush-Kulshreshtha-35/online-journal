import React from 'react';
import { JournalEntry } from '../types/journal';
import { MOODS } from '../data/prompts';
import { Star, Clock, MoreVertical, Edit2, Trash2, Sparkles } from 'lucide-react';
import { toggleEntryFavorite } from '../services/journalService';
import { useAuth } from '../context/AuthContext';

interface EntryCardProps {
  entry: JournalEntry;
  onSelect: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const moodConfig = MOODS[entry.mood] || MOODS.reflective;

  const formattedDate = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await toggleEntryFavorite(user.uid, entry.id, entry.isFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  return (
    <div
      id={`entry-card-${entry.id}`}
      onClick={() => onSelect(entry)}
      className="group relative bg-[#121212] hover:bg-[#161616] border border-[#222222] hover:border-[#333333] rounded-2xl p-5 shadow-xl hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top bar: Mood, Date, Favorite, Menu */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {/* Mood pill */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-medium border ${moodConfig.bgColor} ${moodConfig.textColor} ${moodConfig.borderColor}`}
            >
              <span>{moodConfig.emoji}</span>
              <span>{moodConfig.label}</span>
            </span>

            {/* Date */}
            <span className="text-[11px] text-amber-500/80 font-mono-journal uppercase tracking-wider">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Favorite Star */}
            <button
              id={`fav-btn-${entry.id}`}
              type="button"
              onClick={handleFavoriteClick}
              title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-1.5 rounded-lg transition ${
                entry.isFavorite
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-stone-600 hover:text-stone-400 opacity-0 group-hover:opacity-100'
              }`}
            >
              <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Options Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1.5 text-stone-500 hover:text-stone-300 rounded-lg hover:bg-[#1F1F1F] opacity-0 group-hover:opacity-100 transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 mt-1 w-36 bg-[#141414] border border-[#2A2A2A] rounded-xl shadow-2xl py-1 z-30 text-xs text-stone-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(entry);
                      }}
                      className="w-full text-left px-3 py-1.5 text-stone-300 hover:text-white hover:bg-[#1F1F1F] flex items-center gap-2 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete(entry);
                      }}
                      className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-serif-journal font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
          {entry.title}
        </h3>

        {/* Prompt indicator if any */}
        {entry.promptUsed && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-400/80 italic font-serif-journal line-clamp-1">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Prompt: {entry.promptUsed}</span>
          </div>
        )}

        {/* Excerpt */}
        <p className="mt-2 text-stone-400 text-sm font-serif-journal line-clamp-3 leading-relaxed">
          {entry.content.replace(/[#*`>-]/g, '').trim() || 'No text recorded in this entry.'}
        </p>
      </div>

      {/* Footer: Tags & Reading stats */}
      <div className="mt-4 pt-3 border-t border-[#1F1F1F] flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          {entry.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-[#181818] border border-[#262626] text-stone-300 text-[11px] font-medium"
            >
              #{tag}
            </span>
          ))}
          {entry.tags && entry.tags.length > 3 && (
            <span className="text-[10px] text-stone-500 font-mono-journal">+{entry.tags.length - 3}</span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono-journal text-[11px] text-stone-500 shrink-0">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-stone-600" />
            <span>{entry.readingTime}m</span>
          </span>
          <span>•</span>
          <span>{entry.wordCount}w</span>
        </div>
      </div>
    </div>
  );
};
