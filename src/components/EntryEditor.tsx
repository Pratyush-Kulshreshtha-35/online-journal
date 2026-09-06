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
  Eye,
  Edit3,
  Lock,
  Unlock,
  Mic,
  LayoutTemplate,
  MessageSquareQuote,
  Loader2,
  Maximize2,
  Minimize2,
  Headphones,
  Volume2,
  VolumeX,
  CloudSun,
  MapPin,
  Compass,
} from 'lucide-react';
import { JournalEntry, MoodType, MediaAttachment, JournalTemplate, WeatherStamp, LocationTag } from '../types/journal';
import { MOODS, DEFAULT_TAGS, PROMPTS } from '../data/prompts';
import { addJournalEntry, updateJournalEntry, calculateReadingStats } from '../services/journalService';
import { VoiceRecorder } from '../services/mediaService';
import { transcribeAudio } from '../services/aiService';
import { soundscapeService, SOUNDSCAPES, SoundscapeType } from '../services/soundscapeService';
import { getUserCurrentPosition, fetchCurrentWeather, reverseGeocodeLocation, searchPlaces } from '../services/weatherService';
import { WeatherBadge } from './WeatherBadge';
import { MediaManager } from './MediaManager';
import { SocraticPartnerDrawer } from './SocraticPartnerDrawer';
import { TemplateSelectorDrawer } from './TemplateSelectorDrawer';
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
  const [media, setMedia] = useState<MediaAttachment[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  // Drawer toggles
  const [showPromptDrawer, setShowPromptDrawer] = useState(false);
  const [showSocraticDrawer, setShowSocraticDrawer] = useState(false);
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Voice Dictation (Microphone Recording + Gemini Flash Transcription)
  const [isDictating, setIsDictating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [dictationNotice, setDictationNotice] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const recordTimerRef = useRef<any>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Zen Focus Mode state
  const [isZenMode, setIsZenMode] = useState(false);
  const [zenSoundPlaying, setZenSoundPlaying] = useState(false);
  const [zenCurrentSound, setZenCurrentSound] = useState<SoundscapeType>('rain');

  // Weather & Location Tagging state
  const [location, setLocation] = useState<LocationTag | undefined>(undefined);
  const [weather, setWeather] = useState<WeatherStamp | undefined>(undefined);
  const [isStampingLocation, setIsStampingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [placeSearchResults, setPlaceSearchResults] = useState<LocationTag[]>([]);

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
      setMedia(initialEntry.media || []);
      setIsLocked(Boolean(initialEntry.isLocked));
      setLocation(initialEntry.location);
      setWeather(initialEntry.weather);
    } else {
      setTitle('');
      setContent('');
      setMood('reflective');
      setDate(new Date().toISOString().split('T')[0]);
      setTags(['Daily Log']);
      setPromptUsed(initialPrompt || undefined);
      setIsFavorite(false);
      setMedia([]);
      setIsLocked(false);
      setLocation(undefined);
      setWeather(undefined);
    }
    setSaveSuccess(false);
    setShowPromptDrawer(false);
    setShowSocraticDrawer(false);
    setShowTemplateDrawer(false);
  }, [initialEntry, initialPrompt, isOpen]);

  // Voice Dictation cleanup when editor closes
  useEffect(() => {
    if (!isOpen) {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (voiceRecorderRef.current) {
        voiceRecorderRef.current.cancel();
        voiceRecorderRef.current = null;
      }
      setIsDictating(false);
      setIsTranscribing(false);
    }
  }, [isOpen]);

  const toggleDictation = async () => {
    if (isTranscribing) return;

    // If currently dictating, stop recording and send to AI transcribe
    if (isDictating) {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setIsDictating(false);

      if (voiceRecorderRef.current) {
        setIsTranscribing(true);
        setDictationNotice('Transcribing audio with Gemini...');

        try {
          const result = await voiceRecorderRef.current.stop();
          voiceRecorderRef.current = null;

          if (!result || !result.blob || result.blob.size < 600) {
            setDictationNotice('Voice recording was too brief');
            setTimeout(() => setDictationNotice(null), 2500);
            setIsTranscribing(false);
            return;
          }

          const transcribed = await transcribeAudio(result.blob);
          if (transcribed && transcribed.trim()) {
            setContent((prev) => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed}\n\n${transcribed.trim()}` : transcribed.trim();
            });
            setDictationNotice('Transcribed!');
            setTimeout(() => setDictationNotice(null), 2500);
          } else {
            setDictationNotice('No speech detected');
            setTimeout(() => setDictationNotice(null), 2500);
          }
        } catch (err: any) {
          console.warn('Voice transcription error:', err);
          const rawMsg = String(err?.message || '');
          const isHighDemand = rawMsg.includes('high demand') || rawMsg.includes('high traffic') || rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE');
          setDictationNotice(
            isHighDemand
              ? 'AI service experiencing high demand. Tap mic to retry.'
              : rawMsg || 'Transcription failed. Check Gemini API key.'
          );
          setTimeout(() => setDictationNotice(null), 4500);
        } finally {
          setIsTranscribing(false);
        }
      }
      return;
    }

    // Start voice recording session
    setDictationNotice(null);
    setRecordSeconds(0);
    try {
      const recorder = new VoiceRecorder();
      await recorder.start();
      voiceRecorderRef.current = recorder;
      setIsDictating(true);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setDictationNotice('Microphone permission required');
      setTimeout(() => setDictationNotice(null), 3500);
    }
  };

  // Keyboard shortcut Ctrl/Cmd + S to save, and Escape to exit Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isZenMode, title, content, mood, date, tags, promptUsed, isFavorite, media, isLocked, user]);

  // Clean up soundscape on close
  useEffect(() => {
    if (!isOpen && zenSoundPlaying) {
      soundscapeService.stop();
      setZenSoundPlaying(false);
    }
  }, [isOpen, zenSoundPlaying]);

  const handleToggleZenSound = (soundType?: SoundscapeType) => {
    const target = soundType || zenCurrentSound;
    if (zenSoundPlaying && (!soundType || soundType === zenCurrentSound)) {
      soundscapeService.stop();
      setZenSoundPlaying(false);
    } else {
      soundscapeService.play(target);
      setZenCurrentSound(target);
      setZenSoundPlaying(true);
    }
  };

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

  const handleApplyTemplate = (tmpl: JournalTemplate) => {
    if (!title) setTitle(tmpl.titleSuggestion);
    setMood(tmpl.mood);
    setTags((prev) => Array.from(new Set([...prev, ...tmpl.defaultTags])));
    setContent((prev) => (prev.trim() ? prev + '\n\n' + tmpl.structure : tmpl.structure));
  };

  const handleInsertSocraticQuestion = (question: string) => {
    setContent((prev) => prev + `\n\n### 🕊️ Reflection: ${question}\n`);
  };

  const handleStampWeatherAndLocation = async () => {
    setIsStampingLocation(true);
    setLocationError(null);
    try {
      const coords = await getUserCurrentPosition();
      const [weatherData, locationData] = await Promise.all([
        fetchCurrentWeather(coords.latitude, coords.longitude),
        reverseGeocodeLocation(coords.latitude, coords.longitude),
      ]);
      setWeather(weatherData);
      setLocation(locationData);
    } catch (err: any) {
      console.warn('Could not auto-stamp location/weather:', err);
      setLocationError(err.message || 'Could not retrieve location');
      setTimeout(() => setLocationError(null), 4000);
    } finally {
      setIsStampingLocation(false);
    }
  };

  const handleSearchPlaces = async (query: string) => {
    setSearchLocationQuery(query);
    if (!query.trim() || query.length < 2) {
      setPlaceSearchResults([]);
      return;
    }
    setSearchingPlaces(true);
    try {
      const results = await searchPlaces(query);
      setPlaceSearchResults(results);
    } catch (err) {
      console.error('Failed to search places:', err);
    } finally {
      setSearchingPlaces(false);
    }
  };

  const handleSelectPlace = async (loc: LocationTag) => {
    setLocation(loc);
    setShowLocationModal(false);
    setSearchLocationQuery('');
    setPlaceSearchResults([]);
    try {
      const weatherData = await fetchCurrentWeather(loc.latitude, loc.longitude);
      setWeather(weatherData);
    } catch {}
  };

  const handleSave = async () => {
    if (!user) return;
    if (!title.trim() && !content.trim() && media.length === 0) {
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
          media,
          isLocked,
          location,
          weather,
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
          media,
          isLocked,
          location,
          weather,
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

  // Fullscreen Zen Focus Sanctuary Writing Mode
  if (isZenMode) {
    return (
      <div
        id="zen-focus-sanctuary"
        className="fixed inset-0 z-50 flex flex-col bg-[#070707] text-stone-200 overflow-y-auto selection:bg-amber-950"
      >
        {/* Subtle Zen Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#070707]/90 backdrop-blur-md border-b border-stone-900 transition-opacity">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-serif-journal font-bold text-white text-base tracking-wide">
                Zen Sanctuary
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-mono-journal hidden sm:inline">
              Distraction-free focus writing
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Ambient Soundscape Controller */}
            <div className="flex items-center gap-1.5 bg-[#121212] border border-stone-800 px-3 py-1.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => handleToggleZenSound()}
                className={`flex items-center gap-1.5 font-medium transition cursor-pointer ${
                  zenSoundPlaying ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Toggle ambient background sound"
              >
                <Headphones className={`w-3.5 h-3.5 ${zenSoundPlaying ? 'animate-pulse' : ''}`} />
                <span className="font-mono-journal text-[11px]">
                  {zenSoundPlaying ? SOUNDSCAPES.find((s) => s.id === zenCurrentSound)?.emoji : 'Sound'}
                </span>
              </button>

              <div className="flex items-center gap-1 border-l border-stone-800 pl-2 ml-1">
                {SOUNDSCAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleZenSound(s.id)}
                    title={s.name}
                    className={`p-1 rounded-md text-xs transition cursor-pointer ${
                      zenCurrentSound === s.id && zenSoundPlaying
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'
                    }`}
                  >
                    <span>{s.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Save */}
            <button
              id="btn-zen-save"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>

            {/* Exit Zen Mode */}
            <button
              id="btn-zen-exit"
              type="button"
              onClick={() => setIsZenMode(false)}
              className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl text-xs font-medium transition border border-stone-800 cursor-pointer"
              title="Exit Zen mode (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit (Esc)</span>
            </button>
          </div>
        </header>

        {/* Zen Distraction-Free Canvas */}
        <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-10 flex flex-col space-y-6">
          {promptUsed && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-300/80 text-xs font-serif-journal italic">
              Prompt: {promptUsed}
            </div>
          )}

          <input
            id="zen-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title of this reflection..."
            className="w-full bg-transparent text-2xl sm:text-3xl font-serif-journal font-bold text-white placeholder:text-stone-700 outline-none pb-3 border-b border-stone-900 focus:border-stone-800 transition"
          />

          <textarea
            id="zen-content-textarea"
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Let your thoughts flow freely, breathing with each word..."
            className="w-full flex-1 bg-transparent text-lg sm:text-xl font-serif-journal text-stone-200 placeholder:text-stone-700 outline-none resize-none leading-relaxed min-h-[500px]"
            autoFocus
          />

          {/* Minimalist Bottom Footer */}
          <footer className="pt-6 border-t border-stone-900 flex items-center justify-between text-xs font-mono-journal text-stone-500">
            <div className="flex items-center gap-3">
              <span>{readingStats.wordCount} words</span>
              <span>•</span>
              <span>~{readingStats.readingTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{MOODS[mood]?.emoji} {MOODS[mood]?.label}</span>
              <span>•</span>
              <span>{date}</span>
            </div>
          </footer>
        </main>
      </div>
    );
  }

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
            {/* PIN Vault Lock Toggle */}
            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              title={isLocked ? 'Locked in Vault (PIN required)' : 'Lock with PIN'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                isLocked
                  ? 'bg-amber-950/70 border-amber-700/80 text-amber-300 shadow-[0_0_10px_rgba(217,119,6,0.3)]'
                  : 'bg-[#181818] border-[#2A2A2A] text-stone-400 hover:text-stone-200'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isLocked ? 'Locked' : 'Lock Entry'}</span>
            </button>

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

            {/* Zen Focus Mode Button */}
            <button
              id="btn-toggle-zen-mode"
              type="button"
              onClick={() => setIsZenMode(true)}
              title="Enter Zen Focus Sanctuary (Distraction-Free)"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 hover:border-amber-700 text-amber-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zen Mode</span>
            </button>

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
          {/* Top metadata toolbar: Date, Frameworks, Socratic Partner, Prompts */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#222222]">
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

            {/* Smart Writing Assist Tools */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Framework Templates button */}
              <button
                type="button"
                onClick={() => {
                  setShowTemplateDrawer(!showTemplateDrawer);
                  setShowSocraticDrawer(false);
                  setShowPromptDrawer(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition font-medium ${
                  showTemplateDrawer
                    ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                    : 'bg-[#161616] hover:bg-[#1F1F1F] border-[#2A2A2A] text-stone-300'
                }`}
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
                <span>Templates</span>
              </button>

              {/* Socratic Partner button */}
              <button
                type="button"
                onClick={() => {
                  setShowSocraticDrawer(!showSocraticDrawer);
                  setShowTemplateDrawer(false);
                  setShowPromptDrawer(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition font-medium ${
                  showSocraticDrawer
                    ? 'bg-amber-950/60 border-amber-700 text-amber-300 shadow-[0_0_10px_rgba(217,119,6,0.3)]'
                    : 'bg-[#161616] hover:bg-[#1F1F1F] border-[#2A2A2A] text-stone-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Ask Socratic Partner</span>
              </button>

              {/* Inspiration Prompt Trigger */}
              <button
                id="btn-toggle-prompts"
                type="button"
                onClick={() => {
                  setShowPromptDrawer(!showPromptDrawer);
                  setShowSocraticDrawer(false);
                  setShowTemplateDrawer(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition font-medium ${
                  showPromptDrawer || promptUsed
                    ? 'bg-amber-950/50 border-amber-700/70 text-amber-300'
                    : 'bg-[#161616] hover:bg-[#1F1F1F] border-[#2A2A2A] text-stone-400'
                }`}
              >
                <MessageSquareQuote className="w-3.5 h-3.5 text-amber-400" />
                <span>{promptUsed ? 'Prompt Active' : 'Prompts'}</span>
              </button>
            </div>
          </div>

          {/* Atmospheric Weather & Location Stamp Bar */}
          <div className="p-3 bg-[#141414] border border-[#222222] rounded-xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono-journal uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>Atmosphere & Place</span>
              </span>

              {/* Display stamped weather if present */}
              {weather && (
                <div className="inline-flex items-center">
                  <WeatherBadge weather={weather} size="sm" showDetails={true} />
                </div>
              )}

              {/* Display stamped location if present */}
              {location && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900 border border-stone-700 text-stone-200 text-xs font-mono-journal">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="max-w-[180px] sm:max-w-xs truncate" title={location.placeName}>
                    {location.placeName || `${location.city || ''}, ${location.country || ''}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="ml-1 text-stone-400 hover:text-stone-200 text-[10px] underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Clear button if either is stamped */}
              {(weather || location) && (
                <button
                  type="button"
                  onClick={() => {
                    setWeather(undefined);
                    setLocation(undefined);
                  }}
                  title="Remove weather and location stamp"
                  className="p-1 text-stone-500 hover:text-stone-300 rounded-md transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stamp action buttons */}
            <div className="flex items-center gap-2">
              {!weather && !location && (
                <>
                  <button
                    type="button"
                    onClick={handleStampWeatherAndLocation}
                    disabled={isStampingLocation}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 text-amber-300 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
                  >
                    {isStampingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>Detecting Climate...</span>
                      </>
                    ) : (
                      <>
                        <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Stamp Weather & Place</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#222222] border border-[#333333] text-stone-300 rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>Search Place</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Location error notice if permission blocked */}
          {locationError && (
            <div className="text-xs text-amber-400/90 bg-amber-950/30 border border-amber-900/40 px-3 py-1.5 rounded-lg flex items-center justify-between">
              <span>{locationError}. You can search for any city or landmark manually.</span>
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="underline ml-2 font-medium hover:text-amber-200"
              >
                Search Place
              </button>
            </div>
          )}

          {/* Place Search Modal */}
          {showLocationModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
              <div className="bg-[#161616] border border-stone-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-serif-journal font-semibold text-white">
                      Tag Memory Location
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocationModal(false);
                      setSearchLocationQuery('');
                      setPlaceSearchResults([]);
                    }}
                    className="text-stone-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-stone-400">
                  Search for any city, landmark, cafe, or park to pin this journal entry onto your Memory Map and stamp its historical climate.
                </p>

                <div className="relative">
                  <input
                    type="text"
                    value={searchLocationQuery}
                    onChange={(e) => handleSearchPlaces(e.target.value)}
                    placeholder="E.g., Kyoto, Central Park, Paris, Golden Gate..."
                    autoFocus
                    className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
                  />
                  {searchingPlaces && (
                    <div className="absolute right-3 top-2.5">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    </div>
                  )}
                </div>

                {/* Search Results List */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {placeSearchResults.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPlace(res)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#1C1C1C] hover:bg-amber-950/30 border border-[#2A2A2A] hover:border-amber-700/50 text-xs transition flex items-start gap-2.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-stone-200">{res.placeName}</p>
                        <p className="text-[10px] text-stone-500 font-mono-journal">
                          {res.city ? `${res.city}, ` : ''}{res.country || ''} ({res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°)
                        </p>
                      </div>
                    </button>
                  ))}
                  {!searchingPlaces && searchLocationQuery.length >= 2 && placeSearchResults.length === 0 && (
                    <p className="text-xs text-stone-500 text-center py-3">
                      No matching places found. Try a broader city or landmark name.
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#222222] flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocationModal(false);
                      setSearchLocationQuery('');
                      setPlaceSearchResults([]);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {/* Socratic Partner Drawer */}
          <SocraticPartnerDrawer
            title={title}
            content={content}
            mood={mood}
            isOpen={showSocraticDrawer}
            onClose={() => setShowSocraticDrawer(false)}
            onInsertQuestion={handleInsertSocraticQuestion}
          />

          {/* Template Selector Drawer */}
          <TemplateSelectorDrawer
            isOpen={showTemplateDrawer}
            onClose={() => setShowTemplateDrawer(false)}
            onSelectTemplate={handleApplyTemplate}
          />

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

          {/* Media Attachments Bar & Manager */}
          <MediaManager media={media} onChange={setMedia} />

          {/* Content Editor / Preview */}
          {!previewMode ? (
            <div className="space-y-2">
              {/* Markdown Helper Toolbar + Speech Dictation */}
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

                {/* Voice Dictation Mic with live recording timer & Gemini transcribe */}
                <button
                  id="btn-voice-dictate"
                  type="button"
                  onClick={toggleDictation}
                  disabled={isTranscribing}
                  title={
                    isDictating
                      ? 'Click to stop and transcribe your voice with Gemini AI'
                      : 'Record your voice thoughts and transcribe with AI'
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs font-medium ml-1 cursor-pointer disabled:cursor-not-allowed ${
                    isDictating
                      ? 'bg-rose-950 text-rose-300 border border-rose-600 shadow-xs animate-pulse'
                      : isTranscribing
                      ? 'bg-amber-950/70 text-amber-300 border border-amber-700/60'
                      : 'hover:bg-[#222222] text-stone-400 hover:text-white'
                  }`}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Transcribing...</span>
                    </>
                  ) : isDictating ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      <span>
                        Stop & Insert ({Math.floor(recordSeconds / 60)}:
                        {(recordSeconds % 60).toString().padStart(2, '0')})
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-amber-400" />
                      <span>Voice Dictate</span>
                    </>
                  )}
                </button>

                {dictationNotice && (
                  <span className="text-[11px] text-amber-300 font-mono-journal animate-fade-in ml-1.5 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                    {dictationNotice}
                  </span>
                )}

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
            <div className="p-5 bg-[#121212] border border-[#242424] rounded-xl min-h-[220px] space-y-4">
              {/* Media preview in preview mode */}
              {media.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-[#222222]">
                  {media.map((m) => (
                    <div key={m.id} className="rounded-xl overflow-hidden border border-[#282828] bg-[#161616]">
                      {m.type === 'photo' && <img src={m.url} alt={m.caption || ''} className="w-full max-h-56 object-cover" />}
                      {m.type === 'gif' && <img src={m.url} alt="GIF" className="w-full max-h-56 object-cover" />}
                      {m.type === 'video' && (
                        <div className="aspect-video">
                          <iframe src={m.url} title="Video" className="w-full h-full" allowFullScreen />
                        </div>
                      )}
                      {m.type === 'audio' && (
                        <div className="p-3">
                          <p className="text-xs font-medium text-stone-300 mb-1">{m.title || 'Voice Note'}</p>
                          <audio src={m.url} controls className="w-full h-8" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

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
            {media.length > 0 && <span>{media.length} media item{media.length > 1 ? 's' : ''}</span>}
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
              disabled={isSaving || (!title.trim() && !content.trim() && media.length === 0)}
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
