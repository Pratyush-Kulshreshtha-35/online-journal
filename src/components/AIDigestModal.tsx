import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Calendar,
  Compass,
  Flame,
  Lightbulb,
  CheckCircle2,
  Share2,
  Download,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { JournalEntry, AIDigest } from '../types/journal';
import { generateAIDigest } from '../services/aiService';

interface AIDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
}

export const AIDigestModal: React.FC<AIDigestModalProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [digest, setDigest] = useState<AIDigest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (selectedPeriod: 'week' | 'month' = period) => {
    setLoading(true);
    setError(null);
    try {
      const now = Date.now();
      const days = selectedPeriod === 'week' ? 7 : 30;
      const cutoffTime = now - days * 24 * 60 * 60 * 1000;
      const filtered = entries.filter((e) => {
        const entryTime = new Date(e.date + 'T00:00:00').getTime();
        return entryTime >= cutoffTime;
      });

      const periodName = selectedPeriod === 'week' ? 'the past 7 days' : 'the past 30 days';
      const targetEntries = filtered.length > 0 ? filtered : entries.slice(0, 15);

      if (targetEntries.length === 0) {
        setError('No entries available to synthesize. Write a few journal entries first!');
        setLoading(false);
        return;
      }

      const result = await generateAIDigest(targetEntries, periodName);
      setDigest(result);
    } catch (err: any) {
      console.error('Digest synthesis error:', err);
      setError(err?.message || 'Could not synthesize entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="ai-digest-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#0F0F0F] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif-journal font-bold text-white">
                AI Reflection Digest
              </h2>
              <p className="text-[11px] text-stone-400 font-mono-journal">
                Synthesizing patterns, emotional shifts, and growth with Gemini
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-[#222222] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#111111] border-b border-[#202020] text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-[#181818] rounded-xl border border-[#262626]">
            <button
              onClick={() => {
                setPeriod('week');
                handleGenerate('week');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                period === 'week' ? 'bg-[#282828] text-amber-400 shadow-xs' : 'text-stone-400'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => {
                setPeriod('month');
                handleGenerate('month');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                period === 'month' ? 'bg-[#282828] text-amber-400 shadow-xs' : 'text-stone-400'
              }`}
            >
              Past 30 Days
            </button>
          </div>

          <button
            onClick={() => handleGenerate(period)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-semibold rounded-xl text-xs transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reading reflections...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synthesize Now</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!digest && !loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#262626] text-amber-500 flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-serif-journal text-lg font-bold text-white">
                Ready to review your journey?
              </h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                Click "Synthesize Now" above. Gemini will respectfully analyze your entries from {period === 'week' ? 'this week' : 'this month'} to uncover recurring themes, emotional patterns, and mindful insights.
              </p>
            </div>
          )}

          {loading && (
            <div className="py-20 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-serif-journal font-semibold text-white">
                  Synthesizing your private journal entries...
                </p>
                <p className="text-xs text-stone-500 font-mono-journal">
                  Detecting themes, emotional currents, and milestones
                </p>
              </div>
            </div>
          )}

          {digest && !loading && (
            <div className="space-y-6 animate-fade-in">
              {/* Title & Overview Banner */}
              <div className="p-5 bg-[#141414] border border-[#262626] rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-mono-journal tracking-widest text-amber-400 font-semibold bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-md">
                    Dominant Current: {digest.dominantMood}
                  </span>
                  <span className="text-xs text-stone-500 font-mono-journal">
                    {period === 'week' ? 'Weekly Digest' : 'Monthly Digest'}
                  </span>
                </div>
                <h3 className="text-2xl font-serif-journal font-bold text-white">
                  {digest.title}
                </h3>
                <p className="text-stone-300 font-serif-journal text-sm leading-relaxed whitespace-pre-line">
                  {digest.overview}
                </p>
              </div>

              {/* Grid: Themes & Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Themes */}
                <div className="p-5 bg-[#121212] border border-[#222222] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                    <Lightbulb className="w-4 h-4" />
                    <span>Recurring Themes</span>
                  </div>
                  <ul className="space-y-2">
                    {digest.themes?.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-stone-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Highlights */}
                <div className="p-5 bg-[#121212] border border-[#222222] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Key Milestones & Thoughts</span>
                  </div>
                  <ul className="space-y-2">
                    {digest.highlights?.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-stone-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Growth & Encouragement */}
              <div className="p-5 bg-gradient-to-br from-amber-950/20 to-[#141414] border border-amber-900/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <Flame className="w-4 h-4" />
                  <span>Growth Observation & Encouragement</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed font-serif-journal">
                  {digest.growthInsight}
                </p>
                {digest.encouragement && (
                  <div className="pt-2 border-t border-amber-900/20">
                    <p className="text-xs italic text-amber-300 font-serif-journal">
                      "{digest.encouragement}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
