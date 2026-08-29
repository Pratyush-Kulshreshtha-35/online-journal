import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { EntryEditor } from './components/EntryEditor';
import { EntryCard } from './components/EntryCard';
import { EntryDetailModal } from './components/EntryDetailModal';
import { FilterBar } from './components/FilterBar';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { PromptsDeck } from './components/PromptsDeck';
import { EmptyState } from './components/EmptyState';
import {
  JournalEntry,
  EntryFilter,
} from './types/journal';
import {
  subscribeUserEntries,
  deleteJournalEntry,
  computeJournalStats,
} from './services/journalService';
import {
  BookOpen,
  Sparkles,
  Lock,
  Plus,
  Shield,
  Loader2,
  Trash2,
} from 'lucide-react';

function JournalAppContent() {
  const { user, loading: authLoading } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Main View Tab
  const [activeTab, setActiveTab] = useState<'entries' | 'calendar' | 'analytics' | 'prompts'>('entries');

  // Modals & Drawers
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activePromptForEditor, setActivePromptForEditor] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<JournalEntry | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<JournalEntry | null>(null);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-stone-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="font-serif-journal text-stone-300 text-sm">Opening your journal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#D4D4D4] selection:bg-amber-950">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewEntry={() => handleOpenNewEntry()}
        onOpenAuthModal={() => setAuthModalOpen(true)}
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
              <span>Private & Firestore Encrypted</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-serif-journal font-bold tracking-tight text-white leading-tight">
                Your quiet sanctuary for thoughts, memories, and self-reflection.
              </h1>
              <p className="text-base sm:text-lg text-stone-400 font-serif-journal max-w-xl mx-auto leading-relaxed">
                A minimal, authenticated journal app with mood tracking, reflection prompts,
                calendar insights, and cloud persistence with Firebase and Cloud Firestore.
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 text-left">
              <div className="p-5 bg-[#111111] border border-[#222222] rounded-2xl shadow-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center mb-3">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-serif-journal font-bold text-white text-base">Private Firestore</h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Security rules guarantee only you have read and write access to your entries.
                </p>
              </div>

              <div className="p-5 bg-[#111111] border border-[#222222] rounded-2xl shadow-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-serif-journal font-bold text-white text-base">Daily Reflection</h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Deep curated prompt decks and mood tracking to nurture your wellbeing.
                </p>
              </div>

              <div className="p-5 bg-[#111111] border border-[#222222] rounded-2xl shadow-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center mb-3">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-serif-journal font-bold text-white text-base">Rich Markdown & Export</h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Format thoughts seamlessly and backup your personal archive to Markdown or JSON anytime.
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

            {/* Tab 2: Calendar View */}
            {activeTab === 'calendar' && (
              <CalendarView
                entries={entries}
                onSelectEntry={(e) => setDetailEntry(e)}
                onOpenNewEntry={(d) => handleOpenNewEntry(d)}
              />
            )}

            {/* Tab 3: Insights & Analytics */}
            {activeTab === 'analytics' && (
              <AnalyticsView stats={stats} entries={entries} />
            )}

            {/* Tab 4: Prompts & Inspiration Deck */}
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
    <AuthProvider>
      <JournalAppContent />
    </AuthProvider>
  );
}
