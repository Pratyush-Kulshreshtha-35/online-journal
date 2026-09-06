import React, { useState, useRef } from 'react';
import {
  Printer,
  X,
  Download,
  Book,
  Check,
  Sparkles,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { JournalEntry } from '../types/journal';
import Markdown from 'react-markdown';
import {
  generateDirectJournalPDF,
  generateStandaloneHTMLBook,
  downloadHTMLFile,
} from '../services/pdfService';

interface BookPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  userDisplayName?: string | null;
}

export const BookPrintModal: React.FC<BookPrintModalProps> = ({
  isOpen,
  onClose,
  entries,
  userDisplayName,
}) => {
  const [includePrompts, setIncludePrompts] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [printBlockedNotice, setPrintBlockedNotice] = useState<string | null>(null);

  const bookContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Extract all unique tags
  const allTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []))
  ).filter(Boolean);

  const filteredEntries = entries
    .filter((e) => selectedTag === 'all' || e.tags?.includes(selectedTag))
    .sort((a, b) => a.date.localeCompare(b.date)); // Chronological for book

  // Handle direct vector PDF compilation & download (Zero canvas memory limits)
  const handleSaveAsPDF = async () => {
    setIsGeneratingPDF(true);
    setPdfSuccess(false);
    setPrintBlockedNotice(null);

    try {
      await generateDirectJournalPDF(
        filteredEntries,
        {
          authorName: userDisplayName || 'Private Journal Author',
          includePrompts,
        },
        `Journal_Archival_Book_${new Date().toISOString().slice(0, 10)}.pdf`,
        (msg) => setPdfProgress(msg)
      );
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err: any) {
      console.error('PDF Generation failed, downloading Standalone HTML backup:', err);
      // Fallback: download standalone HTML book
      handleDownloadHTML();
      setPrintBlockedNotice(
        'Direct PDF compilation had an issue; Standalone HTML Book was downloaded as a reliable backup!'
      );
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress(null);
    }
  };

  // Handle browser native print with sandbox bypass
  const handleTriggerPrint = () => {
    setPrintBlockedNotice(null);
    const htmlContent = generateStandaloneHTMLBook(filteredEntries, {
      authorName: userDisplayName || 'Private Journal Author',
      includePrompts,
    });

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    // In sandboxed preview iframes, calling window.print() throws a DOMException.
    // Opening a dedicated print window in a new tab bypasses iframe sandbox restrictions.
    try {
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        setPrintBlockedNotice(
          'Opened high-resolution print view in a new window. The print dialog will open automatically, or press Ctrl+P / Cmd+P!'
        );
        return;
      }
    } catch (err: any) {
      console.warn('Window open notice:', err);
    }

    // Fallback if popup blocker intercepted the new tab: download standalone HTML book
    downloadHTMLFile(
      htmlContent,
      `Journal_Print_Book_${new Date().toISOString().slice(0, 10)}.html`
    );
    setPrintBlockedNotice(
      'Print popup was blocked by browser. Standalone Print Book was downloaded — open it and press Ctrl+P / Cmd+P to print!'
    );
  };

  // Handle standalone single-file HTML book download
  const handleDownloadHTML = () => {
    const htmlContent = generateStandaloneHTMLBook(filteredEntries, {
      authorName: userDisplayName || 'Private Journal Author',
      includePrompts,
    });
    downloadHTMLFile(
      htmlContent,
      `Journal_Book_${new Date().toISOString().slice(0, 10)}.html`
    );
  };

  return (
    <div
      id="book-print-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#121212] border border-[#282828] rounded-3xl shadow-2xl overflow-hidden text-stone-200">
        {/* Print Controls Header (Hidden in actual print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[#242424] bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center shrink-0">
              <Book className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif-journal font-bold text-white">
                Archival Journal Book & PDF
              </h2>
              <p className="text-[11px] text-stone-400 font-mono-journal">
                {filteredEntries.length} entries ready for archival binding or PDF export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Action: Save as PDF */}
            <button
              id="btn-print-save-pdf"
              type="button"
              disabled={isGeneratingPDF}
              onClick={handleSaveAsPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-black font-bold rounded-xl text-xs transition shadow-md cursor-pointer disabled:cursor-not-allowed"
              title="Compile and download archival PDF document"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>{pdfProgress || 'Compiling PDF...'}</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Save as PDF</span>
                </>
              )}
            </button>

            {/* Secondary Action: Browser Print */}
            <button
              id="btn-browser-print"
              type="button"
              onClick={handleTriggerPrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-stone-200 border border-[#333] rounded-xl text-xs font-medium transition cursor-pointer"
              title="Open browser print preview"
            >
              <Printer className="w-4 h-4 text-stone-400" />
              <span className="hidden sm:inline">Browser Print</span>
            </button>

            {/* Standalone HTML Export */}
            <button
              id="btn-export-html-book"
              type="button"
              onClick={handleDownloadHTML}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-stone-300 border border-[#333] rounded-xl text-xs font-medium transition cursor-pointer"
              title="Download standalone HTML web book (opens in any browser)"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">HTML Book</span>
            </button>

            <button
              id="btn-close-print-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-[#222222] transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative notice explaining iframe sandbox restrictions and providing direct PDF action */}
        {printBlockedNotice && (
          <div className="print:hidden px-6 py-3 bg-amber-950/50 border-b border-amber-800/60 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-amber-300">{printBlockedNotice}</p>
                <p className="text-[11px] text-stone-300">
                  Browsers automatically block popup windows and print dialogs from embedded preview frames. Use <strong className="text-white font-bold">Save as PDF</strong> for an instant direct download.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={handleSaveAsPDF}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save as PDF Now</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintBlockedNotice(null)}
                className="px-2 py-1 text-stone-400 hover:text-white text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Filter Toolbar (Hidden in print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[#141414] border-b border-[#202020] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-mono-journal">Filter by tag:</span>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-2.5 py-1.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-lg text-stone-200 text-xs focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">All Entries ({entries.length})</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-stone-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includePrompts}
              onChange={(e) => setIncludePrompts(e.target.checked)}
              className="rounded-sm accent-amber-500"
            />
            <span>Include reflection prompts</span>
          </label>
        </div>

        {/* Printable Book Area */}
        <div
          id="printable-book-content"
          ref={bookContentRef}
          className="overflow-y-auto p-8 sm:p-12 print:p-0 print:m-0 bg-[#0C0C0C] print:bg-white print:text-black font-serif-journal"
        >
          {/* Cover Page */}
          <div className="min-h-[500px] flex flex-col justify-center items-center text-center p-8 border-b border-[#222222] print:border-none print:min-h-screen print:page-break-after-always">
            <div className="w-16 h-16 rounded-3xl bg-amber-950/40 print:bg-amber-100 border border-amber-800/40 text-amber-500 flex items-center justify-center mx-auto mb-6">
              <Book className="w-8 h-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white print:text-black mb-3">
              The Collected Journal
            </h1>
            <p className="text-stone-400 print:text-stone-600 text-base mb-8 max-w-md font-sans">
              A private chronicle of reflections, emotions, and mindful personal growth.
            </p>
            <div className="pt-6 border-t border-[#222222] print:border-stone-300 w-48 text-xs font-mono-journal text-stone-500 print:text-stone-700">
              <p className="font-semibold">{userDisplayName || 'Private Journal Author'}</p>
              <p className="mt-1">{new Date().getFullYear()} Edition</p>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="my-10 p-6 bg-[#121212] print:bg-stone-50 border border-[#222222] print:border-stone-200 rounded-2xl print:page-break-after-always">
            <h3 className="text-lg font-bold text-white print:text-black mb-4 pb-2 border-b border-[#222222] print:border-stone-300">
              Chronological Index
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
              {filteredEntries.map((e, idx) => (
                <div key={e.id} className="flex items-center justify-between py-1 border-b border-[#1C1C1C] print:border-stone-200">
                  <span className="text-stone-300 print:text-stone-900 truncate pr-2 font-medium">
                    {idx + 1}. {e.title}
                  </span>
                  <span className="font-mono-journal text-[11px] text-stone-500 print:text-stone-600 shrink-0">
                    {e.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Book Chapters / Entries */}
          <div className="space-y-12 print:space-y-0">
            {filteredEntries.map((e, index) => (
              <article
                key={e.id}
                className="pt-8 border-t border-[#222222] print:border-none print:pt-12 print:page-break-after-always"
              >
                <header className="mb-4">
                  <div className="flex items-center justify-between text-xs font-mono-journal text-amber-500/80 print:text-amber-800 mb-1">
                    <span>
                      CHAPTER {index + 1} &bull; {e.date}
                    </span>
                    <span className="capitalize">{e.mood}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white print:text-black leading-tight">
                    {e.title}
                  </h2>
                  {e.tags && e.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 font-sans">
                      {e.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-[#1C1C1C] print:bg-stone-200 text-stone-400 print:text-stone-800 text-[10px]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                {includePrompts && e.promptUsed && (
                  <blockquote className="my-4 p-3.5 bg-[#161616] print:bg-stone-100 border-l-2 border-amber-500 text-xs italic text-stone-300 print:text-stone-700 font-sans">
                    {e.promptUsed}
                  </blockquote>
                )}

                {/* Media indicators in print view */}
                {e.media && e.media.length > 0 && (
                  <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 print:gap-2">
                    {e.media
                      .filter((m) => m.type === 'photo')
                      .map((m) => (
                        <div key={m.id} className="rounded-xl overflow-hidden border border-[#262626] print:border-stone-300">
                          <img
                            src={m.url}
                            alt={m.caption || 'Journal photo'}
                            className="w-full max-h-60 object-cover"
                            crossOrigin="anonymous"
                          />
                          {m.caption && (
                            <p className="p-1.5 text-[11px] text-stone-400 print:text-stone-600 italic bg-[#141414] print:bg-stone-100">
                              {m.caption}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                <div className="text-stone-300 print:text-stone-900 leading-relaxed font-serif-journal text-base space-y-4">
                  <Markdown>{e.content}</Markdown>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
