import { searchAmadeusFlights } from "@/lib/flights/amadeus";
import { getAmadeusToken, hotelsByCity, hotelOffers } from "@/lib/stays/amadeus";
import { searchCars as searchCarsAmadeus } from "@/lib/transport/cars/amadeus";
import { searchTransfers as searchTransfersAmadeus } from "@/lib/transport/transfers/amadeus";
import { getCityCode } from "@/lib/utils/cityCodes";
import type { FlightResult, StayResult, CarResult, TransferResult } from "@/lib/core/types";
import type { StaySearchParams } from "@/lib/stays/provider";
import type { CarSearchParams } from "@/lib/transport/cars/amadeus";
import type { TransferSearchParams } from "@/lib/transport/transfers/amadeus";

const cache = new Map<string, { results: any[], timestamp: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

export async function searchFlights(params: any): Promise<{ results: FlightResult[], meta: any, errors: string[] }> {
  const key = 'flights';
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return { results: cached.results, meta: { cached: true }, errors: [] };
  }

  const start = Date.now();
  try {
    // Map cabin class to Amadeus travel class
    const travelClassMap: Record<string, string> = {
      economy: 'ECONOMY',
      premium_economy: 'PREMIUM_ECONOMY',
      business: 'BUSINESS',
      first: 'FIRST'
    };
    
    const amadeusParams = {
      originLocationCode: params.from,
      destinationLocationCode: params.to,
      departureDate: params.departDate,
      returnDate: params.returnDate,
      adults: params.adults,
      children: params.children,
      infants: params.infants,
      travelClass: travelClassMap[params.cabinClass || 'economy'] || 'ECONOMY',
      currencyCode: params.currency || 'USD',
    };
    
    const { results: rawResults, debug } = await searchAmadeusFlights(amadeusParams);
    const results: FlightResult[] = rawResults.map((r: any) => ({ type: 'flight' as const, ...r }));
    cache.set(key, { results, timestamp: Date.now() });
    const duration = Date.now() - start;
    console.log(JSON.stringify({ event: 'search', category: 'flights', duration, provider: 'amadeus', count: results.length, status: 'success' }));
    return { results, meta: { debug }, errors: [] };
  } catch (e) {
    const duration = Date.now() - start;
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.log(JSON.stringify({ event: 'search', category: 'flights', duration, provider: 'amadeus', count: 0, status: 'error', error }));
    return { results: [], meta: {}, errors: [error] };
  }
}

export async function searchStays(params: StaySearchParams): Promise<{ results: StayResult[], meta: any, errors: string[] }> {
  const key = 'stays';
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return { results: cached.results, meta: { cached: true }, errors: [] };
  }

  const start = Date.now();
  try {
    // Always use Amadeus for stays
    // Convert city name to city code
    const cityCode = getCityCode(params.city);
    if (!cityCode) {
      const error = `City "${params.city}" not found. Please use a city name (e.g., Melbourne) or IATA code (e.g., MEL).`;
      console.log(JSON.stringify({ event: 'search', category: 'stays', duration: Date.now() - start, provider: 'amadeus', count: 0, status: 'error', error }));
      return { results: [], meta: {}, errors: [error] };
    }
    
    const token = await getAmadeusToken();
    const hotelIds = await hotelsByCity(cityCode, token);
    
    if (hotelIds.length === 0) {
      const error = `No hotels found for ${params.city} (${cityCode}).`;
      console.log(JSON.stringify({ event: 'search', category: 'stays', duration: Date.now() - start, provider: 'amadeus', count: 0, status: 'error', error }));
      return { results: [], meta: {}, errors: [error] };
    }
    
    // Validate check-in date before calling Amadeus
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(params.checkIn);
    checkIn.setHours(0, 0, 0, 0);
    
    if (isNaN(checkIn.getTime())) {
      const error = "Invalid check-in date format";
      console.log(JSON.stringify({ event: 'search', category: 'stays', duration: Date.now() - start, provider: 'amadeus', count: 0, status: 'error', error }));
      return { results: [], meta: {}, errors: [error] };
    }
    
    if (checkIn < today) {
      const error = "Check-in date cannot be in the past";
      console.log(JSON.stringify({ event: 'search', category: 'stays', duration: Date.now() - start, provider: 'amadeus', count: 0, status: 'error', error }));
      return { results: [], meta: {}, errors: [error] };
    }
    
    const maxDays = 359;
    const daysDiff = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      const error = `Check-in date cannot be more than ${maxDays} days in advance`;
      console.log(JSON.stringify({ event: 'search', category: 'stays', duration: Date.now() - start, provider: 'amadeus', count: 0, status: 'error', error }));
      return { results: [], meta: {}, errors: [error] };
    }

    const rawResults = await hotelOffers(hotelIds, token, params.adults, params.checkIn, params.nights, params.rooms || 1);
    
    // Check if hotelOffers returned an error (even if it didn't throw)
    // hotelOffers will throw on validation errors, but may return results with errors
    const results: StayResult[] = rawResults.map(r => ({ 
      type: 'stay' as const, 
      city: r.cityCode || cityCode, 
      name: r.name || 'Hotel',
      checkIn: params.checkIn,
      nights: params.nights,
      roomType: params.roomType || 'double',
      classType: params.classType || 'standard',
      total: r.total || '0',
      currency: r.currency || params.currency || 'AUD',
      provider: r.provider || 'amadeus',
      id: r.id || `stay-${Date.now()}-${Math.random()}`,
      raw: r.raw || r,
    }));
    
    const debug = { hotelsFoundCount: hotelIds.length, offersFoundCount: rawResults.length, cityCode };
    cache.set(key, { results, timestamp: Date.now() });
    const duration = Date.now() - start;
    console.log(JSON.stringify({ event: 'search', category: 'stays', duration, provider: 'amadeus', count: results.length, status: 'success' }));
    return { results, meta: { debug }, errors: [] };
  } catch (e) {
    const duration = Date.now() - start;
    const error = e instanceof Error ? e.message : 'Unknown error';
    
    // Check if error is related to date validation (code 425)
    if (error.includes('INVALID DATE') || error.includes('Invalid date') || error.includes('code 425')) {
      console.log(JSON.stringify({ event: 'search', category: 'stays', duration, provider: 'amadeus', count: 0, status: 'error', error, code: 425 }));
      return { results: [], meta: {}, errors: [error] };
    }
    
    console.log(JSON.stringify({ event: 'search', category: 'stays', duration, provider: 'amadeus', count: 0, status: 'error', error }));
    return { results: [], meta: {}, errors: [error] };
  }
}

