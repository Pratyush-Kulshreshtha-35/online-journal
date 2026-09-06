import React, { useState } from 'react';
import { Sparkles, X, Plus, Loader2, Heart, HelpCircle } from 'lucide-react';
import { askSocraticPartner, SocraticResponse } from '../services/aiService';
import { MoodType } from '../types/journal';

interface SocraticPartnerDrawerProps {
  title: string;
  content: string;
  mood: MoodType;
  isOpen: boolean;
  onClose: () => void;
  onInsertQuestion: (question: string) => void;
}

export const SocraticPartnerDrawer: React.FC<SocraticPartnerDrawerProps> = ({
  title,
  content,
  mood,
  isOpen,
  onClose,
  onInsertQuestion,
}) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SocraticResponse | null>(null);

  if (!isOpen) return null;

  const handleAsk = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await askSocraticPartner(title, content, mood);
      setResponse(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-2xl space-y-4 text-xs animate-fade-in text-stone-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs">Socratic Writing Partner</h4>
            <p className="text-[10px] text-stone-400 font-mono-journal">
              Deep mindful inquiry powered by Gemini AI
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-stone-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!response && !loading && (
        <div className="space-y-3 py-2">
          <p className="text-stone-300 leading-relaxed font-serif-journal text-xs">
            Want to explore what you've written deeper? Gemini can read your thoughts with gentle compassion and formulate 3 thoughtful Socratic questions to unlock hidden insights.
          </p>
          <button
            type="button"
            onClick={handleAsk}
            disabled={!content.trim()}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold rounded-xl transition shadow-md disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Socratic Questions</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="py-6 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <p className="text-stone-400 font-mono-journal text-[11px]">
            Contemplating your words...
          </p>
        </div>
      )}

      {response && !loading && (
        <div className="space-y-3 animate-fade-in">
          {response.affirmation && (
            <div className="p-3 bg-amber-950/25 border border-amber-800/30 rounded-xl text-amber-300 italic font-serif-journal text-xs flex items-start gap-2">
              <Heart className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
              <span>"{response.affirmation}"</span>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[11px] font-mono-journal text-stone-400">
              Click any question to insert into your entry:
            </p>
            {response.questions?.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onInsertQuestion(q);
                  onClose();
                }}
                className="w-full text-left p-2.5 bg-[#1C1C1C] hover:bg-[#242424] border border-[#2B2B2B] hover:border-amber-600/50 rounded-xl transition group flex items-start justify-between gap-2"
              >
                <span className="font-serif-journal text-stone-200 group-hover:text-amber-300 text-xs leading-relaxed">
                  {q}
                </span>
                <Plus className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 shrink-0 mt-0.5" />
              </button>
            ))}
          </div>

          <div className="pt-2 flex justify-between items-center text-[10px] text-stone-500 font-mono-journal">
            <span>Powered by Gemini 3.8 Flash</span>
            <button
              type="button"
              onClick={handleAsk}
              className="text-amber-400 hover:underline"
            >
              Ask again &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
