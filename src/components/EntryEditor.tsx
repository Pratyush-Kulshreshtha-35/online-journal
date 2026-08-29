import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Sparkles,
  Calendar,
  Tag,
  Smile,
  Save,
  Bold,
  Italic,
  Heading2,
  Quote,
  List,
  Minus,
  HelpCircle,
  Eye,
  Edit3,
} from 'lucide-react';
import { JournalEntry, MoodType } from '../types/journal';
import { MOODS, DEFAULT_TAGS, PROMPTS } from '../data/prompts';
import { addJournalEntry, updateJournalEntry, calculateReadingStats } from '../services/journalService';
import confetti from 'canvas-confetti';
import Markdown from 'react-markdown';

interface EntryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialEntry?: JournalEntry | null;
  initialPrompt?: string | null;
  onSaved?: () => void;
}

export const EntryEditor: React.FC<EntryEditorProps> = ({
  isOpen,
  onClose,
  initialEntry,
  initialPrompt,
  onSaved,
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('reflective');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [promptUsed, setPromptUsed] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);

  const [showPromptDrawer, setShowPromptDrawer] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or reset form when initialEntry changes
  useEffect(() => {
    if (initialEntry) {
      setTitle(initialEntry.title);
      setContent(initialEntry.content);
      setMood(initialEntry.mood);
      setDate(initialEntry.date);
      setTags(initialEntry.tags || []);
      setPromptUsed(initialEntry.promptUsed);
      setIsFavorite(initialEntry.isFavorite);
    } else {
      setTitle('');
      setContent('');
      setMood('reflective');
      setDate(new Date().toISOString().split('T')[0]);
      setTags(['Daily Log']);
      setPromptUsed(initialPrompt || undefined);
      setIsFavorite(false);
    }
    setSaveSuccess(false);
  }, [initialEntry, initialPrompt, isOpen]);

  // Keyboard shortcut Ctrl/Cmd + S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, title, content, mood, date, tags, promptUsed, isFavorite, user]);

  if (!isOpen) return null;

  const readingStats = calculateReadingStats(content);

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddNewTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = newTagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 50);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!title.trim() && !content.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const finalTitle = title.trim() || 'Untitled Journal Note';

      if (initialEntry) {
        await updateJournalEntry(user.uid, initialEntry.id, {
          title: finalTitle,
          content,
          mood,
          date,
          tags,
          promptUsed,
          isFavorite,
        });
      } else {
        await addJournalEntry(user.uid, {
          title: finalTitle,
          content,
          mood,
          date,
          tags,
          promptUsed,
          isFavorite,
        });

        // Trigger celebratory confetti for newly created entry!
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#d97706', '#059669', '#2563eb', '#7c3aed'],
          });
        } catch {}
      }

      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 350);
    } catch (err) {
      console.error('Error saving journal entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="entry-editor-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0F0F0F] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden text-stone-200">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-serif-journal font-semibold text-white">
                {initialEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
              </span>
              {saveSuccess && (
                <span className="text-xs font-medium text-amber-400 bg-amber-950/60 border border-amber-700/60 px-2.5 py-0.5 rounded-full animate-fade-in font-mono-journal">
                  Saved to Firestore
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Edit vs Preview */}
            <div className="flex p-0.5 bg-[#1C1C1C] rounded-lg text-xs border border-[#282828]">
              <button
                id="btn-mode-edit"
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                  !previewMode ? 'bg-[#282828] text-amber-400 shadow-xs' : 'text-stone-400'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Write</span>
              </button>
              <button
                id="btn-mode-preview"
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                  previewMode ? 'bg-[#282828] text-amber-400 shadow-xs' : 'text-stone-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <button
              id="btn-editor-close"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-[#222222] rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 bg-[#0F0F0F]">
          {/* Top metadata toolbar: Date, Mood selector */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#222222]">
            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <input
                id="entry-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#161616] text-xs sm:text-sm font-mono-journal font-medium text-stone-200 border border-[#2A2A2A] rounded-lg px-2.5 py-1 hover:border-amber-600/50 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Inspiration Prompt Trigger */}
            <button
              id="btn-toggle-prompts"
              type="button"
              onClick={() => setShowPromptDrawer(!showPromptDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition font-medium ${
                showPromptDrawer || promptUsed
                  ? 'bg-amber-950/50 border-amber-700/70 text-amber-300'
                  : 'bg-[#161616] hover:bg-[#1F1F1F] border-[#2A2A2A] text-stone-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{promptUsed ? 'Prompt Active' : 'Need Inspiration?'}</span>
            </button>
          </div>

          {/* Active Prompt Banner if selected */}
          {promptUsed && (
            <div className="relative p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-400 uppercase tracking-widest text-[10px] block mb-0.5 font-mono-journal">
                    Writing Prompt
                  </span>
                  <p className="italic font-serif-journal text-sm text-stone-200 leading-relaxed">{promptUsed}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromptUsed(undefined)}
                title="Remove prompt banner"
                className="text-amber-400 hover:text-amber-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Prompt Selector Drawer */}
          {showPromptDrawer && (
            <div className="p-4 bg-[#141414] border border-[#282828] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider font-mono-journal">
                  Choose a Reflection Prompt
                </span>
                <button
                  type="button"
                  onClick={() => setShowPromptDrawer(false)}
                  className="text-stone-500 hover:text-stone-300 text-xs"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPromptUsed(p.text);
                      if (!title) setTitle(p.category + ': ' + p.text.slice(0, 30) + '...');
                      setShowPromptDrawer(false);
                    }}
                    className="text-left p-2.5 bg-[#181818] hover:bg-[#201D16] border border-[#2A2A2A] hover:border-amber-700/60 rounded-lg text-xs transition"
                  >
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest block font-mono-journal">
                      {p.category}
                    </span>
                    <p className="text-stone-300 font-serif-journal line-clamp-2 mt-0.5">{p.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mood Selector Strip */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-mono-journal">
              <Smile className="w-3.5 h-3.5 text-amber-500" />
              <span>How are you feeling?</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MOODS) as MoodType[]).map((key) => {
                const item = MOODS[key];
                const isSelected = mood === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMood(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? `${item.bgColor} ${item.textColor} ${item.borderColor} ring-1 ring-amber-500/50 shadow-xs font-semibold scale-105`
                        : 'bg-[#161616] hover:bg-[#1E1E1E] border-[#262626] text-stone-400'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <input
              id="entry-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title..."
              className="w-full text-xl sm:text-2xl font-serif-journal font-bold text-white placeholder:text-stone-700 bg-transparent border-0 border-b border-[#262626] focus:border-amber-500 focus:outline-hidden pb-2 transition"
            />
          </div>

          {/* Content Editor / Preview */}
          {!previewMode ? (
            <div className="space-y-2">
              {/* Markdown Helper Toolbar */}
              <div className="flex items-center flex-wrap gap-1 p-1 bg-[#141414] border border-[#242424] rounded-lg text-xs text-stone-400">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  title="Bold (**text**)"
                  className="p-1.5 hover:bg-[#222222] hover:text-white rounded transition"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  title="Italic (*text*)"
                  className="p-1.5 hover:bg-[#222222] hover:text-white rounded transition"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n## ', '\n')}
                  title="Heading (## Heading)"
                  className="p-1.5 hover:bg-[#222222] hover:text-white rounded transition"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n> ', '\n')}
                  title="Quote block (> Quote)"
                  className="p-1.5 hover:bg-[#222222] hover:text-white rounded transition"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n- ', '\n')}
                  title="Bullet list (- Item)"
                  className="p-1.5 hover:bg-[#222222] hover:text-white rounded transition"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n---\n')}
                  title="Divider (---)"
                  className="p-1.5 hover:bg-[#222222] hover:text-white rounded transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="ml-auto pr-2 text-[10px] text-stone-500 font-mono-journal">
                  Markdown supported
                </div>
              </div>

              {/* Main Textarea */}
              <textarea
                id="entry-content-input"
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What is on your mind today? Write freely without judgment..."
                rows={12}
                className="w-full p-4 bg-[#121212] border border-[#242424] rounded-xl text-stone-200 font-serif-journal text-base sm:text-lg leading-relaxed placeholder:text-stone-700 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30 transition resize-y min-h-[220px]"
              />
            </div>
          ) : (
            /* Rendered Markdown Preview */
            <div className="p-5 bg-[#121212] border border-[#242424] rounded-xl min-h-[220px]">
              <div className="prose prose-invert max-w-none text-stone-300 font-serif-journal text-base sm:text-lg leading-relaxed">
                {content ? (
                  <div className="space-y-4">
                    <Markdown>{content}</Markdown>
                  </div>
                ) : (
                  <p className="text-stone-600 italic">No content written yet...</p>
                )}
              </div>
            </div>
          )}

          {/* Tags Selector & Creator */}
          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-mono-journal">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Tags & Categories</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {DEFAULT_TAGS.map((t) => {
                const isSelected = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToggleTag(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-amber-600 text-black border-amber-600 font-semibold'
                        : 'bg-[#161616] hover:bg-[#1E1E1E] border-[#282828] text-stone-400'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}

              {/* Custom Tags */}
              {tags
                .filter((t) => !DEFAULT_TAGS.includes(t))
                .map((customTag) => (
                  <span
                    key={customTag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-700/60"
                  >
                    #{customTag}
                    <button
                      type="button"
                      onClick={() => handleToggleTag(customTag)}
                      className="hover:text-amber-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

              {/* Custom Tag Input */}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddNewTag}
                  placeholder="+ Add custom tag"
                  className="px-2.5 py-1 bg-[#161616] text-xs border border-dashed border-[#333333] rounded-lg text-stone-300 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-600 w-32"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Reading metrics & Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#222222] bg-[#141414] text-xs">
          <div className="flex items-center gap-4 text-stone-500 font-mono-journal">
            <span>{readingStats.wordCount} words</span>
            <span>~{readingStats.readingTime} min read</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-editor"
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-stone-400 hover:text-stone-200 font-medium transition"
            >
              Cancel
            </button>
            <button
              id="btn-save-entry"
              type="button"
              onClick={handleSave}
              disabled={isSaving || (!title.trim() && !content.trim())}
              className="flex items-center gap-1.5 px-6 py-2 bg-amber-600 hover:bg-amber-500 text-black font-semibold rounded-lg shadow-[0_0_15px_rgba(217,119,6,0.25)] transition disabled:opacity-50"
            >
              {isSaving ? (
                <span className="inline-block w-4 h-4 border-2 border-stone-800 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{initialEntry ? 'Update Entry' : 'Commit to Firestore'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
