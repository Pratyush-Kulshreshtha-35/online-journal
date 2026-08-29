import React, { useState } from 'react';
import { JournalEntry } from '../types/journal';
import { MOODS } from '../data/prompts';
import {
  X,
  Calendar,
  Clock,
  Star,
  Edit2,
  Trash2,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { toggleEntryFavorite } from '../services/journalService';
import { useAuth } from '../context/AuthContext';

interface EntryDetailModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  const moodConfig = MOODS[entry.mood] || MOODS.reflective;

  const formattedFullDate = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCopy = () => {
    const text = `${entry.title}\n${entry.date}\n\n${entry.content}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFavorite = async () => {
    if (!user) return;
    try {
      await toggleEntryFavorite(user.uid, entry.id, entry.isFavorite);
      entry.isFavorite = !entry.isFavorite;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      id="entry-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0F0F0F] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden text-stone-200">
        {/* Top bar with actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#141414]">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${moodConfig.bgColor} ${moodConfig.textColor} ${moodConfig.borderColor}`}
            >
              <span>{moodConfig.emoji}</span>
              <span>{moodConfig.label}</span>
            </span>

            <button
              onClick={handleToggleFavorite}
              title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-1.5 rounded-lg transition ${
                entry.isFavorite ? 'text-amber-400' : 'text-stone-600 hover:text-stone-400'
              }`}
            >
              <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleCopy}
              title="Copy entry text"
              className="p-1.5 text-stone-400 hover:text-white hover:bg-[#222222] rounded-lg transition text-xs flex items-center gap-1"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(entry);
              }}
              title="Edit entry"
              className="p-1.5 text-stone-400 hover:text-white hover:bg-[#222222] rounded-lg transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onClose();
                onDelete(entry);
              }}
              title="Delete entry"
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-[#2A2A2A] mx-1" />

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-[#222222] rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Body */}
        <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10 sm:py-10 space-y-6 bg-[#0F0F0F]">
          {/* Date & Metrics header */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 font-mono-journal">
            <div className="flex items-center gap-1.5 text-amber-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>{formattedFullDate}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 text-stone-400">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>{entry.readingTime} min read</span>
            </div>
            <span>•</span>
            <span className="text-stone-400">{entry.wordCount} words</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-serif-journal font-bold text-white tracking-tight leading-snug">
            {entry.title}
          </h1>

          {/* Prompt banner */}
          {entry.promptUsed && (
            <div className="p-4 bg-amber-950/25 border border-amber-800/40 rounded-xl text-amber-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 block mb-0.5 font-mono-journal">
                  Reflection Prompt
                </span>
                <p className="italic font-serif-journal text-stone-200 text-sm leading-relaxed">{entry.promptUsed}</p>
              </div>
            </div>
          )}

          {/* Main Formatted Text */}
          <div className="text-stone-300 font-serif-journal text-lg sm:text-xl leading-relaxed whitespace-pre-wrap selection:bg-amber-950">
            {entry.content ? (
              <div className="space-y-4">
                <Markdown>{entry.content}</Markdown>
              </div>
            ) : (
              <p className="text-stone-600 italic">This entry has no written text.</p>
            )}
          </div>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="pt-6 border-t border-[#222222] flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg bg-[#181818] border border-[#282828] text-stone-300 text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
