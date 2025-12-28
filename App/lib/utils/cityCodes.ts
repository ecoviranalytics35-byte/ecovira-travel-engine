// City name to IATA city code mapping for Amadeus API
const CITY_CODE_MAP: Record<string, string> = {
  'melbourne': 'MEL',
  'sydney': 'SYD',
  'brisbane': 'BNE',
  'perth': 'PER',
  'adelaide': 'ADL',
  'london': 'LON',
  'paris': 'PAR',
  'new york': 'NYC',
  'los angeles': 'LAX',
  'tokyo': 'TYO',
  'dubai': 'DXB',
  'singapore': 'SIN',
  'bangkok': 'BKK',
  'hong kong': 'HKG',
  'sydney': 'SYD',
  'auckland': 'AKL',
  'vancouver': 'YVR',
  'toronto': 'YYZ',
  'mumbai': 'BOM',
  'delhi': 'DEL',
  'istanbul': 'IST',
  'rome': 'ROM',
  'madrid': 'MAD',
  'amsterdam': 'AMS',
  'frankfurt': 'FRA',
  'munich': 'MUC',
  'zurich': 'ZRH',
  'vienna': 'VIE',
  'stockholm': 'STO',
  'copenhagen': 'CPH',
  'oslo': 'OSL',
  'helsinki': 'HEL',
  'dublin': 'DUB',
  'edinburgh': 'EDI',
  'glasgow': 'GLA',
  'manchester': 'MAN',
  'birmingham': 'BHX',
  'bristol': 'BRS',
  'newcastle': 'NCL',
  'liverpool': 'LPL',
  'leeds': 'LBA',
  'cardiff': 'CWL',
  'belfast': 'BFS',
};

export function getCityCode(cityName: string): string | null {
  const normalized = cityName.toLowerCase().trim();
  
  // Check exact match
  if (CITY_CODE_MAP[normalized]) {
    return CITY_CODE_MAP[normalized];
  }
  
  // Check if it contains a known city
  for (const [key, code] of Object.entries(CITY_CODE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return code;
    }
  }
  
  // If it's already a 3-letter code, return as-is
  if (normalized.length === 3 && /^[A-Z]{3}$/i.test(normalized)) {
    return normalized.toUpperCase();
  }
  
  return null;
}

