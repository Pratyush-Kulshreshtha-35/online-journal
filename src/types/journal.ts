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

export interface MediaAttachment {
  id: string;
  type: 'photo' | 'video' | 'gif' | 'audio' | 'music';
  url: string; // URL or base64 data string
  caption?: string;
  title?: string;
  duration?: number; // For audio/music in seconds
}

export interface WeatherStamp {
  temperatureC: number;
  temperatureF: number;
  condition: string; // e.g. "Sunny", "Overcast", "Rain", "Clear"
  icon: string; // "sun" | "cloud-sun" | "cloud" | "cloud-rain" | "cloud-snow" | "cloud-lightning" | "wind" | "moon"
  humidity?: number; // percentage
  windSpeedKmh?: number;
  locationName?: string;
}

export interface LocationTag {
  placeName: string; // e.g. "Mission District, San Francisco" or "Home Sanctuary"
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
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
  media?: MediaAttachment[];
  isLocked?: boolean;
  location?: LocationTag;
  weather?: WeatherStamp;
  createdAt: number; // unix timestamp ms
  updatedAt: number; // unix timestamp ms
}

export interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  mood: MoodType;
  defaultTags: string[];
  titleSuggestion: string;
  structure: string;
}

export interface AIDigest {
  title: string;
  overview: string;
  dominantMood: string;
  themes: string[];
  highlights: string[];
  growthInsight: string;
  encouragement: string;
  source?: string;
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
