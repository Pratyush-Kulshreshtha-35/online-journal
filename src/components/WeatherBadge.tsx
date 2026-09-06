import React from 'react';
import { WeatherStamp } from '../types/journal';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Moon,
  Droplets,
} from 'lucide-react';

interface WeatherBadgeProps {
  weather: WeatherStamp;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const WeatherBadge: React.FC<WeatherBadgeProps> = ({
  weather,
  showDetails = false,
  size = 'sm',
  className = '',
}) => {
  const renderWeatherIcon = () => {
    const iconClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

    switch (weather.icon) {
      case 'sun':
        return <Sun className={`${iconClass} text-amber-500 shrink-0`} />;
      case 'cloud-sun':
        return <CloudSun className={`${iconClass} text-amber-400 shrink-0`} />;
      case 'cloud':
        return <Cloud className={`${iconClass} text-stone-400 shrink-0`} />;
      case 'cloud-rain':
        return <CloudRain className={`${iconClass} text-sky-400 shrink-0`} />;
      case 'cloud-snow':
        return <CloudSnow className={`${iconClass} text-cyan-300 shrink-0`} />;
      case 'cloud-lightning':
        return <CloudLightning className={`${iconClass} text-yellow-400 shrink-0`} />;
      case 'wind':
        return <Wind className={`${iconClass} text-teal-400 shrink-0`} />;
      case 'moon':
        return <Moon className={`${iconClass} text-indigo-300 shrink-0`} />;
      default:
        return <CloudSun className={`${iconClass} text-amber-400 shrink-0`} />;
    }
  };

  const textSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-900/60 border border-stone-800/80 text-stone-300 font-mono-journal shadow-2xs ${textSizes[size]} ${className}`}
      title={`${weather.condition} • ${weather.temperatureF}°F (${weather.temperatureC}°C)${
        weather.humidity ? ` • Humidity ${weather.humidity}%` : ''
      }`}
    >
      {renderWeatherIcon()}
      <span className="font-semibold text-stone-200">
        {weather.temperatureF}°F
      </span>
      <span className="text-stone-500 font-sans hidden sm:inline">·</span>
      <span className="truncate max-w-[120px] sm:max-w-none text-stone-400">
        {weather.condition}
      </span>
      {showDetails && weather.humidity !== undefined && (
        <span className="hidden md:inline-flex items-center gap-0.5 text-stone-500 ml-1">
          <Droplets className="w-3 h-3 text-sky-500" />
          {weather.humidity}%
        </span>
      )}
    </div>
  );
};
