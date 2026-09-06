import { WeatherStamp, LocationTag } from '../types/journal';

export interface WeatherLookupResult {
  weather: WeatherStamp;
  location?: LocationTag;
}

/**
 * Retrieves the current geographical coordinates of the user via browser Geolocation API
 */
export async function getUserCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        reject(err);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  });
}

/**
 * Fetches real-time weather conditions for a specific latitude and longitude
 */
export async function fetchCurrentWeather(lat: number, lng: number): Promise<WeatherStamp> {
  try {
    const res = await fetch(`/api/weather/current?lat=${lat}&lng=${lng}`);
    if (!res.ok) {
      throw new Error(`Weather API returned ${res.status}`);
    }
    const data = await res.json();
    return {
      temperatureC: data.temperatureC ?? 20,
      temperatureF: data.temperatureF ?? 68,
      condition: data.condition || 'Clear Sky',
      icon: data.icon || 'sun',
      humidity: data.humidity,
      windSpeedKmh: data.windSpeedKmh,
      locationName: data.locationName,
    };
  } catch (err) {
    console.warn('Weather fetch error, using gentle fallback:', err);
    return {
      temperatureC: 21,
      temperatureF: 70,
      condition: 'Clear',
      icon: 'sun',
      humidity: 50,
      windSpeedKmh: 10,
    };
  }
}

/**
 * Resolves a human-friendly place name for a set of coordinates
 */
export async function reverseGeocodeLocation(lat: number, lng: number): Promise<LocationTag> {
  try {
    const res = await fetch(`/api/places/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) {
      throw new Error(`Reverse geocode returned ${res.status}`);
    }
    const data = await res.json();
    return {
      placeName: data.placeName || 'Current Location',
      latitude: lat,
      longitude: lng,
      city: data.city,
      country: data.country,
    };
  } catch (err) {
    console.warn('Reverse geocode error:', err);
    return {
      placeName: `Sanctuary (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
      latitude: lat,
      longitude: lng,
    };
  }
}

/**
 * Searches for places matching an address or place query string
 */
export async function searchPlaces(query: string): Promise<LocationTag[]> {
  try {
    const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('Places search failed:', err);
    return [];
  }
}
