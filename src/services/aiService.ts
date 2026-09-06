import { JournalEntry, AIDigest, MoodType } from '../types/journal';

export interface SocraticResponse {
  questions: string[];
  affirmation?: string;
  source?: string;
}

export async function askSocraticPartner(
  title: string,
  content: string,
  mood: MoodType
): Promise<SocraticResponse> {
  try {
    const res = await fetch('/api/ai/socratic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, mood }),
    });

    if (!res.ok) {
      throw new Error('Server returned an error');
    }

    return await res.json();
  } catch (err) {
    console.warn('Fallback to local Socratic questions:', err);
    return {
      questions: [
        'What aspect of this moment feels most meaningful to hold onto?',
        'If you looked at this from a place of deep compassion, what would you say to yourself?',
        'What is one gentle step that aligns with your values right now?',
      ],
      affirmation: 'Every honest word written is an act of clarity.',
      source: 'fallback',
    };
  }
}

export async function generateAIDigest(
  entries: JournalEntry[],
  periodName: string = 'the past 7 days'
): Promise<AIDigest> {
  const res = await fetch('/api/ai/digest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries, periodName }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate digest');
  }

  return await res.json();
}

export async function semanticConceptSearch(
  query: string,
  entries: JournalEntry[]
): Promise<{ matchedIds: string[]; explanation?: string }> {
  try {
    const res = await fetch('/api/ai/concept-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, entries }),
    });

    if (!res.ok) {
      throw new Error('Search request failed');
    }

    return await res.json();
  } catch (err) {
    console.warn('Concept search error:', err);
    return { matchedIds: [] };
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  // Safe base64 conversion with chunking to avoid memory issues on longer recordings
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  const base64 = btoa(binary);

  // Client-side retry with backoff for transient 503 / network glitches
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType: audioBlob.type || 'audio/webm',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 503 && attempt === 0) {
          // Wait 1.2s before retrying
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        throw new Error(errorData.error || 'Failed to transcribe audio.');
      }

      const data = await res.json();
      return data.text || '';
    } catch (err: any) {
      if (attempt === 0 && (err?.message?.includes('503') || err?.message?.includes('high demand') || err?.message?.includes('traffic'))) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      throw err;
    }
  }

  return '';
}
