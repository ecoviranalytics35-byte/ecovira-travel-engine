// Airline Check-in Link Resolver
// Maps airline IATA codes and names to official check-in URLs

export interface AirlineCheckinInfo {
  url: string;
  name: string;
  hasDirectCheckIn: boolean; // Whether airline has dedicated check-in page vs manage booking
}

// Airline IATA code to check-in URL mapping
const AIRLINE_CHECKIN_MAP: Record<string, AirlineCheckinInfo> = {
  // Australian Airlines
  'QF': { 
    url: 'https://www.qantas.com/au/en/manage-booking/check-in.html',
    name: 'Qantas',
    hasDirectCheckIn: true
  },
  'VA': { 
    url: 'https://www.virginaustralia.com/au/en/bookings/manage/check-in/',
    name: 'Virgin Australia',
    hasDirectCheckIn: true
  },
  'JQ': { 
    url: 'https://www.jetstar.com/au/en/manage-booking',
    name: 'Jetstar',
    hasDirectCheckIn: false
  },
  'TT': { 
    url: 'https://www.tigerair.com/au/en/manage-booking',
    name: 'Tigerair',
    hasDirectCheckIn: false
  },
  
  // Asian Airlines
  'SQ': { 
    url: 'https://www.singaporeair.com/en_au/us/travel-info/check-in/',
    name: 'Singapore Airlines',
    hasDirectCheckIn: true
  },
  'CX': { 
    url: 'https://www.cathaypacific.com/cx/en_AU/manage-booking/check-in.html',
    name: 'Cathay Pacific',
    hasDirectCheckIn: true
  },
  'TG': { 
    url: 'https://www.thaiairways.com/en/manage_booking/check_in.page',
    name: 'Thai Airways',
    hasDirectCheckIn: true
  },
  'MH': { 
    url: 'https://www.malaysiaairlines.com/us/en/manage-booking/check-in.html',
    name: 'Malaysia Airlines',
    hasDirectCheckIn: true
  },
  'JL': { 
    url: 'https://www.jal.co.jp/en/inter/checkin/',
    name: 'Japan Airlines',
    hasDirectCheckIn: true
  },
  'NH': { 
    url: 'https://www.ana.co.jp/en/us/check-in/',
    name: 'All Nippon Airways',
    hasDirectCheckIn: true
  },
  'KE': { 
    url: 'https://www.koreanair.com/us/en/booking/check-in',
    name: 'Korean Air',
    hasDirectCheckIn: true
  },
  
  // Middle Eastern Airlines
  'EK': { 
    url: 'https://www.emirates.com/au/english/manage-booking/check-in/',
    name: 'Emirates',
    hasDirectCheckIn: true
  },
  'EY': { 
    url: 'https://www.etihad.com/en-us/manage/check-in',
    name: 'Etihad Airways',
    hasDirectCheckIn: true
  },
  'QR': { 
    url: 'https://www.qatarairways.com/en-us/manage-booking.html',
    name: 'Qatar Airways',
    hasDirectCheckIn: false
  },
  
  // European Airlines
  'BA': { 
    url: 'https://www.britishairways.com/travel/home/public/en_gb/',
    name: 'British Airways',
    hasDirectCheckIn: false
  },
  'LH': { 
    url: 'https://www.lufthansa.com/xx/en/online-check-in',
    name: 'Lufthansa',
    hasDirectCheckIn: true
  },
  'AF': { 
    url: 'https://www.airfrance.com/us/en/home/page',
    name: 'Air France',
    hasDirectCheckIn: false
  },
  'KL': { 
    url: 'https://www.klm.com/home/us/en',
    name: 'KLM',
    hasDirectCheckIn: false
  },
  
  // North American Airlines
  'AA': { 
    url: 'https://www.aa.com/reservation/checkInAccess',
    name: 'American Airlines',
    hasDirectCheckIn: true
  },
  'UA': { 
    url: 'https://www.united.com/en/us/checkin',
    name: 'United Airlines',
    hasDirectCheckIn: true
  },
  'DL': { 
    url: 'https://www.delta.com/us/en/check-in/online',
    name: 'Delta',
    hasDirectCheckIn: true
  },
  'AS': { 
    url: 'https://www.alaskaair.com/content/check-in',
    name: 'Alaska Airlines',
    hasDirectCheckIn: true
  },
  
  // New Zealand
  'NZ': { 
    url: 'https://www.airnewzealand.com.au/manage-your-booking',
    name: 'Air New Zealand',
    hasDirectCheckIn: false
  },
};

// Airline name variations (for fuzzy matching)
const AIRLINE_NAME_VARIANTS: Record<string, string> = {
  'qantas': 'QF',
  'virgin australia': 'VA',
  'virgin': 'VA',
  'jetstar': 'JQ',
  'tigerair': 'TT',
  'tiger': 'TT',
  'singapore airlines': 'SQ',
  'singapore': 'SQ',
  'cathay pacific': 'CX',
  'cathay': 'CX',
  'thai airways': 'TG',
  'malaysia airlines': 'MH',
  'japan airlines': 'JL',
  'jal': 'JL',
  'all nippon airways': 'NH',
  'ana': 'NH',
  'korean air': 'KE',
  'emirates': 'EK',
  'etihad': 'EY',
  'qatar airways': 'QR',
  'qatar': 'QR',
  'british airways': 'BA',
  'lufthansa': 'LH',
  'air france': 'AF',
  'klm': 'KL',
  'american airlines': 'AA',
  'american': 'AA',
  'united airlines': 'UA',
  'united': 'UA',
  'delta': 'DL',
  'alaska airlines': 'AS',
  'air new zealand': 'NZ',
};

/**
 * Resolve airline check-in URL from IATA code or airline name
 * @param airlineIdentifier - IATA code (e.g., 'QF') or airline name (e.g., 'Qantas')
 * @returns AirlineCheckinInfo or null if not found
 */
export function resolveAirlineCheckinUrl(airlineIdentifier: string): AirlineCheckinInfo | null {
  if (!airlineIdentifier) return null;
  
  const upper = airlineIdentifier.toUpperCase().trim();
  const lower = airlineIdentifier.toLowerCase().trim();
  
  // Try IATA code first
  if (AIRLINE_CHECKIN_MAP[upper]) {
    return AIRLINE_CHECKIN_MAP[upper];
  }
  
  // Try name variants
  const iataFromName = AIRLINE_NAME_VARIANTS[lower];
  if (iataFromName && AIRLINE_CHECKIN_MAP[iataFromName]) {
    return AIRLINE_CHECKIN_MAP[iataFromName];
  }
  
  // Try partial match on airline names
  for (const [iata, info] of Object.entries(AIRLINE_CHECKIN_MAP)) {
    if (info.name.toLowerCase().includes(lower) || lower.includes(info.name.toLowerCase())) {
      return info;
    }
  }
  
  return null;
}

/**
 * Get airline name from IATA code
 */
export function getAirlineName(iata: string): string {
  const info = AIRLINE_CHECKIN_MAP[iata.toUpperCase()];
  return info?.name || `${iata} Airlines`;
}

/**
 * Check if airline has direct check-in page (vs manage booking)
 */
export function hasDirectCheckIn(iata: string): boolean {
  const info = AIRLINE_CHECKIN_MAP[iata.toUpperCase()];
  return info?.hasDirectCheckIn ?? false;
}

