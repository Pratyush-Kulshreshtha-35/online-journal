import React, { useState } from 'react';
import { Wind, X, Flame, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReleasePadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReleasePadModal: React.FC<ReleasePadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [text, setText] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [released, setReleased] = useState(false);

  if (!isOpen) return null;

  const handleRelease = () => {
    if (!text.trim()) return;
    setIsReleasing(true);
    setTimeout(() => {
      setText('');
      setIsReleasing(false);
      setReleased(true);
    }, 1800);
  };

  const handleReset = () => {
    setReleased(false);
    setText('');
  };

  return (
    <div
      id="release-pad-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-[#0C0C0C] border border-[#242424] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-stone-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-500 hover:text-white p-1.5 rounded-lg hover:bg-[#1C1C1C] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400 shadow-md">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif-journal font-bold text-white">
              The Ephemeral Release Pad
            </h2>
            <p className="text-xs text-stone-400 font-mono-journal">
              Write what burdens you. Release it into the void. It is never saved.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!released ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="relative">
                <motion.textarea
                  animate={
                    isReleasing
                      ? {
                          opacity: [1, 0.4, 0],
                          filter: ['blur(0px)', 'blur(8px)', 'blur(20px)'],
                          scale: [1, 0.98, 0.9],
                          y: [0, -15, -40],
                        }
                      : {}
                  }
                  transition={{ duration: 1.8, ease: 'easeInOut' }}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isReleasing}
                  placeholder="Pour your raw frustrations, unspoken fears, or unhelpful ruminations here. No filters, no judgment..."
                  rows={8}
                  className="w-full p-4 bg-[#141414] border border-[#262626] rounded-2xl text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 font-serif-journal text-sm sm:text-base leading-relaxed resize-none transition"
                />

                {isReleasing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="flex flex-col items-center gap-2 text-amber-400 font-serif-journal text-sm">
                      <Wind className="w-8 h-8 animate-spin" />
                      <span>Dissolving into the universe...</span>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-stone-500 font-mono-journal">
                  🔒 Zero cloud sync. Wiped completely from memory upon release.
                </span>

                <button
                  id="btn-release-now"
                  onClick={handleRelease}
                  disabled={!text.trim() || isReleasing}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold rounded-xl text-xs sm:text-sm shadow-[0_0_20px_rgba(217,119,6,0.3)] transition disabled:opacity-40"
                >
                  <Wind className="w-4 h-4" />
                  <span>Release & Let Go</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-amber-700/50 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_30px_rgba(217,119,6,0.3)]">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif-journal text-2xl font-bold text-white">
                  Released and Gone
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto font-serif-journal leading-relaxed">
                  The thoughts have served their purpose by being acknowledged, and are now surrendered. Take a slow, deep breath in... and out.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] rounded-xl text-xs font-medium text-stone-300 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Write Another</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-xs shadow-md transition"
                >
                  Return to Journal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
