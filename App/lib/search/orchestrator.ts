import { getFlightProvider } from "@/lib/providers/flights";
import { getPrimaryHotelProvider } from "@/lib/config/providers";
import { getHotelProvider } from "@/lib/providers/hotels";
import { isProduction } from "@/lib/core/env";
import { searchCars as searchCarsAmadeus } from "@/lib/transport/cars/amadeus";
import { searchTransfers as searchTransfersAmadeus } from "@/lib/transport/transfers/amadeus";
import type { FlightResult, StayResult, CarResult, TransferResult } from "@/lib/core/types";
import type { StaySearchParams } from "@/lib/stays/provider";
import type { CarSearchParams } from "@/lib/transport/cars/amadeus";
import type { TransferSearchParams } from "@/lib/transport/transfers/amadeus";

const cache = new Map<string, { results: any[], timestamp: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

function flightCacheKey(params: Record<string, unknown>): string {
  const test = (params as { _testDuffel?: boolean })._testDuffel ? ":test" : "";
  return `flights:${params.from}:${params.to}:${params.departDate}:${params.returnDate ?? ""}:${params.adults}:${params.cabinClass ?? "economy"}${test}`;
}

export async function searchFlights(params: any): Promise<{ results: FlightResult[], meta: any, errors: string[] }> {
  const key = flightCacheKey(params);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return { results: cached.results, meta: { cached: true }, errors: [] };
  }

  const start = Date.now();
  const provider = getFlightProvider();
  try {
    const { results, meta, errors } = await provider.search({
      from: params.from,
      to: params.to,
      departDate: params.departDate,
      returnDate: params.returnDate,
      adults: params.adults ?? 1,
      children: params.children,
      infants: params.infants,
      cabinClass: params.cabinClass,
      currency: params.currency,
      tripType: params.tripType,
    });
    const duration = Date.now() - start;
    if (errors.length > 0) {
      console.log(JSON.stringify({ event: "search", category: "flights", duration, provider: provider.name, count: 0, status: "error", error: errors[0] }));
      return { results: [], meta: meta ?? {}, errors };
    }
    cache.set(key, { results, timestamp: Date.now() });
    console.log(JSON.stringify({ event: "search", category: "flights", duration, provider: provider.name, count: results.length, status: "success" }));
    return { results, meta: meta ?? {}, errors: [] };
  } catch (e) {
    const duration = Date.now() - start;
    const error = e instanceof Error ? e.message : "Unknown error";
    console.log(JSON.stringify({ event: "search", category: "flights", duration, provider: provider.name, count: 0, status: "error", error }));
    return { results: [], meta: {}, errors: [error] };
  }
}

function staysCacheKey(p: StaySearchParams): string {
  return `stays:${p.city}:${p.checkIn}:${p.nights}:${p.adults}:${p.rooms ?? 1}`;
}

export async function searchStays(params: StaySearchParams): Promise<{ results: StayResult[], meta: any, errors: string[] }> {
  const key = staysCacheKey(params);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return { results: cached.results, meta: { cached: true }, errors: [] };
  }

  const start = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(params.checkIn);
  checkIn.setHours(0, 0, 0, 0);

  if (isNaN(checkIn.getTime())) {
    const error = "Invalid check-in date format";
    console.log(JSON.stringify({ event: "search", category: "stays", duration: Date.now() - start, count: 0, status: "error", error }));
    return { results: [], meta: {}, errors: [error] };
  }
  if (checkIn < today) {
    const error = "Check-in date cannot be in the past";
    console.log(JSON.stringify({ event: "search", category: "stays", duration: Date.now() - start, count: 0, status: "error", error }));
    return { results: [], meta: {}, errors: [error] };
  }
  const maxDays = 359;
  const daysDiff = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > maxDays) {
    const error = `Check-in date cannot be more than ${maxDays} days in advance`;
    console.log(JSON.stringify({ event: "search", category: "stays", duration: Date.now() - start, count: 0, status: "error", error }));
    return { results: [], meta: {}, errors: [error] };
  }

  const provider = getHotelProvider();
  try {
    const { results: rawResults, debug } = await provider.search(params);
    const results: StayResult[] = rawResults.map((r) => ({
      type: "stay" as const,
      city: r.city,
      name: r.name,
      checkIn: params.checkIn,
      nights: params.nights,
      roomType: r.roomType || params.roomType || "double",
      classType: r.classType || params.classType || "standard",
      total: r.total,
      currency: r.currency || params.currency || "AUD",
      provider: r.provider,
      id: r.id,
      raw: r.raw,
    }));
    cache.set(key, { results, timestamp: Date.now() });
    const duration = Date.now() - start;
    console.log(JSON.stringify({ event: "search", category: "stays", duration, provider: getPrimaryHotelProvider(), count: results.length, status: "success" }));
    return { results, meta: { debug }, errors: [] };
  } catch (e) {
    const duration = Date.now() - start;
    const error = e instanceof Error ? e.message : "Unknown error";
    console.log(JSON.stringify({ event: "search", category: "stays", duration, count: 0, status: "error", error }));
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

    if (isProduction()) {
      return { results: [], meta: {}, errors: [error] };
    }

    const hasEnv = process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET;
    if (!hasEnv || error.includes('401') || error.includes('403') || error.includes('not available')) {
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