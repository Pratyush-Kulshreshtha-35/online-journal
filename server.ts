import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Executes a Gemini generateContent request with automatic retries for transient errors
 * (such as 503 high demand or 429 rate limit spikes) and falls back across compliant models.
 */
async function generateWithFallback(
  ai: GoogleGenAI,
  models: string[],
  params: { contents: any; config?: any }
) {
  let lastError: any = null;

  for (let mIndex = 0; mIndex < models.length; mIndex++) {
    const currentModel = models[mIndex];
    // Up to 2 attempts per model for transient errors
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const status = err?.status || err?.code || err?.error?.code;
        const isTransient =
          status === 503 ||
          status === 429 ||
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('ResourceExhausted') ||
          msg.includes('overloaded');

        if (isTransient && attempt === 0) {
          // Wait 600-1000ms with jitter before retrying this model
          await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
          continue;
        }

        // If attempts for this model exhausted, log graceful transition to next model
        console.log(
          `[Gemini Rotation] Model ${currentModel} busy or unavailable (${status || 'transient'}), attempting next model...`
        );
        break;
      }
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  // AI Socratic Writing Partner
  app.post('/api/ai/socratic', async (req, res) => {
    try {
      const { title, content, mood } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Journal content is required.' });
      }

      const ai = getAIClient();
      if (!ai) {
        return res.json({
          questions: [
            "What part of this experience feels most significant to you right now?",
            "If you stepped back and looked at this situation with compassionate curiosity, what would you notice?",
            "What is one small kindness or boundary you could offer yourself tomorrow?"
          ],
          source: 'fallback'
        });
      }

      const prompt = `You are a gentle, deeply observant, and compassionate philosophical journaling partner and mindful counselor.
The user just wrote the following private journal entry:
Title: "${title || 'Untitled'}"
Mood: "${mood || 'reflective'}"
Content:
"""
${content.slice(0, 4000)}
"""

Formulate 3 brief, profound, non-judgmental Socratic follow-up questions to help the writer explore their inner landscape, emotional truths, or perspective deeper.
Return ONLY valid JSON in the exact format:
{
  "questions": [
    "Question 1...",
    "Question 2...",
    "Question 3..."
  ],
  "affirmation": "A short, warm one-sentence reflective affirmation for the writer."
}`;

      const response = await generateWithFallback(
        ai,
        ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'],
        {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }
      );

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      res.json({ ...parsed, source: 'gemini' });
    } catch (err: any) {
      console.error('Gemini Socratic API error:', err);
      res.json({
        questions: [
          "What part of this experience feels most significant to you right now?",
          "If you stepped back and looked at this situation with compassionate curiosity, what would you notice?",
          "What is one small kindness or boundary you could offer yourself tomorrow?"
        ],
        affirmation: "Honor the courage it took to write this down.",
        source: 'fallback'
      });
    }
  });

  // AI Weekly / Monthly Digest
  app.post('/api/ai/digest', async (req, res) => {
    try {
      const { entries, periodName } = req.body;
      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ error: 'No entries provided for digest.' });
      }

      const ai = getAIClient();
      if (!ai) {
        return res.json({
          overview: "Your recent reflections highlight a steady cadence of personal introspection, resilience through daily fluctuations, and meaningful self-care.",
          themes: ["Mindful Awareness", "Daily Resilience", "Emotional Balance"],
          highlights: entries.slice(0, 3).map((e: any) => `Reflected on ${e.title || 'daily life'}`),
          growthInsight: "Notice how consistently showing up to write provides perspective even during turbulent days.",
          source: 'fallback'
        });
      }

      const summarizedEntries = entries.slice(0, 25).map((e: any) => ({
        date: e.date,
        title: e.title,
        mood: e.mood,
        tags: e.tags,
        snippet: (e.content || '').slice(0, 300),
      }));

      const prompt = `You are an empathetic mindfulness archivist and personal growth analyst.
The user has compiled journal entries for ${periodName || 'the recent period'}.
Here are the entries:
${JSON.stringify(summarizedEntries, null, 2)}

Provide a thoughtful, beautifully written summary digest of their emotional trajectory, recurrent themes, key moments, and mindful guidance.
Return ONLY valid JSON matching this structure:
{
  "title": "A poetic, inspiring title for this digest period",
  "overview": "A warm 2-3 paragraph overview describing their journey, emotional arc, and state of mind",
  "dominantMood": "The prevailing emotional current observed",
  "themes": ["Theme 1", "Theme 2", "Theme 3"],
  "highlights": ["Notable breakthrough or poignant reflection 1", "Notable reflection 2", "Notable reflection 3"],
  "growthInsight": "A gentle observation about how they have grown or adapted",
  "encouragement": "A mindful mantra or encouragement for the coming days"
}`;

      const response = await generateWithFallback(
        ai,
        ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'],
        {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.6,
          },
        }
      );

      const parsed = JSON.parse(response.text || '{}');
      res.json({ ...parsed, source: 'gemini' });
    } catch (err: any) {
      console.warn('Gemini Digest using resilient fallback:', err?.message || err);
      const userEntries = Array.isArray(req.body?.entries) ? req.body.entries : [];
      res.json({
        overview: "Your recent reflections highlight a steady cadence of personal introspection, resilience through daily fluctuations, and meaningful self-care.",
        themes: ["Mindful Awareness", "Daily Resilience", "Emotional Balance"],
        highlights: userEntries.slice(0, 3).map((e: any) => `Reflected on ${e.title || 'daily life'}`),
        growthInsight: "Notice how consistently showing up to write provides perspective even during turbulent days.",
        encouragement: "Continue giving voice to your thoughts—your self-awareness is your sanctuary.",
        source: 'fallback'
      });
    }
  });

  // AI Semantic / Concept Search
  app.post('/api/ai/concept-search', async (req, res) => {
    try {
      const { query, entries } = req.body;
      if (!query || !Array.isArray(entries) || entries.length === 0) {
        return res.json({ matchedIds: [] });
      }

      const ai = getAIClient();
      if (!ai) {
        // Simple fallback search
        const q = query.toLowerCase();
        const matches = entries
          .filter((e: any) => (e.title + ' ' + e.content + ' ' + (e.tags || []).join(' ')).toLowerCase().includes(q))
          .map((e: any) => e.id);
        return res.json({ matchedIds: matches, source: 'fallback' });
      }

      const minimalEntries = entries.slice(0, 40).map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        mood: e.mood,
        tags: e.tags,
        preview: (e.content || '').slice(0, 200),
      }));

      const prompt = `A user is searching their journal for the concept: "${query}".
Given this list of entries:
${JSON.stringify(minimalEntries)}

Identify which entries semantically relate to this concept, even if they do not contain the exact keyword.
Return ONLY valid JSON in this format:
{
  "matchedIds": ["id1", "id2"],
  "explanation": "Brief explanation of why these match the concept"
}`;

      const response = await generateWithFallback(
        ai,
        ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'],
        {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }
      );

      const parsed = JSON.parse(response.text || '{"matchedIds":[]}');
      res.json({ ...parsed, source: 'gemini' });
    } catch (err: any) {
      console.warn('Concept search fallback:', err?.message || err);
      const q = String(req.body?.query || '').toLowerCase();
      const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
      const matches = entries
        .filter((e: any) => (e.title + ' ' + e.content + ' ' + (e.tags || []).join(' ')).toLowerCase().includes(q))
        .map((e: any) => e.id);
      res.json({ matchedIds: matches, source: 'fallback' });
    }
  });

  // AI Voice Transcription (Robust Audio to Text)
  app.post('/api/ai/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: 'No audio data provided.' });
      }

      const ai = getAIClient();
      if (!ai) {
        return res.status(503).json({
          error: 'AI transcription service unavailable. Please check GEMINI_API_KEY.',
        });
      }

      const cleanMime = (mimeType || 'audio/webm').split(';')[0];

      // Use audio-optimized gemini-3.5-transcribe with fallbacks to flash models and transient retry
      const response = await generateWithFallback(
        ai,
        ['gemini-3.5-transcribe', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'],
        {
          contents: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: audioBase64,
              },
            },
            'You are a precise voice journal transcriber. Transcribe the spoken speech in this audio recording verbatim into natural, well-formatted English or the spoken language. Include appropriate punctuation (periods, commas, questions). Do not add any conversational commentary, explanations, timestamps, or quotes. Output ONLY the transcribed words.',
          ],
        }
      );

      const text = (response.text || '').trim();
      res.json({ text });
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      const msg = String(err?.message || '');
      const isDemandIssue =
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('ResourceExhausted') ||
        msg.includes('overloaded');

      const userFriendlyError = isDemandIssue
        ? 'The voice transcription service is temporarily experiencing high traffic spikes. Please try recording again in a moment.'
        : 'Failed to transcribe audio. Please try again.';

      res.status(isDemandIssue ? 503 : 500).json({
        error: userFriendlyError,
      });
    }
  });

  // Weather Lookup API (Google Maps Platform Weather API with Open-Meteo fallback)
  app.get('/api/weather/current', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
      }

      const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

      // 1. Try Google Maps Platform Weather API if key configured
      if (googleKey) {
        try {
          const gmpUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${googleKey}&location.latitude=${lat}&location.longitude=${lng}&solution_id=gmp_mcp_codeassist_v1_aistudio`;
          const gmpRes = await fetch(gmpUrl, {
            headers: {
              'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
            },
            signal: AbortSignal.timeout(4000),
          });

          if (gmpRes.ok) {
            const data: any = await gmpRes.json();
            const tempC = Math.round(data?.temperature?.degrees ?? data?.temperatureC ?? 20);
            const tempF = Math.round((tempC * 9) / 5 + 32);
            const condition = data?.weatherCondition?.description || data?.condition || 'Clear';
            
            let icon = 'sun';
            const condLower = condition.toLowerCase();
            if (condLower.includes('rain') || condLower.includes('drizzle')) icon = 'cloud-rain';
            else if (condLower.includes('snow') || condLower.includes('flurry')) icon = 'cloud-snow';
            else if (condLower.includes('thunder') || condLower.includes('lightning')) icon = 'cloud-lightning';
            else if (condLower.includes('cloud') || condLower.includes('overcast')) icon = 'cloud';
            else if (condLower.includes('wind')) icon = 'wind';

            return res.json({
              temperatureC: tempC,
              temperatureF: tempF,
              condition,
              icon,
              humidity: data?.relativeHumidity ?? 50,
              windSpeedKmh: Math.round(data?.windSpeed?.value ?? 10),
              source: 'google-weather',
            });
          }
        } catch (gmpErr) {
          console.warn('Google Weather API lookup skipped/failed, using fallback:', gmpErr);
        }
      }

      // 2. Resilient Open-Meteo fallback (Free, keyless, global meteorological data)
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius`;
      const omRes = await fetch(openMeteoUrl, { signal: AbortSignal.timeout(4000) });
      
      if (!omRes.ok) {
        throw new Error(`Open-Meteo returned status ${omRes.status}`);
      }

      const omData: any = await omRes.json();
      const current = omData.current || {};
      const tempC = Math.round(current.temperature_2m ?? 21);
      const tempF = Math.round((tempC * 9) / 5 + 32);
      const code = current.weather_code ?? 0;
      const humidity = current.relative_humidity_2m ?? 45;
      const windSpeed = Math.round(current.wind_speed_10m ?? 8);

      // Interpret WMO weather codes
      let condition = 'Clear';
      let icon = 'sun';

      if (code === 0) {
        condition = 'Clear Sky';
        icon = 'sun';
      } else if (code === 1 || code === 2) {
        condition = 'Partly Cloudy';
        icon = 'cloud-sun';
      } else if (code === 3) {
        condition = 'Overcast';
        icon = 'cloud';
      } else if (code === 45 || code === 48) {
        condition = 'Misty Fog';
        icon = 'cloud';
      } else if (code >= 51 && code <= 57) {
        condition = 'Gentle Drizzle';
        icon = 'cloud-rain';
      } else if (code >= 61 && code <= 67) {
        condition = 'Rain Shower';
        icon = 'cloud-rain';
      } else if (code >= 71 && code <= 77) {
        condition = 'Snowfall';
        icon = 'cloud-snow';
      } else if (code >= 80 && code <= 82) {
        condition = 'Passing Showers';
        icon = 'cloud-rain';
      } else if (code >= 85 && code <= 86) {
        condition = 'Snow Showers';
        icon = 'cloud-snow';
      } else if (code >= 95) {
        condition = 'Thunderstorm';
        icon = 'cloud-lightning';
      }

      return res.json({
        temperatureC: tempC,
        temperatureF: tempF,
        condition,
        icon,
        humidity,
        windSpeedKmh: windSpeed,
        source: 'open-meteo',
      });
    } catch (err: any) {
      console.error('Weather service error:', err);
      // Fallback sensible default
      res.json({
        temperatureC: 21,
        temperatureF: 70,
        condition: 'Serene Atmosphere',
        icon: 'cloud-sun',
        humidity: 50,
        windSpeedKmh: 10,
        source: 'local-default',
      });
    }
  });

  // Reverse Geocoding API
  app.get('/api/places/reverse-geocode', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
      }

      const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

      if (googleKey) {
        try {
          const gmpUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}`;
          const gmpRes = await fetch(gmpUrl, { signal: AbortSignal.timeout(4000) });
          if (gmpRes.ok) {
            const data: any = await gmpRes.json();
            if (data.results && data.results.length > 0) {
              const best = data.results[0];
              let locality = '';
              let country = '';
              for (const comp of best.address_components || []) {
                if (comp.types.includes('locality')) locality = comp.long_name;
                if (comp.types.includes('administrative_area_level_1') && !locality) locality = comp.long_name;
                if (comp.types.includes('country')) country = comp.long_name;
              }
              const placeName = locality ? (country ? `${locality}, ${country}` : locality) : best.formatted_address;
              return res.json({
                placeName,
                city: locality,
                country,
                latitude: lat,
                longitude: lng,
              });
            }
          }
        } catch (e) {
          console.warn('Google reverse geocode fallback:', e);
        }
      }

      // Free Nominatim reverse geocode fallback
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const nomRes = await fetch(nomUrl, {
        headers: {
          'User-Agent': 'JournalApp/1.0 (Reflective Vault)',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (nomRes.ok) {
        const nomData: any = await nomRes.json();
        const address = nomData.address || {};
        const city = address.city || address.town || address.village || address.suburb || address.county || '';
        const country = address.country || '';
        const placeName = city ? (country ? `${city}, ${country}` : city) : nomData.display_name?.split(',').slice(0, 2).join(',') || 'Reflective Sanctuary';
        return res.json({
          placeName,
          city,
          country,
          latitude: lat,
          longitude: lng,
        });
      }

      return res.json({
        placeName: `Sanctuary (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
        latitude: lat,
        longitude: lng,
      });
    } catch (err: any) {
      console.error('Reverse geocode error:', err);
      const lat = parseFloat(req.query.lat as string) || 0;
      const lng = parseFloat(req.query.lng as string) || 0;
      res.json({
        placeName: `Sanctuary (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
        latitude: lat,
        longitude: lng,
      });
    }
  });

  // Place Search & Autocomplete
  app.get('/api/places/search', async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }

      const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

      if (googleKey) {
        try {
          const gmpUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleKey}`;
          const gmpRes = await fetch(gmpUrl, { signal: AbortSignal.timeout(4000) });
          if (gmpRes.ok) {
            const data: any = await gmpRes.json();
            if (data.results && data.results.length > 0) {
              const mapped = data.results.slice(0, 5).map((r: any) => ({
                placeName: r.formatted_address,
                latitude: r.geometry?.location?.lat,
                longitude: r.geometry?.location?.lng,
              }));
              return res.json({ results: mapped });
            }
          }
        } catch (e) {
          console.warn('Google places search error, using fallback:', e);
        }
      }

      // Nominatim search fallback
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
      const nomRes = await fetch(nomUrl, {
        headers: {
          'User-Agent': 'JournalApp/1.0 (Reflective Vault)',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (nomRes.ok) {
        const list: any[] = await nomRes.json();
        const mapped = list.map((item) => ({
          placeName: item.display_name.split(',').slice(0, 3).join(','),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }));
        return res.json({ results: mapped });
      }

      return res.json({ results: [] });
    } catch (err: any) {
      console.error('Place search error:', err);
      res.json({ results: [] });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Journal Server running on port ${PORT}`);
  });
}

startServer();
