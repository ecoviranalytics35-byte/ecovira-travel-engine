import { searchDuffelFlights } from "@/lib/flights/duffel";
import { mockStaysProvider } from "@/lib/stays/provider";
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
    const { results: rawResults, debug } = await searchDuffelFlights(params);
    const results: FlightResult[] = rawResults.map((r: any) => ({ type: 'flight' as const, ...r }));
    cache.set(key, { results, timestamp: Date.now() });
    const duration = Date.now() - start;
    console.log(JSON.stringify({ event: 'search', category: 'flights', duration, provider: 'duffel', count: results.length, status: 'success' }));
    return { results, meta: { debug }, errors: [] };
  } catch (e) {
    const duration = Date.now() - start;
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.log(JSON.stringify({ event: 'search', category: 'flights', duration, provider: 'duffel', count: 0, status: 'error', error }));

    // Fallback to mock results
    const mockResults: FlightResult[] = [
      {
        type: 'flight',
        id: 'mock-1',
        from: params.from || 'MEL',
        to: params.to || 'SYD',
        departDate: params.departDate || '2025-01-15',
        price: '299',
        currency: 'USD',
        provider: 'Mock Airlines',
        raw: {}
      },
      {
        type: 'flight',
        id: 'mock-2',
        from: params.from || 'MEL',
        to: params.to || 'SYD',
        departDate: params.departDate || '2025-01-15',
        price: '349',
        currency: 'USD',
        provider: 'Mock Airlines Premium',
        raw: {}
      }
    ];
    cache.set(key, { results: mockResults, timestamp: Date.now() });
    return { results: mockResults, meta: { mock: true }, errors: [] };
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
    let results: StayResult[];
    let debug: any;
    if (process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET && params.city && params.checkIn) {
      const token = await getAmadeusToken();
      const hotelIds = await hotelsByCity(params.city, token); // Assuming city is cityCode, but for simplicity
      const rawResults = await hotelOffers(hotelIds, token, params.adults, params.checkIn, params.nights, params.rooms || 1);
      results = rawResults.map(r => ({ type: 'stay' as const, city: r.cityCode, ...r })); // Map cityCode to city
      debug = { hotelsFoundCount: hotelIds.length, offersFoundCount: rawResults.length };
    } else {
      const { results: rawResults, debug: d } = await mockStaysProvider.search(params);
      results = rawResults.map((r: any) => ({ type: 'stay' as const, ...r }));
      debug = d;
    }
    cache.set(key, { results, timestamp: Date.now() });
    const duration = Date.now() - start;
    const provider = process.env.AMADEUS_API_KEY ? 'amadeus' : 'mock';
    console.log(JSON.stringify({ event: 'search', category: 'stays', duration, provider, count: results.length, status: 'success' }));
    return { results, meta: { debug }, errors: [] };
  } catch (e) {
    const duration = Date.now() - start;
    const error = e instanceof Error ? e.message : 'Unknown error';
    const provider = process.env.AMADEUS_API_KEY ? 'amadeus' : 'mock';
    console.log(JSON.stringify({ event: 'search', category: 'stays', duration, provider, count: 0, status: 'error', error }));
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