import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { JournalEntry, MoodType, JournalStats } from '../types/journal';

// Helper to calculate word count & reading time
export function calculateReadingStats(text: string): { wordCount: number; readingTime: number } {
  const trimmed = text.trim();
  if (!trimmed) return { wordCount: 0, readingTime: 0 };
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readingTime };
}

// Calculate streak based on entry dates (YYYY-MM-DD)
export function calculateStreak(entries: JournalEntry[]): { currentStreak: number; longestStreak: number } {
  if (!entries.length) return { currentStreak: 0, longestStreak: 0 };

  // Unique sorted dates in descending order
  const uniqueDates = Array.from(new Set(entries.map((e) => e.date))).sort((a, b) => b.localeCompare(a));
  if (!uniqueDates.length) return { currentStreak: 0, longestStreak: 0 };

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;

  // Check if latest date is today or yesterday
  const latestDate = uniqueDates[0];
  const isStreakActive = latestDate === today || latestDate === yesterday;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffTime = Math.abs(prev.getTime() - curr.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
  }

  // Calculate ongoing active streak
  if (isStreakActive) {
    let activeCount = 0;
    let expectedDate = new Date(latestDate);

    for (const dStr of uniqueDates) {
      const dateObj = new Date(dStr);
      const diff = Math.round((expectedDate.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0) {
        activeCount++;
        expectedDate = new Date(dateObj.getTime() - 86400000);
      } else {
        break;
      }
    }
    currentStreak = activeCount;
  } else {
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak: Math.max(maxStreak, currentStreak),
  };
}

// Compute aggregate stats from entries
export function computeJournalStats(entries: JournalEntry[]): JournalStats {
  const totalEntries = entries.length;
  let totalWords = 0;
  let favoriteCount = 0;
  const moodCounts: Record<MoodType, number> = {
    joyful: 0,
    calm: 0,
    reflective: 0,
    energized: 0,
    grateful: 0,
    anxious: 0,
    melancholy: 0,
    inspired: 0,
  };
  const tagCounts: Record<string, number> = {};

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  let entriesThisMonth = 0;

  for (const entry of entries) {
    totalWords += entry.wordCount || 0;
    if (entry.isFavorite) favoriteCount++;
    if (entry.mood && moodCounts[entry.mood] !== undefined) {
      moodCounts[entry.mood]++;
    }
    if (entry.tags && Array.isArray(entry.tags)) {
      for (const t of entry.tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
    if (entry.date && entry.date.startsWith(currentYearMonth)) {
      entriesThisMonth++;
    }
  }

  const { currentStreak, longestStreak } = calculateStreak(entries);

  return {
    totalEntries,
    totalWords,
    currentStreak,
    longestStreak,
    favoriteCount,
    moodCounts,
    tagCounts,
    entriesThisMonth,
  };
}

// Real-time Firestore entries subscription
export function subscribeUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
) {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: JournalEntry[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId,
          title: data.title || 'Untitled Entry',
          content: data.content || '',
          mood: data.mood || 'reflective',
          tags: Array.isArray(data.tags) ? data.tags : [],
          date: data.date || new Date().toISOString().split('T')[0],
          isFavorite: Boolean(data.isFavorite),
          wordCount: data.wordCount || 0,
          readingTime: data.readingTime || 1,
          promptUsed: data.promptUsed || undefined,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
        };
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Firestore entries subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Create entry in Firestore
export async function addJournalEntry(
  userId: string,
  entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTime'>
): Promise<string> {
  const stats = calculateReadingStats(entry.content);
  const entriesRef = collection(db, 'users', userId, 'entries');

  const docRef = await addDoc(entriesRef, {
    ...entry,
    promptUsed: entry.promptUsed ?? null, // Prevents Firestore crash when undefined
    wordCount: stats.wordCount,
    readingTime: stats.readingTime,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

// Update user profile streak and lastJournalDate
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastJournalDate: entry.date,
      lastActive: serverTimestamp(),
    });
  } catch (e) {
    // Non-critical profile update
  }

  return docRef.id;
}

// Update entry in Firestore
export async function updateJournalEntry(
  userId: string,
  entryId: string,
  updates: Partial<Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const dataToUpdate: any = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if ('promptUsed' in updates) {
    dataToUpdate.promptUsed = updates.promptUsed ?? null;
  }

  if (typeof updates.content === 'string') {
    const stats = calculateReadingStats(updates.content);
    dataToUpdate.wordCount = stats.wordCount;
    dataToUpdate.readingTime = stats.readingTime;
  }

  await updateDoc(entryRef, dataToUpdate);
}

// Toggle Favorite
export async function toggleEntryFavorite(
  userId: string,
  entryId: string,
  currentFavorite: boolean
): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await updateDoc(entryRef, {
    isFavorite: !currentFavorite,
    updatedAt: serverTimestamp(),
  });
}

// Delete entry
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

// Export as JSON
export function exportEntriesAsJSON(entries: JournalEntry[]) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `journal-backup-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Export as Markdown
export function exportEntriesAsMarkdown(entries: JournalEntry[]) {
  let mdContent = `# My Journal Archive\n*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

  entries.forEach((e) => {
    mdContent += `## ${e.title}\n`;
    mdContent += `**Date:** ${e.date} | **Mood:** ${e.mood} ${e.tags.length ? `| **Tags:** ${e.tags.join(', ')}` : ''}\n\n`;
    if (e.promptUsed) {
      mdContent += `> *Prompt: ${e.promptUsed}*\n\n`;
    }
    mdContent += `${e.content}\n\n`;
    mdContent += `---\n\n`;
  });

  const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `journal-export-${new Date().toISOString().split('T')[0]}.md`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
