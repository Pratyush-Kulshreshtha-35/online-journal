import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { JournalEntry, MoodType, JournalStats } from '../types/journal';
import { generateSample30DayEntries, SAMPLE_JOURNAL_TEMPLATES } from '../data/sampleEntries';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const LOCAL_STORAGE_KEY_PREFIX = 'journal_local_entries_';

function getLocalEntries(userId: string): JournalEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + userId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalEntries(userId: string, entries: JournalEntry[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + userId, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('journal_local_update_' + userId));
  } catch (e) {
    console.warn('Failed to save to local storage:', e);
  }
}

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

// Real-time Firestore entries subscription (with seamless local fallback)
export function subscribeUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
) {
  // Local storage mode for offline/guest/referer-blocked sessions
  if (userId.startsWith('local_')) {
    const local = getLocalEntries(userId);
    const sampleTitles = new Set(SAMPLE_JOURNAL_TEMPLATES.map((t) => t.title));
    const hasSample = local.some((e) => sampleTitles.has(e.title));
    let allLocal = local;
    if (!hasSample || local.length === 0) {
      const samples = generateSample30DayEntries(userId);
      const existingTitles = new Set(local.map((e) => e.title));
      const newSamples = samples.filter((s) => !existingTitles.has(s.title));
      allLocal = [...newSamples, ...local].sort((a, b) => b.date.localeCompare(a.date));
      saveLocalEntries(userId, allLocal);
    }
    onUpdate(allLocal);

    const handleStorageUpdate = () => {
      onUpdate(getLocalEntries(userId));
    };
    window.addEventListener('journal_local_update_' + userId, handleStorageUpdate);
    return () => {
      window.removeEventListener('journal_local_update_' + userId, handleStorageUpdate);
    };
  }

  const path = `users/${userId}/entries`;
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
          media: Array.isArray(data.media) ? data.media : [],
          isLocked: Boolean(data.isLocked),
          location: data.location || undefined,
          weather: data.weather || undefined,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
        };
      });

      // Ensure 30-day fake/sample entries are always present to check the mood trendline
      const sampleTitles = new Set(SAMPLE_JOURNAL_TEMPLATES.map((t) => t.title));
      const hasSampleEntries = items.some((e) => sampleTitles.has(e.title));

      let allEntries = items;
      if (!hasSampleEntries && items.length < 25) {
        // Automatically inject sample entries so user immediately sees 30 days of reflections
        const samples = generateSample30DayEntries(userId);
        const existingTitles = new Set(items.map((e) => e.title));
        const newSamples = samples.filter((s) => !existingTitles.has(s.title));
        allEntries = [...newSamples, ...items].sort((a, b) => b.date.localeCompare(a.date));

        saveLocalEntries(userId, allEntries);
        persistSampleEntriesToFirestore(userId, newSamples);
      } else {
        saveLocalEntries(userId, items);
      }

      onUpdate(allEntries);
    },
    (err) => {
      console.warn('Firestore subscription error, checking cached local data:', err);
      const cached = getLocalEntries(userId);
      if (cached.length > 0) {
        onUpdate(cached);
      }
      if (err.message && err.message.includes('insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
      if (onError) onError(err);
    }
  );
}

// Create entry in Firestore (or local storage fallback)
export async function addJournalEntry(
  userId: string,
  entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTime'>
): Promise<string> {
  const stats = calculateReadingStats(entry.content);
  const now = Date.now();

  if (userId.startsWith('local_')) {
    const localId = `entry_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: JournalEntry = {
      ...entry,
      id: localId,
      userId,
      wordCount: stats.wordCount,
      readingTime: stats.readingTime,
      createdAt: now,
      updatedAt: now,
    };
    const current = getLocalEntries(userId);
    saveLocalEntries(userId, [newEntry, ...current]);
    return localId;
  }

  const path = `users/${userId}/entries`;
  try {
    const entriesRef = collection(db, 'users', userId, 'entries');
    const docRef = await addDoc(entriesRef, {
      ...entry,
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
    } catch {
      // Non-critical profile update
    }

    return docRef.id;
  } catch (err: any) {
    // If permission or configuration issue, also mirror locally so user never loses their writing
    const fallbackId = `entry_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const fallbackEntry: JournalEntry = {
      ...entry,
      id: fallbackId,
      userId,
      wordCount: stats.wordCount,
      readingTime: stats.readingTime,
      createdAt: now,
      updatedAt: now,
    };
    const current = getLocalEntries(userId);
    saveLocalEntries(userId, [fallbackEntry, ...current]);

    if (err.message && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    return fallbackId;
  }
}

// Update entry in Firestore (or local storage fallback)
export async function updateJournalEntry(
  userId: string,
  entryId: string,
  updates: Partial<Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const stats = typeof updates.content === 'string' ? calculateReadingStats(updates.content) : null;
  const now = Date.now();

  if (userId.startsWith('local_')) {
    const current = getLocalEntries(userId);
    const updated = current.map((e) => {
      if (e.id === entryId) {
        return {
          ...e,
          ...updates,
          ...(stats ? { wordCount: stats.wordCount, readingTime: stats.readingTime } : {}),
          updatedAt: now,
        };
      }
      return e;
    });
    saveLocalEntries(userId, updated);
    return;
  }

  const path = `users/${userId}/entries/${entryId}`;
  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);
    const dataToUpdate: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    if (stats) {
      dataToUpdate.wordCount = stats.wordCount;
      dataToUpdate.readingTime = stats.readingTime;
    }

    await updateDoc(entryRef, dataToUpdate);
  } catch (err: any) {
    // Mirror update locally
    const current = getLocalEntries(userId);
    const updated = current.map((e) => {
      if (e.id === entryId) {
        return {
          ...e,
          ...updates,
          ...(stats ? { wordCount: stats.wordCount, readingTime: stats.readingTime } : {}),
          updatedAt: now,
        };
      }
      return e;
    });
    saveLocalEntries(userId, updated);

    if (err.message && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }
}

