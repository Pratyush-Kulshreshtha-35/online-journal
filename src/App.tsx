import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header, MainTabType } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { EntryEditor } from './components/EntryEditor';
import { EntryCard } from './components/EntryCard';
import { EntryDetailModal } from './components/EntryDetailModal';
import { FilterBar } from './components/FilterBar';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { PromptsDeck } from './components/PromptsDeck';
import { FlashbacksView } from './components/FlashbacksView';
import { MemoryMapView } from './components/MemoryMapView';
import { AIDigestModal } from './components/AIDigestModal';
import { ReleasePadModal } from './components/ReleasePadModal';
import { PinVaultModal, isVaultConfigured } from './components/PinVaultModal';
import { BookPrintModal } from './components/BookPrintModal';
import { EmptyState } from './components/EmptyState';
import {
  JournalEntry,
  EntryFilter,
} from './types/journal';
import {
  subscribeUserEntries,
  deleteJournalEntry,
  computeJournalStats,
  seed30DaySampleEntries,
} from './services/journalService';
import {
  BookOpen,
  Sparkles,
  Lock,
  Shield,
  Loader2,
  Trash2,
  History,
  Image as ImageIcon,
  Headphones,
  X,
} from 'lucide-react';

function JournalAppContent() {
  const { user, loading: authLoading, startLocalSession } = useAuth();
  const { isPaper } = useTheme();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Main View Tab
  const [activeTab, setActiveTab] = useState<MainTabType>('entries');

  // Modals & Drawers
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activePromptForEditor, setActivePromptForEditor] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<JournalEntry | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<JournalEntry | null>(null);

  // Advanced Feature Modals
  const [aiDigestOpen, setAiDigestOpen] = useState<boolean>(false);
  const [releasePadOpen, setReleasePadOpen] = useState<boolean>(false);
  const [pinVaultOpen, setPinVaultOpen] = useState<boolean>(false);
  const [bookPrintOpen, setBookPrintOpen] = useState<boolean>(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [flashbackBannerDismissed, setFlashbackBannerDismissed] = useState<boolean>(false);
  const [isSeedingData, setIsSeedingData] = useState<boolean>(false);

  const handleSeedSampleEntries = async () => {
    if (!user) return;
    try {
      setIsSeedingData(true);
      const updated = await seed30DaySampleEntries(user.uid);
      setEntries(updated);
    } catch (err) {
      console.error('Failed to seed sample entries:', err);
    } finally {
      setIsSeedingData(false);
    }
  };

  // Filter State
  const [filter, setFilter] = useState<EntryFilter>({
    searchQuery: '',
    mood: 'all',
    tag: 'all',
    onlyFavorites: false,
    sortBy: 'date-desc',
  });

  // Subscribe to real-time entries from Firestore when user is authenticated
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    const unsubscribe = subscribeUserEntries(
      user.uid,
      (fetched) => {
        setEntries(fetched);
        setEntriesLoading(false);
      },
      (err) => {
        console.error('Failed to load journal entries from Firestore:', err);
        setError('Could not sync with Firestore. Please check your network or sign in.');
        setEntriesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Compute stats
  const stats = useMemo(() => computeJournalStats(entries), [entries]);

  // Extract all unique tags
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [entries]);

  // Filtered & Sorted Entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Search query match
        if (filter.searchQuery.trim()) {
          const q = filter.searchQuery.toLowerCase();
          const matchTitle = entry.title.toLowerCase().includes(q);
          const matchContent = entry.content.toLowerCase().includes(q);
          const matchTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTags) return false;
        }

        // Mood match
        if (filter.mood !== 'all' && entry.mood !== filter.mood) {
          return false;
        }

        // Tag match
        if (filter.tag !== 'all' && !entry.tags?.includes(filter.tag)) {
          return false;
        }

        // Favorites match
        if (filter.onlyFavorites && !entry.isFavorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filter.sortBy === 'date-asc') {
          return a.date.localeCompare(b.date);
        }
        if (filter.sortBy === 'updated-desc') {
          return b.updatedAt - a.updatedAt;
        }
        // default: date-desc
        return b.date.localeCompare(a.date);
      });
  }, [entries, filter]);

  // Check for an "On This Day" or Milestone memory for the banner
  const todayFlashback = useMemo(() => {
    if (entries.length === 0) return null;
    const today = new Date();
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayStr = today.toISOString().split('T')[0];

    // Priority 1: Exact day from a previous year
    const yearly = entries.find((e) => e.date !== todayStr && e.date.slice(5) === todayMonthDay);
    if (yearly) {
      const entryYear = parseInt(yearly.date.slice(0, 4), 10);
      const yearsAgo = today.getFullYear() - entryYear;
      return {
        entry: yearly,
        label: yearsAgo > 0 ? `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today` : 'On this day',
      };
    }

    // Priority 2: Milestone deltas
    const targetDeltas = [
      { days: 7, label: '1 week ago' },
      { days: 14, label: '2 weeks ago' },
      { days: 30, label: '1 month ago' },
      { days: 60, label: '2 months ago' },
      { days: 90, label: '3 months ago' },
      { days: 365, label: '1 year ago' },
    ];

    for (const target of targetDeltas) {
      const match = entries.find((e) => {
        if (e.date === todayStr) return false;
        const entryDate = new Date(e.date + 'T00:00:00');
        const diffMs = today.getTime() - entryDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return Math.abs(diffDays - target.days) <= 1;
      });
      if (match) {
        return { entry: match, label: target.label };
      }
    }

    return null;
  }, [entries]);

  // Handlers
  const handleOpenNewEntry = (presetDate?: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setEditingEntry(null);
    setActivePromptForEditor(null);
    setEditorOpen(true);
  };

  const handleOpenPromptInEditor = (promptText: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setEditingEntry(null);
    setActivePromptForEditor(promptText);
    setEditorOpen(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setActivePromptForEditor(null);
    setEditorOpen(true);
  };

  const handleDeleteEntryConfirm = async () => {
    if (!user || !deleteConfirmEntry) return;
    try {
      await deleteJournalEntry(user.uid, deleteConfirmEntry.id);
      if (detailEntry?.id === deleteConfirmEntry.id) {
        setDetailEntry(null);
      }
      setDeleteConfirmEntry(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${
        isPaper ? 'bg-[#F7F4EC] text-stone-700' : 'bg-[#0A0A0A] text-stone-400'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="font-serif-journal text-sm">Opening your journal vault...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isPaper ? 'bg-[#F7F4EC] text-[#24201C] selection:bg-amber-200' : 'bg-[#0A0A0A] text-[#D4D4D4] selection:bg-amber-950'
    }`}>
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewEntry={() => handleOpenNewEntry()}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenAIDigest={() => setAiDigestOpen(true)}
        onOpenReleasePad={() => setReleasePadOpen(true)}
        onOpenPinVault={() => setPinVaultOpen(true)}
        onOpenBookPrint={() => setBookPrintOpen(true)}
        isVaultUnlocked={isVaultUnlocked}
        stats={stats}
        entries={entries}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!user ? (
          /* Unauthenticated Landing / Call to Action */
          <div className="max-w-3xl mx-auto py-12 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs font-semibold uppercase tracking-wider font-mono-journal">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Private & Firestore Secured</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-serif-journal font-bold tracking-tight text-white leading-tight">
                Your sanctuary for mindful thoughts, multimedia memories, and deep reflection.
              </h1>
              <p className="text-base sm:text-lg text-stone-400 font-serif-journal max-w-xl mx-auto leading-relaxed">
                A modern private diary with voice notes, photo galleries, video links, ambient soundscapes,
                AI Socratic reflections, PIN security, and cloud persistence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="btn-get-started"
                onClick={() => setAuthModalOpen(true)}
                className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(217,119,6,0.3)] transition flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Start Journaling</span>
              </button>

              <button
                id="btn-start-instant-local"
                onClick={() => startLocalSession()}
                className="w-full sm:w-auto px-6 py-3 bg-[#161616] hover:bg-[#202020] text-stone-200 hover:text-amber-400 border border-[#2A2A2A] rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Try Instantly (Local Sanctuary)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 text-left">
              <div className="p-5 bg-[#111111] border border-[#222222] rounded-2xl shadow-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center mb-3">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h3 className="font-serif-journal font-bold text-white text-base">Photos, Audio & Video</h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Enrich entries with voice notes, curated imagery, YouTube video embeds, and soundtrack links.
                </p>
              </div>

              <div className="p-5 bg-[#111111] border border-[#222222] rounded-2xl shadow-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-serif-journal font-bold text-white text-base">Gemini AI Socratic Partner</h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Unlock hidden self-insights with mindful Socratic inquiry and weekly emotional digests.
                </p>
              </div>

              <div className="p-5 bg-[#111111] border border-[#222222] rounded-2xl shadow-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center mb-3">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-serif-journal font-bold text-white text-base">PIN Vault & Soundscapes</h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Keep secret reflections locked under PIN code while writing to gentle synthesizer rain & lo-fi sounds.
                </p>
              </div>
            </div>
          </div>
        ) : entriesLoading ? (
          /* Loading Entries */
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs text-stone-400 font-mono-journal">Syncing entries from Firestore...</p>
          </div>
        ) : (
          /* Active Views */
          <div>
            {/* Tab 1: Entries Stream */}
            {activeTab === 'entries' && (
              <div>
                {/* On This Day / Memory Flashback Banner */}
                {todayFlashback && !flashbackBannerDismissed && (
                  <div
                    id="flashback-banner"
                    className="mb-6 p-4 rounded-2xl bg-linear-to-r from-amber-950/40 via-[#181818] to-stone-900 border border-amber-800/40 flex flex-wrap items-center justify-between gap-4 shadow-lg animate-fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-wider font-mono-journal text-amber-400 font-semibold">
                            Time Capsule • {todayFlashback.label}
                          </span>
                        </div>
                        <h4 className="text-white font-serif-journal font-bold text-sm sm:text-base line-clamp-1">
                          "{todayFlashback.entry.title || 'Untitled reflection'}"
                        </h4>
                        <p className="text-xs text-stone-400 font-serif-journal line-clamp-1 italic">
                          {todayFlashback.entry.content.replace(/[#*`_]/g, '')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id="btn-flashback-read"
                        type="button"
                        onClick={() => setDetailEntry(todayFlashback.entry)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-sans transition cursor-pointer"
                      >
                        Read Memory
                      </button>
                      <button
                        id="btn-flashback-all"
                        type="button"
                        onClick={() => setActiveTab('flashbacks')}
                        className="px-3 py-1.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-stone-300 text-xs font-medium transition cursor-pointer"
                      >
                        All Flashbacks
                      </button>
                      <button
                        id="btn-flashback-dismiss"
                        type="button"
                        onClick={() => setFlashbackBannerDismissed(true)}
                        className="p-1.5 text-stone-500 hover:text-stone-300 rounded-lg transition cursor-pointer"
                        title="Dismiss banner"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Search and Filters */}
                {entries.length > 0 && (
                  <FilterBar
                    filter={filter}
                    setFilter={setFilter}
                    availableTags={availableTags}
                    totalResultsCount={filteredEntries.length}
                  />
                )}

                {/* Entry Stream Cards */}
                {filteredEntries.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredEntries.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onSelect={(e) => setDetailEntry(e)}
                        onEdit={(e) => handleEditEntry(e)}
                        onDelete={(e) => setDeleteConfirmEntry(e)}
                        isVaultUnlocked={isVaultUnlocked}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    isFiltered={entries.length > 0}
                    onOpenNewEntry={() => handleOpenNewEntry()}
                    onResetFilters={() =>
                      setFilter({
                        searchQuery: '',
                        mood: 'all',
                        tag: 'all',
                        onlyFavorites: false,
                        sortBy: 'date-desc',
                      })
                    }
                    onSelectPrompt={(p) => handleOpenPromptInEditor(p)}
                  />
                )}
              </div>
            )}

            {/* Tab 2: Flashbacks / On This Day */}
            {activeTab === 'flashbacks' && (
              <FlashbacksView
                entries={entries}
                onSelectEntry={(e) => setDetailEntry(e)}
                onEditEntry={(e) => handleEditEntry(e)}
                onDeleteEntry={(e) => setDeleteConfirmEntry(e)}
                onWriteNewEntry={() => handleOpenNewEntry()}
              />
            )}

            {/* Tab 3: Sanctuary & Journey Map */}
            {activeTab === 'map' && (
              <MemoryMapView
                entries={entries}
                onSelectEntry={(e) => setDetailEntry(e)}
                onEditEntry={(e) => handleEditEntry(e)}
                onWriteNewEntry={() => handleOpenNewEntry()}
              />
            )}

            {/* Tab 4: Calendar View */}
            {activeTab === 'calendar' && (
              <CalendarView
                entries={entries}
                onSelectEntry={(e) => setDetailEntry(e)}
                onOpenNewEntry={(d) => handleOpenNewEntry(d)}
              />
            )}

            {/* Tab 4: Insights & Analytics */}
            {activeTab === 'analytics' && (
              <AnalyticsView
                stats={stats}
                entries={entries}
                onSeedSampleData={handleSeedSampleEntries}
                isSeeding={isSeedingData}
              />
            )}

            {/* Tab 5: Prompts & Inspiration Deck */}
            {activeTab === 'prompts' && (
              <PromptsDeck onSelectPrompt={(p) => handleOpenPromptInEditor(p)} />
            )}
          </div>
        )}
      </main>

      {/* Entry Editor Modal */}
      <EntryEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialEntry={editingEntry}
        initialPrompt={activePromptForEditor}
      />

      {/* Entry Detail Reader Modal */}
      <EntryDetailModal
        entry={detailEntry}
        onClose={() => setDetailEntry(null)}
        onEdit={(e) => handleEditEntry(e)}
        onDelete={(e) => setDeleteConfirmEntry(e)}
        isVaultUnlocked={isVaultUnlocked}
        onUnlockVault={() => setIsVaultUnlocked(true)}
      />

      {/* AI Digest Modal */}
      <AIDigestModal
        isOpen={aiDigestOpen}
        onClose={() => setAiDigestOpen(false)}
        entries={entries}
      />

      {/* Release & Burn Pad Modal */}
      <ReleasePadModal
        isOpen={releasePadOpen}
        onClose={() => setReleasePadOpen(false)}
      />

      {/* PIN Vault Modal */}
      <PinVaultModal
        isOpen={pinVaultOpen}
        onClose={() => setPinVaultOpen(false)}
        isUnlocked={isVaultUnlocked}
        onUnlockSuccess={() => setIsVaultUnlocked(true)}
        onLock={() => setIsVaultUnlocked(false)}
      />

      {/* Book Print & PDF Publishing Modal */}
      <BookPrintModal
        isOpen={bookPrintOpen}
        onClose={() => setBookPrintOpen(false)}
        entries={entries}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-[#262626] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-stone-200">
            <div className="w-10 h-10 rounded-full bg-rose-950/50 border border-rose-800/40 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-journal font-bold text-white text-lg">
                Delete Journal Entry?
              </h3>
              <p className="text-xs text-stone-400 font-mono-journal mt-1">
                "{deleteConfirmEntry.title}" will be permanently removed from your Firestore database.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmEntry(null)}
                className="px-3.5 py-2 text-xs font-semibold text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEntryConfirm}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <JournalAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
