import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  Flame,
  Calendar,
  BarChart3,
  Lightbulb,
  ListFilter,
  Download,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  FileText,
  Database,
} from 'lucide-react';
import { JournalEntry, JournalStats } from '../types/journal';
import { exportEntriesAsJSON, exportEntriesAsMarkdown } from '../services/journalService';

interface HeaderProps {
  activeTab: 'entries' | 'calendar' | 'analytics' | 'prompts';
  setActiveTab: (tab: 'entries' | 'calendar' | 'analytics' | 'prompts') => void;
  onOpenNewEntry: () => void;
  onOpenAuthModal: () => void;
  stats: JournalStats;
  entries: JournalEntry[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewEntry,
  onOpenAuthModal,
  stats,
  entries,
}) => {
  const { user, profile, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#111111]/90 backdrop-blur-md border-b border-[#222222] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and App Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm rotate-45 bg-amber-600 flex items-center justify-center shadow-[0_0_12px_rgba(217,119,6,0.3)]">
              <div className="w-4.5 h-4.5 bg-[#0A0A0A] rounded-xs flex items-center justify-center -rotate-45 text-amber-500">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-journal text-xl font-bold tracking-tight text-white">
                  Journal
                </span>
                <span className="text-[9px] uppercase font-mono-journal tracking-widest px-1.5 py-0.5 rounded-sm bg-[#1C1C1C] border border-[#2A2A2A] text-amber-500 font-semibold">
                  Firestore
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block font-mono-journal">
                Private cloud reflections
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center p-1 bg-[#161616] rounded-xl border border-[#242424]">
            <button
              id="nav-entries"
              onClick={() => setActiveTab('entries')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'entries'
                  ? 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Entries</span>
              {stats.totalEntries > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-[#111111] text-amber-500/90 font-mono-journal border border-[#282828]">
                  {stats.totalEntries}
                </span>
              )}
            </button>

            <button
              id="nav-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>

            <button
              id="nav-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Insights</span>
            </button>

            <button
              id="nav-prompts"
              onClick={() => setActiveTab('prompts')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'prompts'
                  ? 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Prompts</span>
            </button>
          </nav>

          {/* Right Actions: Streak, New Entry, Export, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Counter */}
            <div
              id="streak-indicator"
              title={`${stats.currentStreak} day writing streak`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                stats.currentStreak > 0
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                  : 'bg-[#161616] border-[#262626] text-stone-500'
              }`}
            >
              <Flame
                className={`w-3.5 h-3.5 ${
                  stats.currentStreak > 0 ? 'text-amber-500 fill-amber-500' : 'text-stone-600'
                }`}
              />
              <span className="font-mono-journal font-semibold">{stats.currentStreak}d</span>
            </div>

            {/* New Entry Button */}
            <button
              id="btn-new-entry"
              onClick={onOpenNewEntry}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-semibold rounded-lg text-xs sm:text-sm shadow-[0_0_15px_rgba(217,119,6,0.25)] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Write Entry</span>
              <span className="sm:hidden">Write</span>
            </button>

            {/* Export Menu */}
            {entries.length > 0 && (
              <div className="relative">
                <button
                  id="btn-export-menu"
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  title="Export & Backup Journal"
                  className="p-2 text-stone-400 hover:text-stone-200 hover:bg-[#1C1C1C] rounded-xl border border-[#262626] transition"
                >
                  <Download className="w-4 h-4" />
                </button>

                {exportDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setExportDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-[#141414] border border-[#2A2A2A] rounded-xl shadow-2xl py-1.5 z-50 text-xs text-stone-200">
                      <div className="px-3.5 py-1.5 text-[10px] font-semibold text-stone-500 uppercase tracking-widest font-mono-journal">
                        Export Entries
                      </div>
                      <button
                        id="export-markdown"
                        onClick={() => {
                          exportEntriesAsMarkdown(entries);
                          setExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-stone-300 hover:text-white hover:bg-[#1F1F1F] flex items-center gap-2.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span>Markdown Archive (.md)</span>
                      </button>
                      <button
                        id="export-json"
                        onClick={() => {
                          exportEntriesAsJSON(entries);
                          setExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-stone-300 hover:text-white hover:bg-[#1F1F1F] flex items-center gap-2.5 transition"
                      >
                        <Database className="w-3.5 h-3.5 text-amber-500" />
                        <span>JSON Backup (.json)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Account Controls */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 sm:pr-2.5 bg-[#161616] hover:bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl text-stone-200 transition"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={profile?.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-amber-600/40"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#242424] text-amber-500 border border-amber-500/30 flex items-center justify-center text-xs font-semibold">
                      {(profile?.displayName || user.email || 'J')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium max-w-[100px] truncate hidden md:inline text-stone-300">
                    {profile?.displayName || (user.isAnonymous ? 'Guest User' : user.email?.split('@')[0])}
                  </span>
                  <ChevronDown className="w-3 h-3 text-stone-500" />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-60 bg-[#141414] border border-[#2A2A2A] rounded-xl shadow-2xl py-2 z-50 text-xs text-stone-200">
                      <div className="px-3.5 py-2 border-b border-[#222222]">
                        <p className="font-semibold text-white truncate">
                          {profile?.displayName || (user.isAnonymous ? 'Guest User' : 'Authenticated User')}
                        </p>
                        <p className="text-[11px] text-stone-400 truncate font-mono-journal">
                          {user.email || (user.isAnonymous ? 'Anonymous session' : '')}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md w-fit font-mono-journal">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Firestore Secured</span>
                        </div>
                      </div>

                      {user.isAnonymous && (
                        <div className="px-3.5 py-2 bg-amber-950/20 border-b border-[#222222]">
                          <p className="text-[11px] text-amber-300/90 mb-1.5 leading-relaxed">
                            Guest entries are saved to your browser session. Link an account to sync across devices.
                          </p>
                          <button
                            id="btn-upgrade-account"
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              onOpenAuthModal();
                            }}
                            className="w-full py-1.5 text-center font-medium bg-amber-600 hover:bg-amber-500 text-black rounded-lg text-[11px] transition font-semibold"
                          >
                            Sign In / Create Account
                          </button>
                        </div>
                      )}

                      <button
                        id="btn-logout"
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 mt-1 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                id="btn-signin-header"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#282828] text-stone-200 border border-[#333333] rounded-xl text-xs font-medium transition"
              >
                <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden py-2 border-t border-[#222222] overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex-1 py-1.5 px-2 text-center text-xs font-semibold rounded-lg ${
              activeTab === 'entries' ? 'bg-[#222222] text-amber-400 border border-[#333333]' : 'text-stone-400'
            }`}
          >
            Entries ({stats.totalEntries})
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-1.5 px-2 text-center text-xs font-semibold rounded-lg ${
              activeTab === 'calendar' ? 'bg-[#222222] text-amber-400 border border-[#333333]' : 'text-stone-400'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-1.5 px-2 text-center text-xs font-semibold rounded-lg ${
              activeTab === 'analytics' ? 'bg-[#222222] text-amber-400 border border-[#333333]' : 'text-stone-400'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex-1 py-1.5 px-2 text-center text-xs font-semibold rounded-lg ${
              activeTab === 'prompts' ? 'bg-[#222222] text-amber-400 border border-[#333333]' : 'text-stone-400'
            }`}
          >
            Prompts
          </button>
        </div>
      </div>
    </header>
  );
};