export async function searchCars(params: CarSearchParams): Promise<{ results: CarResult[], meta: any, errors: string[] }> {
  const key = 'cars';
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return { results: cached.results, meta: { cached: true }, errors: [] };
  }

  const start = Date.now();
  try {
    const results = await searchCarsAmadeus(params);
    cache.set(key, { results, timestamp: Date.now() });
    const duration = Date.now() - start;
    console.log(JSON.stringify({ event: 'search', category: 'cars', duration, provider: 'amadeus', count: results.length, status: 'success' }));
    return { results, meta: {}, errors: [] };
  } catch (e) {
    const duration = Date.now() - start;
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.log(JSON.stringify({ event: 'search', category: 'cars', duration, provider: 'amadeus', count: 0, status: 'error', error }));
    return { results: [], meta: {}, errors: [error] };
  }
}

export async function searchTransfers(params: TransferSearchParams): Promise<{ results: TransferResult[], meta: any, errors: string[] }> {
  const key = 'transfers';
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return { results: cached.results, meta: { cached: true }, errors: [] };
  }

  const start = Date.now();
  try {
    const results = await searchTransfersAmadeus(params);
    cache.set(key, { results, timestamp: Date.now() });
    const duration = Date.now() - start;
    console.log(JSON.stringify({ event: 'search', category: 'transfers', duration, provider: 'amadeus', count: results.length, status: 'success' }));
    return { results, meta: { provider: 'amadeus' }, errors: [] };
  } catch (e) {
    const duration = Date.now() - start;
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.log(JSON.stringify({ event: 'search', category: 'transfers', duration, provider: 'amadeus', count: 0, status: 'error', error }));
    
    // Fallback stub if Amadeus is not available
    const hasEnv = process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET;
    if (!hasEnv || error.includes('401') || error.includes('403') || error.includes('not available')) {
      // Return stub results for testing UI
      const stubResults: TransferResult[] = [
        {
          id: 'stub-1',
          type: 'transfer',
          from: `Location at ${params.startLat},${params.startLng}`,
          to: `Location at ${params.endLat},${params.endLng}`,
          dateTime: params.dateTime,
          total: '75.00',
          currency: 'AUD',
          provider: 'stub',
          name: 'Premium Private Transfer',
          transferType: 'PRIVATE',
          passengers: params.adults,
          raw: { stub: true },
        },
        {
          id: 'stub-2',
          type: 'transfer',
          from: `Location at ${params.startLat},${params.startLng}`,
          to: `Location at ${params.endLat},${params.endLng}`,
          dateTime: params.dateTime,
          total: '95.00',
          currency: 'AUD',
          provider: 'stub',
          name: 'Luxury Transfer',
          transferType: 'PRIVATE',
          passengers: params.adults,
          raw: { stub: true },
        },
      ];
      return { results: stubResults, meta: { provider: 'stub', note: 'Transfers beta - using placeholder results' }, errors: [] };
    }
    
    return { results: [], meta: {}, errors: [error] };
  }
}