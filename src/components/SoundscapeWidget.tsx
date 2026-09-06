import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Headphones,
  CloudSun,
  Loader2,
} from 'lucide-react';
import {
  soundscapeService,
  SOUNDSCAPES,
  SoundscapeType,
} from '../services/soundscapeService';
import { getUserCurrentPosition, fetchCurrentWeather } from '../services/weatherService';

export const SoundscapeWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<SoundscapeType>('rain');
  const [volume, setVolume] = useState(0.35);
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncingWeather, setIsSyncingWeather] = useState(false);
  const [weatherSyncInfo, setWeatherSyncInfo] = useState<string | null>(null);

  useEffect(() => {
    soundscapeService.setVolume(volume);
  }, [volume]);

  const handleTogglePlay = (soundToPlay?: SoundscapeType) => {
    const target = soundToPlay || currentSound;
    if (isPlaying && (!soundToPlay || soundToPlay === currentSound)) {
      soundscapeService.stop();
      setIsPlaying(false);
    } else {
      soundscapeService.play(target);
      setCurrentSound(target);
      setIsPlaying(true);
    }
  };

  const handleSelectSound = (id: SoundscapeType) => {
    setCurrentSound(id);
    if (isPlaying) {
      soundscapeService.play(id);
    } else {
      handleTogglePlay(id);
    }
  };

  const handleSyncWithWeather = async () => {
    setIsSyncingWeather(true);
    try {
      const coords = await getUserCurrentPosition();
      const weather = await fetchCurrentWeather(coords.latitude, coords.longitude);
      
      const cond = weather.condition.toLowerCase();
      let chosenSound: SoundscapeType = 'rain';

      if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower') || cond.includes('storm')) {
        chosenSound = 'rain';
      } else if (cond.includes('night') || cond.includes('clear') && (new Date().getHours() >= 19 || new Date().getHours() <= 5)) {
        chosenSound = 'night';
      } else if (cond.includes('snow') || weather.temperatureF <= 42) {
        chosenSound = 'campfire';
      } else if (cond.includes('sun') || weather.temperatureF >= 72) {
        chosenSound = 'waves';
      } else {
        chosenSound = 'brown-noise';
      }

      const matchName = SOUNDSCAPES.find((s) => s.id === chosenSound)?.name;
      setWeatherSyncInfo(`${weather.condition} (${weather.temperatureF}°F) → ${matchName}`);
      setCurrentSound(chosenSound);
      soundscapeService.play(chosenSound);
      setIsPlaying(true);
    } catch (err: any) {
      console.warn('Weather sync error:', err);
      setWeatherSyncInfo('Defaulted to Gentle Rain');
      setCurrentSound('rain');
      soundscapeService.play('rain');
      setIsPlaying(true);
    } finally {
      setIsSyncingWeather(false);
    }
  };

  return (
    <div className="relative">
      <button
        id="btn-ambient-soundscape"
        onClick={() => setIsOpen(!isOpen)}
        title="Ambient Focus Soundscapes"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
          isPlaying
            ? 'bg-amber-950/50 border-amber-700/60 text-amber-300 shadow-[0_0_12px_rgba(217,119,6,0.3)]'
            : 'bg-[#161616] border-[#2A2A2A] text-stone-400 hover:text-stone-200'
        }`}
      >
        <Headphones className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-400 animate-pulse' : ''}`} />
        <span className="hidden sm:inline">
          {isPlaying ? SOUNDSCAPES.find((s) => s.id === currentSound)?.emoji : 'Ambiance'}
        </span>
        {isOpen ? <ChevronUp className="w-3 h-3 text-stone-500" /> : <ChevronDown className="w-3 h-3 text-stone-500" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-[#121212] border border-[#2A2A2A] rounded-2xl shadow-2xl p-4 z-50 text-xs text-stone-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-serif-journal font-bold text-white text-sm">Focus Soundscapes</span>
              </div>
              <button
                onClick={() => handleTogglePlay()}
                className={`p-1.5 rounded-lg font-medium transition ${
                  isPlaying
                    ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/60'
                    : 'bg-amber-600 text-black hover:bg-amber-500 font-bold'
                }`}
                title={isPlaying ? 'Pause soundscape' : 'Play soundscape'}
              >
                {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
            </div>

            {/* Sync with Weather Button */}
            <div className="pt-2 pb-1">
              <button
                type="button"
                onClick={handleSyncWithWeather}
                disabled={isSyncingWeather}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 text-amber-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {isSyncingWeather ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Detecting Ambient Weather...</span>
                  </>
                ) : (
                  <>
                    <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sync With Ambient Weather</span>
                  </>
                )}
              </button>
              {weatherSyncInfo && (
                <p className="text-[10px] text-stone-400 text-center font-mono-journal mt-1">
                  {weatherSyncInfo}
                </p>
              )}
            </div>

            {/* Sound options */}
            <div className="grid grid-cols-1 gap-1.5 my-2">
              {SOUNDSCAPES.map((s) => {
                const active = currentSound === s.id && isPlaying;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSound(s.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left transition border ${
                      active
                        ? 'bg-[#222222] border-amber-600/50 text-amber-300'
                        : 'bg-[#181818] hover:bg-[#1E1E1E] border-transparent text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{s.emoji}</span>
                      <div>
                        <p className="font-medium leading-tight">{s.name}</p>
                        <p className="text-[10px] text-stone-500">{s.desc}</p>
                      </div>
                    </div>
                    {active && <span className="text-[10px] font-mono-journal text-amber-400">Playing</span>}
                  </button>
                );
              })}
            </div>

            {/* Volume slider */}
            <div className="pt-2 border-t border-[#222222] flex items-center gap-2.5">
              <button
                onClick={() => setVolume(volume === 0 ? 0.35 : 0)}
                className="text-stone-400 hover:text-white"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-[#222222] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-mono-journal text-[10px] text-stone-500 w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
