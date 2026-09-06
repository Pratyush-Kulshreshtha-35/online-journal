import React, { useState, useMemo } from 'react';
import { JournalEntry, MoodType } from '../types/journal';
import { MOODS } from '../data/prompts';
import { WeatherBadge } from './WeatherBadge';
import {
  MapPin,
  Navigation,
  Compass,
  Calendar,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';

interface MemoryMapViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onEditEntry?: (entry: JournalEntry) => void;
  onWriteNewEntry?: () => void;
}

interface SanctuaryPlace {
  name: string;
  count: number;
  lat: number;
  lng: number;
}

export const MemoryMapView: React.FC<MemoryMapViewProps> = ({
  entries,
  onSelectEntry,
  onEditEntry,
  onWriteNewEntry,
}) => {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodType | 'all'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [mapMode, setMapMode] = useState<'cartography' | 'satellite'>('cartography');

  const apiKey =
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof window !== 'undefined' && (window as any).__GOOGLE_MAPS_API_KEY__) ||
    '';

  // Filter entries that have valid location coordinates
  const entriesWithLocation = useMemo(() => {
    return entries.filter(
      (e) =>
        e.location &&
        typeof e.location.latitude === 'number' &&
        typeof e.location.longitude === 'number' &&
        !isNaN(e.location.latitude) &&
        !isNaN(e.location.longitude)
    );
  }, [entries]);

  // Apply search and mood filter
  const filteredEntries = useMemo(() => {
    return entriesWithLocation.filter((e) => {
      if (selectedMood !== 'all' && e.mood !== selectedMood) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchPlace = e.location?.placeName?.toLowerCase().includes(q);
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchCity = e.location?.city?.toLowerCase().includes(q);
        if (!matchPlace && !matchTitle && !matchCity) return false;
      }
      return true;
    });
  }, [entriesWithLocation, selectedMood, searchFilter]);

  // Calculate center of mapped entries
  const defaultCenter = useMemo(() => {
    if (filteredEntries.length > 0) {
      const avgLat =
        filteredEntries.reduce((acc, e) => acc + e.location!.latitude, 0) /
        filteredEntries.length;
      const avgLng =
        filteredEntries.reduce((acc, e) => acc + e.location!.longitude, 0) /
        filteredEntries.length;
      return { lat: avgLat, lng: avgLng };
    }
    return { lat: 37.7749, lng: -122.4194 }; // Default San Francisco
  }, [filteredEntries]);

  // Unique places list
  const uniquePlaces = useMemo(() => {
    const placesMap = new globalThis.Map<string, SanctuaryPlace>();
    entriesWithLocation.forEach((e) => {
      const name = e.location?.placeName || 'Unknown Location';
      const curr = placesMap.get(name);
      if (curr) {
        curr.count += 1;
      } else {
        placesMap.set(name, {
          name,
          count: 1,
          lat: e.location!.latitude,
          lng: e.location!.longitude,
        });
      }
    });
    return Array.from(placesMap.values()).sort((a, b) => b.count - a.count);
  }, [entriesWithLocation]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-journal text-2xl font-bold text-white tracking-tight">
                Sanctuary & Journey Map
              </h2>
              <p className="text-xs text-stone-400 font-mono-journal">
                Explore the physical geography of your reflections and memories
              </p>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-stone-300 font-mono-journal">
              <strong className="text-amber-400 font-bold">{entriesWithLocation.length}</strong>{' '}
              {entriesWithLocation.length === 1 ? 'Memory Plotted' : 'Memories Plotted'}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-stone-300 font-mono-journal">
              <strong className="text-emerald-400 font-bold">{uniquePlaces.length}</strong>{' '}
              Sanctuaries
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#121212] p-3 rounded-2xl border border-[#222222]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search places or titles..."
            className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedMood('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                selectedMood === 'all'
                  ? 'bg-amber-600 text-black font-bold'
                  : 'bg-[#181818] text-stone-400 hover:text-stone-200'
              }`}
            >
              All Moods
            </button>
            {Object.values(MOODS).map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMood(m.id)}
                title={m.label}
                className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 ${
                  selectedMood === m.id
                    ? `${m.bgColor} ${m.textColor} ${m.borderColor} border font-bold shadow-xs`
                    : 'bg-[#181818] text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>{m.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Display & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Main Map Canvas (3 Cols) */}
        <div className="lg:col-span-3 bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-2xl relative min-h-[500px] h-[580px]">
          {apiKey ? (
            /* Google Maps Platform (@vis.gl/react-google-maps) */
            <APIProvider apiKey={apiKey}>
              <GoogleMap
                mapId="DEMO_MAP_ID"
                defaultCenter={defaultCenter}
                defaultZoom={filteredEntries.length === 1 ? 12 : 4}
                gestureHandling="greedy"
                disableDefaultUI={false}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {filteredEntries.map((entry) => (
                  <AdvancedMarker
                    key={entry.id}
                    position={{
                      lat: entry.location!.latitude,
                      lng: entry.location!.longitude,
                    }}
                    onClick={() => setSelectedEntry(entry)}
                    title={entry.title}
                  >
                    <Pin
                      background="#D97706"
                      borderColor="#78350F"
                      glyphColor="#FEF3C7"
                      scale={selectedEntry?.id === entry.id ? 1.3 : 1.0}
                    />
                  </AdvancedMarker>
                ))}

                {selectedEntry && selectedEntry.location && (
                  <InfoWindow
                    position={{
                      lat: selectedEntry.location.latitude,
                      lng: selectedEntry.location.longitude,
                    }}
                    onCloseClick={() => setSelectedEntry(null)}
                    maxWidth={300}
                  >
                    <div className="p-1 text-stone-900 font-sans space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase text-amber-700 font-bold">
                          {selectedEntry.date}
                        </span>
                        {selectedEntry.weather && (
                          <span className="text-[11px] font-mono text-stone-600">
                            {selectedEntry.weather.temperatureF}°F · {selectedEntry.weather.condition}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-stone-900 line-clamp-1">
                        {selectedEntry.title || 'Untitled Reflection'}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2">
                        {selectedEntry.content.replace(/[#*`_]/g, '')}
                      </p>
                      <button
                        onClick={() => onSelectEntry(selectedEntry)}
                        className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition"
                      >
                        Open Journal Entry
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </APIProvider>
          ) : (
            /* Interactive Visual Sanctuary Cartography Map */
            <div className="w-full h-full relative flex flex-col justify-between p-4 bg-radial from-[#151515] to-[#0A0A0A] overflow-hidden select-none">
              {/* Grid Lines & Stylized Continents Canvas Background */}
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="map-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#D97706" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#map-grid)" />
                  <circle cx="50%" cy="50%" r="220" fill="none" stroke="#D97706" strokeWidth="1" strokeDasharray="4 8" />
                  <circle cx="50%" cy="50%" r="380" fill="none" stroke="#D97706" strokeWidth="0.5" strokeDasharray="2 6" />
                </svg>
              </div>

              {/* Top Controls & Status Overlay */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#111111]/90 backdrop-blur-md border border-[#222222]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-mono-journal text-stone-300">
                    Interactive Sanctuary Coordinate Grid
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono-journal">
                  Projected Lat/Lng Coordinates
                </div>
              </div>

              {/* Pins Field */}
              <div className="relative flex-1 w-full my-4 flex items-center justify-center">
                {filteredEntries.length === 0 ? (
                  <div className="text-center p-8 max-w-md space-y-3 z-10 bg-[#141414]/90 rounded-2xl border border-[#2A2A2A] shadow-xl">
                    <MapPin className="w-10 h-10 text-amber-500/50 mx-auto" />
                    <h3 className="font-serif-journal font-bold text-white text-lg">
                      No Geotagged Reflections Yet
                    </h3>
                    <p className="text-xs text-stone-400 leading-relaxed font-serif-journal">
                      When you write or edit an entry, tap the <strong>"Stamp Weather & Location"</strong> button in the editor to pin your sanctuaries and favorite writing spots to this map.
                    </p>
                    {onWriteNewEntry && (
                      <button
                        onClick={onWriteNewEntry}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded-xl transition"
                      >
                        Create Your First Tagged Entry
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    {/* Render visual pins projected onto relative coordinate space */}
                    {filteredEntries.map((entry, index) => {
                      const lat = entry.location!.latitude;
                      const lng = entry.location!.longitude;
                      // Mercator-like normalized percentage
                      const xPercent = Math.max(10, Math.min(90, ((lng + 180) / 360) * 100));
                      const yPercent = Math.max(10, Math.min(90, ((90 - lat) / 180) * 100));
                      const isSelected = selectedEntry?.id === entry.id;

                      const moodCfg = MOODS[entry.mood];

                      return (
                        <div
                          key={entry.id}
                          onClick={() => setSelectedEntry(entry)}
                          style={{
                            left: `${xPercent}%`,
                            top: `${yPercent}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className="absolute group cursor-pointer z-20 transition-all duration-300"
                        >
                          {/* Pulsing Aura */}
                          <div
                            className={`absolute -inset-2 rounded-full opacity-60 animate-ping pointer-events-none ${
                              isSelected ? 'bg-amber-500' : 'bg-amber-500/30'
                            }`}
                          />

                          {/* Marker Pin */}
                          <div
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full shadow-2xl border transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-black border-amber-300 scale-125 z-30 font-bold'
                                : 'bg-[#181818] text-stone-200 border-amber-500/60 hover:scale-110 hover:border-amber-400'
                            }`}
                          >
                            <span className="text-xs">{moodCfg?.emoji || '📍'}</span>
                            <span className="text-[11px] font-mono-journal font-semibold truncate max-w-[90px]">
                              {entry.location?.placeName?.split(',')[0] || 'Sanctuary'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Google Maps Key Notice */}
              <div className="relative z-10 p-2.5 rounded-xl bg-[#141414]/95 border border-[#2A2A2A] text-stone-400 text-[11px] font-mono-journal flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Google Maps Platform Ready: Configure <code className="text-amber-300">VITE_GOOGLE_MAPS_API_KEY</code> to enable live satellite & street tiles.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Selected Memory or Sanctuaries List (1 Col) */}
        <div className="lg:col-span-1 space-y-4">
          {selectedEntry ? (
            /* Selected Entry Highlight Card */
            <div className="bg-[#111111] border border-amber-600/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-fade-in relative">
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-3 right-3 text-stone-500 hover:text-stone-300 text-xs"
              >
                ✕
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-amber-500 text-xs font-mono-journal font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{selectedEntry.location?.placeName}</span>
                </div>
                <h3 className="font-serif-journal font-bold text-white text-lg line-clamp-2">
                  {selectedEntry.title || 'Untitled Reflection'}
                </h3>
              </div>

              {selectedEntry.weather && (
                <div className="pt-1">
                  <WeatherBadge weather={selectedEntry.weather} showDetails={true} size="md" />
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-stone-400 font-mono-journal">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  {selectedEntry.date}
                </span>
                <span>•</span>
                <span>{selectedEntry.wordCount} words</span>
              </div>

              <p className="text-xs text-stone-300 font-serif-journal leading-relaxed line-clamp-4 italic border-l-2 border-amber-700/50 pl-3">
                "{selectedEntry.content.replace(/[#*`_]/g, '')}"
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => onSelectEntry(selectedEntry)}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(217,119,6,0.3)]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Entry</span>
                </button>

                {onEditEntry && (
                  <button
                    onClick={() => onEditEntry(selectedEntry)}
                    className="w-full py-1.5 px-3 bg-[#181818] hover:bg-[#222222] text-stone-300 text-xs rounded-xl border border-[#2A2A2A] transition"
                  >
                    Edit Location & Entry
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Top Sanctuaries Summary */
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <h3 className="font-serif-journal font-bold text-white text-base">
                  Top Sanctuaries
                </h3>
                <span className="text-[11px] font-mono-journal text-amber-500">
                  {uniquePlaces.length} spots
                </span>
              </div>

              {uniquePlaces.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-4 text-center">
                  No places recorded yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {uniquePlaces.map((place, idx) => {
                    const placeEntries = entriesWithLocation.filter(
                      (e) => e.location?.placeName === place.name
                    );

                    return (
                      <div
                        key={place.name + idx}
                        onClick={() => {
                          if (placeEntries.length > 0) {
                            setSelectedEntry(placeEntries[0]);
                          }
                        }}
                        className="p-3 rounded-xl bg-[#161616] hover:bg-[#1F1F1F] border border-[#262626] transition cursor-pointer group space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif-journal font-bold text-stone-200 text-xs group-hover:text-amber-400 transition truncate">
                            {place.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-400 border border-amber-800/40 text-[10px] font-mono-journal font-bold shrink-0">
                            {place.count} {place.count === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono-journal">
                          {place.lat.toFixed(2)}°, {place.lng.toFixed(2)}°
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
