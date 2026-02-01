export interface WeatherData {
  temp: number;
  condition: string;
  wind: number;
  humidity: number;
}

// Mappa codici WMO (World Meteorological Organization) a testo leggibile
const getWeatherCondition = (code: number): string => {
  const codes: Record<number, string> = {
    0: "Clear Sky",
    1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing Rime Fog",
    51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
    95: "Thunderstorm", 96: "Thunderstorm with Hail"
  };
  return codes[code] || "Unknown";
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