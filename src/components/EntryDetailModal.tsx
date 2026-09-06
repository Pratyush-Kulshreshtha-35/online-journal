import React, { useState, useRef } from 'react';
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
  Lock,
  Unlock,
  Play,
  Square,
  Music,
  Video,
  Mic,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { toggleEntryFavorite } from '../services/journalService';
import { useAuth } from '../context/AuthContext';
import { verifyPin, isVaultConfigured } from './PinVaultModal';
import { WeatherBadge } from './WeatherBadge';

interface EntryDetailModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  isVaultUnlocked?: boolean;
  onUnlockVault?: () => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete,
  isVaultUnlocked = false,
  onUnlockVault,
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [locallyUnlocked, setLocallyUnlocked] = useState(false);

  // Audio player state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const toggleAudio = (id: string, url: string) => {
    if (playingAudioId === id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio.play();
      setPlayingAudioId(id);
    }
  };

  const isLocked = entry.isLocked && !isVaultUnlocked && !locallyUnlocked;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPin(pinInput)) {
      setLocallyUnlocked(true);
      if (onUnlockVault) onUnlockVault();
    } else {
      setPinError(true);
      setPinInput('');
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

            {entry.isLocked && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/40 text-amber-400 text-xs font-mono-journal">
                <Lock className="w-3 h-3" />
                <span>Vault</span>
              </span>
            )}

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

          {/* Weather & Location Atmosphere Bar */}
          {(entry.weather || entry.location) && !isLocked && (
            <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-[#141414] border border-[#222222]">
              {entry.weather && (
                <WeatherBadge weather={entry.weather} showDetails={true} size="sm" />
              )}
              {entry.location && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900 border border-stone-700 text-stone-200 text-xs font-mono-journal">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{entry.location.placeName || `${entry.location.city || ''}, ${entry.location.country || ''}`}</span>
                </div>
              )}
            </div>
          )}

          {/* Lock Screen Gate */}
          {isLocked ? (
            <div className="py-12 px-6 bg-[#141414] border border-[#262626] rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif-journal text-lg font-bold text-white">
                  This Entry is Vault Protected
                </h3>
                <p className="text-xs text-stone-400 font-mono-journal">
                  Enter your 4-digit PIN to view its reflections and attachments.
                </p>
              </div>

              <form onSubmit={handlePinSubmit} className="max-w-xs mx-auto flex gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    setPinError(false);
                    setPinInput(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="PIN..."
                  className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded-xl text-center font-mono-journal text-lg tracking-widest text-white focus:outline-hidden focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-xs transition"
                >
                  Unlock
                </button>
              </form>
              {pinError && <p className="text-xs text-rose-400 font-mono-journal">Incorrect PIN.</p>}
            </div>
          ) : (
            <>
              {/* Prompt banner */}
              {entry.promptUsed && (
                <div className="p-4 bg-amber-950/25 border border-amber-800/40 rounded-xl text-amber-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 block mb-0.5 font-mono-journal">
                      Reflection Prompt
                    </span>
                    <p className="italic font-serif-journal text-stone-200 text-sm leading-relaxed">
                      {entry.promptUsed}
                    </p>
                  </div>
                </div>
              )}

              {/* Media Attachments Gallery */}
              {entry.media && entry.media.length > 0 && (
                <div className="space-y-4 my-6">
                  {/* Photo & GIF gallery */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {entry.media
                      .filter((m) => m.type === 'photo' || m.type === 'gif')
                      .map((m) => (
                        <div
                          key={m.id}
                          className="rounded-2xl overflow-hidden border border-[#262626] bg-[#141414] group"
                        >
                          <img
                            src={m.url}
                            alt={m.caption || 'Journal media'}
                            className="w-full max-h-72 object-cover transition group-hover:scale-101"
                          />
                          {m.caption && (
                            <p className="p-2.5 text-xs text-stone-400 font-serif-journal italic bg-[#161616]">
                              {m.caption}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Video embeds */}
                  {entry.media
                    .filter((m) => m.type === 'video')
                    .map((m) => (
                      <div
                        key={m.id}
                        className="rounded-2xl overflow-hidden border border-[#262626] bg-black aspect-video"
                      >
                        <iframe
                          src={m.url}
                          title={m.caption || 'Journal video'}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    ))}

                  {/* Voice Notes Audio Players */}
                  {entry.media
                    .filter((m) => m.type === 'audio')
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 bg-[#141414] border border-[#282828] rounded-2xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleAudio(m.id, m.url)}
                            className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-400 flex items-center justify-center transition hover:bg-emerald-900/80"
                          >
                            {playingAudioId === m.id ? (
                              <Square className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                          <div>
                            <p className="text-xs font-semibold text-stone-200">
                              {m.title || 'Voice Note'}
                            </p>
                            {m.duration && (
                              <span className="text-[10px] text-stone-500 font-mono-journal">
                                Duration: {m.duration}s
                              </span>
                            )}
                          </div>
                        </div>
                        <Mic className="w-4 h-4 text-emerald-400 shrink-0 opacity-60" />
                      </div>
                    ))}

                  {/* Music Track card */}
                  {entry.media
                    .filter((m) => m.type === 'music')
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-[#141414] border border-purple-900/30 rounded-2xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center">
                            <Music className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-stone-200 text-xs">{m.title}</p>
                            <span className="text-[10px] text-purple-400 font-mono-journal">
                              Attached Soundtrack
                            </span>
                          </div>
                        </div>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-mono-journal text-xs"
                        >
                          <span>Open link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
