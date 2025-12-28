import { searchAmadeusFlights } from "@/lib/flights/amadeus";
import { getAmadeusToken, hotelsByCity, hotelOffers } from "@/lib/stays/amadeus";
import { searchCars as searchCarsAmadeus } from "@/lib/transport/cars/amadeus";
import { searchTransfers as searchTransfersAmadeus } from "@/lib/transport/transfers/amadeus";
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
    const token = await getAmadeusToken();
    const hotelIds = await hotelsByCity(params.city, token);
    const rawResults = await hotelOffers(hotelIds, token, params.adults, params.checkIn, params.nights, params.rooms || 1);
    const results: StayResult[] = rawResults.map(r => ({ type: 'stay' as const, city: r.cityCode, ...r }));
    const debug = { hotelsFoundCount: hotelIds.length, offersFoundCount: rawResults.length };
    cache.set(key, { results, timestamp: Date.now() });
    const duration = Date.now() - start;
    console.log(JSON.stringify({ event: 'search', category: 'stays', duration, provider: 'amadeus', count: results.length, status: 'success' }));
    return { results, meta: { debug }, errors: [] };
  } catch (e) {
    const duration = Date.now() - start;
    const error = e instanceof Error ? e.message : 'Unknown error';
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
    return { results, meta: {}, errors: [] };
  } catch (e) {
    const duration = Date.now() - start;
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.log(JSON.stringify({ event: 'search', category: 'transfers', duration, provider: 'amadeus', count: 0, status: 'error', error }));
    return { results: [], meta: {}, errors: [error] };
  }
}