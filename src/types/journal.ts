export type MoodType =
  | 'joyful'
  | 'calm'
  | 'reflective'
  | 'energized'
  | 'grateful'
  | 'anxious'
  | 'melancholy'
  | 'inspired';

export interface MoodConfig {
  id: MoodType;
  label: string;
  emoji: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  accentDot: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: MoodType;
  tags: string[];
  date: string; // Format YYYY-MM-DD
  isFavorite: boolean;
  wordCount: number;
  readingTime: number; // in minutes
  promptUsed?: string;
  createdAt: number; // unix timestamp ms
  updatedAt: number; // unix timestamp ms
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  streakCount: number;
  lastJournalDate: string | null;
  createdAt: number;
}

export interface DailyPrompt {
  id: string;
  category: 'Gratitude' | 'Reflection' | 'Growth' | 'Mindfulness' | 'Creativity' | 'Goals';
  text: string;
  followUp?: string;
}

export interface EntryFilter {
  searchQuery: string;
  mood: MoodType | 'all';
  tag: string | 'all';
  onlyFavorites: boolean;
  sortBy: 'date-desc' | 'date-asc' | 'updated-desc';
}

export interface JournalStats {
  totalEntries: number;
  totalWords: number;
  currentStreak: number;
  longestStreak: number;
  favoriteCount: number;
  moodCounts: Record<MoodType, number>;
  tagCounts: Record<string, number>;
  entriesThisMonth: number;
}
