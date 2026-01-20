export interface WeatherData {
  temp: number;
  condition: string;
  wind: number;
  humidity: number;
}

// Mappa codici WMO (World Meteorological Organization) a testo leggibile
const getWeatherCondition = (code: number): string => {
  if (code === 0) return "Clear Sky";
  if (code >= 1 && code <= 3) return "Partly Cloudy";
  if (code >= 45 && code <= 48) return "Fog";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    // API Open-Meteo (Gratuita, nessuna key richiesta)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather API Error");
    
    const data = await response.json();
    const current = data.current;

    return {
      temp: current.temperature_2m,
      condition: getWeatherCondition(current.weather_code),
      wind: current.wind_speed_10m,
      humidity: current.relative_humidity_2m
    };
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    // Fallback in caso di errore (offline)
    return { temp: 0, condition: "N/A", wind: 0, humidity: 0 };
  }
};