// Toggle Favorite
export async function toggleEntryFavorite(
  userId: string,
  entryId: string,
  currentFavorite: boolean
): Promise<void> {
  if (userId.startsWith('local_')) {
    const current = getLocalEntries(userId);
    const updated = current.map((e) => (e.id === entryId ? { ...e, isFavorite: !currentFavorite } : e));
    saveLocalEntries(userId, updated);
    return;
  }

  const path = `users/${userId}/entries/${entryId}`;
  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);
    await updateDoc(entryRef, {
      isFavorite: !currentFavorite,
      updatedAt: serverTimestamp(),
    });
  } catch (err: any) {
    const current = getLocalEntries(userId);
    const updated = current.map((e) => (e.id === entryId ? { ...e, isFavorite: !currentFavorite } : e));
    saveLocalEntries(userId, updated);

    if (err.message && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }
}

// Delete entry
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (userId.startsWith('local_')) {
    const current = getLocalEntries(userId);
    saveLocalEntries(userId, current.filter((e) => e.id !== entryId));
    return;
  }

  const path = `users/${userId}/entries/${entryId}`;
  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(entryRef);
  } catch (err: any) {
    const current = getLocalEntries(userId);
    saveLocalEntries(userId, current.filter((e) => e.id !== entryId));

    if (err.message && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
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

// Persist sample entries into Firestore with deterministic IDs and fallback to individual sets
export async function persistSampleEntriesToFirestore(userId: string, samples: JournalEntry[]): Promise<void> {
  if (userId.startsWith('local_') || samples.length === 0) return;

  try {
    const entriesRef = collection(db, 'users', userId, 'entries');
    const batch = writeBatch(db);
    for (const sample of samples) {
      const docRef = doc(entriesRef, sample.id);
      batch.set(docRef, {
        title: sample.title,
        content: sample.content,
        mood: sample.mood,
        tags: sample.tags,
        date: sample.date,
        isFavorite: Boolean(sample.isFavorite),
        wordCount: sample.wordCount,
        readingTime: sample.readingTime,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (batchErr) {
    console.warn('Batch write of samples failed, falling back to individual sets:', batchErr);
    for (const sample of samples) {
      try {
        const docRef = doc(collection(db, 'users', userId, 'entries'), sample.id);
        await setDoc(docRef, {
          title: sample.title,
          content: sample.content,
          mood: sample.mood,
          tags: sample.tags,
          date: sample.date,
          isFavorite: Boolean(sample.isFavorite),
          wordCount: sample.wordCount,
          readingTime: sample.readingTime,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Local persistence already verified
      }
    }
  }
}

// Seed 30 days of realistic sample journal entries for the user
export async function seed30DaySampleEntries(userId: string): Promise<JournalEntry[]> {
  const sampleEntries = generateSample30DayEntries(userId);

  // Always update local cache first for instant visual responsiveness
  const existingLocal = getLocalEntries(userId);
  const existingTitles = new Set(existingLocal.map((e) => e.title));
  const newSamples = sampleEntries.filter((s) => !existingTitles.has(s.title));
  const mergedLocal = [...newSamples, ...existingLocal].sort((a, b) => b.date.localeCompare(a.date));
  saveLocalEntries(userId, mergedLocal);

  // If authenticated with Firestore, persist them into the user's collection
  if (!userId.startsWith('local_')) {
    await persistSampleEntriesToFirestore(userId, sampleEntries);
  }

  return mergedLocal;
}
