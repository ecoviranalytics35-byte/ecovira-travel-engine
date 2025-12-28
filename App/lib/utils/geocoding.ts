// Simple geocoding helper for common cities and airports
// In production, this would use a proper geocoding service

const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Major cities
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'brisbane': { lat: -27.4698, lng: 153.0251 },
  'perth': { lat: -31.9505, lng: 115.8605 },
  'adelaide': { lat: -34.9285, lng: 138.6007 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  
  // Airports (IATA codes)
  'mel': { lat: -37.6733, lng: 144.8433 }, // Melbourne Airport
  'syd': { lat: -33.9399, lng: 151.1753 }, // Sydney Airport
  'bne': { lat: -27.3842, lng: 153.1171 }, // Brisbane Airport
  'per': { lat: -31.9403, lng: 115.9669 }, // Perth Airport
  'adl': { lat: -34.9455, lng: 138.5306 }, // Adelaide Airport
  'lhr': { lat: 51.4700, lng: -0.4543 }, // London Heathrow
  'cdg': { lat: 49.0097, lng: 2.5479 }, // Paris Charles de Gaulle
  'jfk': { lat: 40.6413, lng: -73.7781 }, // New York JFK
  'lax': { lat: 33.9425, lng: -118.4081 }, // Los Angeles
  'nrt': { lat: 35.7720, lng: 140.3929 }, // Tokyo Narita
  'dxb': { lat: 25.2532, lng: 55.3657 }, // Dubai
  'sin': { lat: 1.3644, lng: 103.9915 }, // Singapore Changi
  'bkk': { lat: 13.6811, lng: 100.7475 }, // Bangkok Suvarnabhumi
};

export function getCoordinates(location: string): { lat: number; lng: number } | null {
  const normalized = location.toLowerCase().trim();
  
  // Check exact match
  if (LOCATION_COORDINATES[normalized]) {
    return LOCATION_COORDINATES[normalized];
  }
  
  // Check if it contains a known city/airport
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  
  // Default to Melbourne if not found (for testing)
  return { lat: -37.8136, lng: 144.9631 };
}

