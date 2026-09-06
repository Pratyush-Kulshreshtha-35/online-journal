import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  History,
  Sparkles,
  Lock,
  Unlock,
  Printer,
  Wind,
  Sun,
  Moon,
  MapPin,
} from 'lucide-react';
import { JournalEntry, JournalStats } from '../types/journal';
import { exportEntriesAsJSON, exportEntriesAsMarkdown } from '../services/journalService';
import { SoundscapeWidget } from './SoundscapeWidget';

export type MainTabType = 'entries' | 'calendar' | 'analytics' | 'prompts' | 'flashbacks' | 'map';

interface HeaderProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  onOpenNewEntry: () => void;
  onOpenAuthModal: () => void;
  onOpenAIDigest: () => void;
  onOpenReleasePad: () => void;
  onOpenPinVault: () => void;
  onOpenBookPrint: () => void;
  isVaultUnlocked: boolean;
  stats: JournalStats;
  entries: JournalEntry[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewEntry,
  onOpenAuthModal,
  onOpenAIDigest,
  onOpenReleasePad,
  onOpenPinVault,
  onOpenBookPrint,
  isVaultUnlocked,
  stats,
  entries,
}) => {
  const { user, profile, logout, isLocalMode } = useAuth();
  const { isPaper, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-200 ${
      isPaper ? 'bg-[#F7F4EC]/95 border-[#E2DBD0]' : 'bg-[#111111]/95 border-[#222222]'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo and App Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm rotate-45 bg-amber-600 flex items-center justify-center shadow-[0_0_12px_rgba(217,119,6,0.3)]">
              <div className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-xs flex items-center justify-center -rotate-45 text-amber-500 ${
                isPaper ? 'bg-[#F7F4EC]' : 'bg-[#0A0A0A]'
              }`}>
                <BookOpen className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`font-serif-journal text-lg sm:text-xl font-bold tracking-tight ${
                  isPaper ? 'text-stone-900' : 'text-white'
                }`}>
                  Journal
                </span>
                <span className={`text-[9px] uppercase font-mono-journal tracking-widest px-1.5 py-0.5 rounded-sm font-semibold hidden xs:inline ${
                  isPaper ? 'bg-[#EFE9DE] border border-[#DFD7CA] text-amber-800' : 'bg-[#1C1C1C] border border-[#2A2A2A] text-amber-500'
                }`}>
                  Vault
                </span>
              </div>
              <p className={`text-[10px] hidden md:block font-mono-journal ${
                isPaper ? 'text-stone-500' : 'text-stone-500'
              }`}>
                Private cloud reflections & memories
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className={`hidden lg:flex items-center p-1 rounded-xl border transition-colors ${
            isPaper ? 'bg-[#EFE9DE] border-[#DFD7CA]' : 'bg-[#161616] border-[#242424]'
          }`}>
            <button
              id="nav-entries"
              onClick={() => setActiveTab('entries')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'entries'
                  ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs')
                  : (isPaper ? 'text-stone-600 hover:text-stone-900' : 'text-stone-400 hover:text-stone-200')
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Entries</span>
              {stats.totalEntries > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full font-mono-journal border ${
                  isPaper ? 'bg-[#F7F4EC] text-amber-800 border-[#DFD7CA]' : 'bg-[#111111] text-amber-500 border-[#282828]'
                }`}>
                  {stats.totalEntries}
                </span>
              )}
            </button>

            <button
              id="nav-flashbacks"
              onClick={() => setActiveTab('flashbacks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'flashbacks'
                  ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs')
                  : (isPaper ? 'text-stone-600 hover:text-stone-900' : 'text-stone-400 hover:text-stone-200')
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>Flashbacks</span>
            </button>

            <button
              id="nav-map"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'map'
                  ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs')
                  : (isPaper ? 'text-stone-600 hover:text-stone-900' : 'text-stone-400 hover:text-stone-200')
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Journey Map</span>
            </button>

            <button
              id="nav-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs')
                  : (isPaper ? 'text-stone-600 hover:text-stone-900' : 'text-stone-400 hover:text-stone-200')
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>

            <button
              id="nav-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs')
                  : (isPaper ? 'text-stone-600 hover:text-stone-900' : 'text-stone-400 hover:text-stone-200')
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Insights</span>
            </button>

            <button
              id="nav-prompts"
              onClick={() => setActiveTab('prompts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'prompts'
                  ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs')
                  : (isPaper ? 'text-stone-600 hover:text-stone-900' : 'text-stone-400 hover:text-stone-200')
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Prompts</span>
            </button>
          </nav>

          {/* Right Actions: Soundscape, AI Digest, Release, Vault, Streak, New Entry, Export, User */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Ambient Soundscapes generator */}
            <SoundscapeWidget />

            {/* AI Digest trigger */}
            <button
              id="btn-ai-digest"
              onClick={onOpenAIDigest}
              title="AI Weekly Digest & Mindful Synthesis"
              className="p-1.5 sm:p-2 bg-[#161616] hover:bg-[#202020] text-amber-400 hover:text-amber-300 border border-[#2A2A2A] hover:border-amber-700/50 rounded-xl transition"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Release Pad modal */}
            <button
              id="btn-release-pad"
              onClick={onOpenReleasePad}
              title="Release Pad (Write & Burn ephemeral thoughts)"
              className="p-1.5 sm:p-2 bg-[#161616] hover:bg-[#202020] text-stone-400 hover:text-rose-400 border border-[#2A2A2A] hover:border-rose-900/50 rounded-xl transition"
            >
              <Wind className="w-4 h-4" />
            </button>

            {/* PIN Vault lock indicator & toggle */}
            <button
              id="btn-pin-vault"
              onClick={onOpenPinVault}
              title={isVaultUnlocked ? 'Vault is Unlocked (Click to manage)' : 'Vault is Locked (Click to enter PIN)'}
              className={`p-1.5 sm:p-2 rounded-xl border transition ${
                isVaultUnlocked
                  ? 'bg-amber-950/60 border-amber-700/70 text-amber-400'
                  : 'bg-[#161616] border-[#2A2A2A] text-stone-400 hover:text-white'
              }`}
            >
              {isVaultUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>

            {/* Reading Theme Toggle: Default Dark Sanctuary vs Traditional Paper Mode */}
            <button
              id="btn-theme-toggle"
              type="button"
              onClick={toggleTheme}
              title={
                isPaper
                  ? 'Switch to Night Sanctuary (Dark Mode)'
                  : 'Switch to Paper Mode (Traditional Light Reading)'
              }
              aria-label={
                isPaper
                  ? 'Switch to Night Sanctuary'
                  : 'Switch to Paper Mode'
              }
              className={`p-1.5 sm:p-2 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                isPaper
                  ? 'bg-[#EFE9DE] border-[#D8D0C3] text-stone-800 hover:bg-[#E5DEC0] shadow-xs'
                  : 'bg-[#161616] hover:bg-[#202020] text-stone-400 hover:text-amber-400 border border-[#2A2A2A]'
              }`}
            >
              {isPaper ? (
                <>
                  <Moon className="w-4 h-4 text-stone-700" />
                  <span className="text-[11px] font-mono-journal font-medium hidden md:inline text-stone-800">
                    Paper
                  </span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-mono-journal font-medium hidden md:inline text-stone-300">
                    Night
                  </span>
                </>
              )}
            </button>

            {/* Streak Counter */}
            <div
              id="streak-indicator"
              title={`${stats.currentStreak} day writing streak`}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
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
              className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-semibold rounded-lg text-xs sm:text-sm shadow-[0_0_15px_rgba(217,119,6,0.25)] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Write Entry</span>
              <span className="sm:hidden">Write</span>
            </button>

            {/* Export & Book Print Menu */}
            {entries.length > 0 && (
              <div className="relative">
                <button
                  id="btn-export-menu"
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  title="Export & Backup Journal"
                  className="p-1.5 sm:p-2 text-stone-400 hover:text-stone-200 hover:bg-[#1C1C1C] rounded-xl border border-[#262626] transition"
                >
                  <Download className="w-4 h-4" />
                </button>

                {exportDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setExportDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-[#141414] border border-[#2A2A2A] rounded-xl shadow-2xl py-1.5 z-50 text-xs text-stone-200">
                      <div className="px-3.5 py-1.5 text-[10px] font-semibold text-stone-500 uppercase tracking-widest font-mono-journal">
                        Publish & Backups
                      </div>
                      <button
                        onClick={() => {
                          setExportDropdownOpen(false);
                          onOpenBookPrint();
                        }}
                        className="w-full text-left px-3.5 py-2 text-amber-400 hover:bg-[#1F1F1F] flex items-center gap-2.5 transition font-medium"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Hardcover Book / PDF</span>
                      </button>
                      <div className="h-px bg-[#222222] my-1" />
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
                  className="flex items-center gap-1.5 p-1 pl-1.5 sm:pr-2 bg-[#161616] hover:bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl text-stone-200 transition"
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
                  <ChevronDown className="w-3 h-3 text-stone-500 hidden sm:block" />
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
                        {isLocalMode ? (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md w-fit font-mono-journal">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Local Sanctuary Mode</span>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md w-fit font-mono-journal">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Firestore Secured</span>
                          </div>
                        )}
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

                      {/* Theme Toggle Option */}
                      <div className="px-3.5 py-2 border-b border-[#222222] flex items-center justify-between">
                        <span className="text-[11px] text-stone-400">Reading Theme</span>
                        <button
                          id="btn-dropdown-theme-toggle"
                          type="button"
                          onClick={toggleTheme}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#222222] text-amber-400 text-[11px] font-mono-journal hover:bg-[#2c2c2c] transition"
                        >
                          {isPaper ? <Moon className="w-3 h-3 text-stone-300" /> : <Sun className="w-3 h-3 text-amber-400" />}
                          <span>{isPaper ? 'Paper Mode' : 'Night Mode'}</span>
                        </button>
                      </div>

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
        <div className={`flex lg:hidden py-2 border-t overflow-x-auto gap-1 transition-colors ${
          isPaper ? 'border-[#E2DBD0]' : 'border-[#222222]'
        }`}>
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex-1 min-w-[70px] py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'entries'
                ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333]')
                : (isPaper ? 'text-stone-600' : 'text-stone-400')
            }`}
          >
            Entries ({stats.totalEntries})
          </button>
          <button
            onClick={() => setActiveTab('flashbacks')}
            className={`flex-1 min-w-[85px] py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'flashbacks'
                ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333]')
                : (isPaper ? 'text-stone-600' : 'text-stone-400')
            }`}
          >
            Flashbacks
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 min-w-[65px] py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'map'
                ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333]')
                : (isPaper ? 'text-stone-600' : 'text-stone-400')
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 min-w-[70px] py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'calendar'
                ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333]')
                : (isPaper ? 'text-stone-600' : 'text-stone-400')
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 min-w-[70px] py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'analytics'
                ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333]')
                : (isPaper ? 'text-stone-600' : 'text-stone-400')
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex-1 min-w-[70px] py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'prompts'
                ? (isPaper ? 'bg-white text-amber-800 border border-[#D8D0C3] shadow-xs' : 'bg-[#222222] text-amber-400 border border-[#333333]')
                : (isPaper ? 'text-stone-600' : 'text-stone-400')
            }`}
          >
            Prompts
          </button>
        </div>
      </div>
    </header>
  );
};
