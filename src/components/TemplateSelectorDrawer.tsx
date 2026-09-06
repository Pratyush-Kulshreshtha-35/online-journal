import React from 'react';
import { X, Sparkles, LayoutTemplate, ArrowRight } from 'lucide-react';
import { JOURNAL_TEMPLATES } from '../data/templates';
import { JournalTemplate } from '../types/journal';

interface TemplateSelectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: JournalTemplate) => void;
}

export const TemplateSelectorDrawer: React.FC<TemplateSelectorDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-2xl space-y-3 text-xs animate-fade-in text-stone-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center">
            <LayoutTemplate className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs">Framework Templates</h4>
            <p className="text-[10px] text-stone-400 font-mono-journal">
              Structured prompts based on psychology & philosophy
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-stone-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
        {JOURNAL_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => {
              onSelectTemplate(tmpl);
              onClose();
            }}
            className="p-3 bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] hover:border-amber-500/50 rounded-xl transition text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{tmpl.emoji}</span>
                <span className="font-bold text-stone-200 group-hover:text-amber-400 text-xs truncate">
                  {tmpl.name}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed">
                {tmpl.description}
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[9px] font-mono-journal text-stone-500 group-hover:text-amber-400">
              <span>{tmpl.category}</span>
              <span className="flex items-center gap-0.5">Use &rarr;</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
