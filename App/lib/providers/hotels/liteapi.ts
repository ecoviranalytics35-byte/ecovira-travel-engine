/**
 * LiteAPI hotel provider (sandbox/production via LITEAPI_API_KEY).
 * Implements: hotel search, room availability, rate details.
 * Rate expiration: we do not cache or return expired rates.
 */

import type { StaySearchParams, NormalizedStay, StaysProvider } from "@/lib/stays/provider";

const LITEAPI_BASE = "https://api.liteapi.travel/v3.0";

function getApiKey(): string {
  const key = process.env.LITEAPI_API_KEY;
  if (!key) {
    throw new Error("LITEAPI_API_KEY is not set. Set it for hotel search (sandbox or production).");
  }
  return key;
}

function liteApiFetch<T>(path: string, init: { method: string; body?: object; headers?: Record<string, string> }): Promise<T> {
  const apiKey = getApiKey();
  const url = `${LITEAPI_BASE}${path}`;
  const headers: Record<string, string> = {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init.headers ?? {}),
  };
  const fetchInit: RequestInit = {
    method: init.method,
    headers,
  };
  if (init.body) {
    fetchInit.body = JSON.stringify(init.body);
  }
  return fetch(url, fetchInit).then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LiteAPI ${res.status}: ${text.slice(0, 300)}`);
    }
    return res.json() as Promise<T>;
  });
}

/** Returns true if the rate is still valid (not expired). */
function isRateValid(expiresAt?: string | null): boolean {
  if (!expiresAt) return true;
  try {
    const exp = new Date(expiresAt).getTime();
    const now = Date.now();
    return exp > now;
  } catch {
    return false;
  }
}

/** City name to country code fallback for common cities (LiteAPI needs countryCode). */
const CITY_TO_COUNTRY: Record<string, string> = {
  Melbourne: "AU",
  Sydney: "AU",
  Brisbane: "AU",
  Perth: "AU",
  Adelaide: "AU",
  Rome: "IT",
  Milan: "IT",
  London: "GB",
  Paris: "FR",
  "New York": "US",
  "Los Angeles": "US",
  Dubai: "AE",
  Singapore: "SG",
  Tokyo: "JP",
};

function inferCountryCode(city: string): string {
  const normalized = city.trim();
  for (const [c, cc] of Object.entries(CITY_TO_COUNTRY)) {
    if (c.toLowerCase() === normalized.toLowerCase()) return cc;
  }
  return "AU";
}

// --- Rates response types (minimal)
interface LiteApiRatesRequest {
  checkin: string;
  checkout: string;
  currency: string;
  guestNationality: string;
  occupancies: Array<{ rooms: number; adults: number; children?: number[] }>;
  city?: string;
  countryCode?: string;
  hotelIds?: string[];
}

interface LiteApiRoomOffer {
  offerId?: string;
  expiresAt?: string;
  price?: { total?: number; currency?: string };
  roomName?: string;
}

interface LiteApiHotel {
  hotelId: string;
  name?: string;
  city?: string;
}

interface LiteApiRatesResponse {
  data?: Array<{
    hotel?: LiteApiHotel;
    roomTypes?: Array<{
      offers?: LiteApiRoomOffer[];
      name?: string;
    }>;
  }>;
}

// --- Hotel search (POST /hotels/rates by city)
async function searchRates(params: StaySearchParams): Promise<LiteApiRatesResponse> {
  const checkIn = params.checkIn;
  const checkOut = new Date(Date.parse(checkIn));
  checkOut.setDate(checkOut.getDate() + (params.nights || 1));
  const checkoutStr = checkOut.toISOString().split("T")[0];
  const countryCode = inferCountryCode(params.city);

  const body: LiteApiRatesRequest = {
    checkin: checkIn,
    checkout: checkoutStr,
    currency: params.currency || "AUD",
    guestNationality: "AU",
    occupancies: [{ rooms: params.rooms || 1, adults: params.adults || 1, ...(params.children ? { children: [10] } : {}) }],
    city: params.city,
    countryCode,
  };
  return liteApiFetch<LiteApiRatesResponse>("/hotels/rates", { method: "POST", body });
}

// --- Normalize and filter expired
function normalizeResults(
  data: LiteApiRatesResponse,
  params: StaySearchParams
): NormalizedStay[] {
  const results: NormalizedStay[] = [];
  const seen = new Set<string>();
  const now = Date.now();

  for (const item of data.data ?? []) {
    const hotel = item.hotel;
    const hotelId = hotel?.hotelId ?? "";
    const hotelName = hotel?.name ?? "Hotel";
    const city = hotel?.city ?? params.city;

    for (const roomType of item.roomTypes ?? []) {
      for (const offer of roomType.offers ?? []) {
        const offerId = offer.offerId;
        if (!offerId || seen.has(offerId)) continue;
        const expiresAt = offer.expiresAt;
        if (expiresAt && new Date(expiresAt).getTime() <= now) continue; // do not return expired rates
        seen.add(offerId);
        const total = typeof offer.price?.total === "number" ? offer.price.total : parseFloat(String(offer.price?.total ?? 0)) || 0;
        results.push({
          id: offerId,
          city,
          name: hotelName,
          checkIn: params.checkIn,
          nights: params.nights,
          roomType: params.roomType || "double",
          classType: params.classType || "standard",
          total,
          currency: offer.price?.currency || params.currency || "AUD",
          provider: "liteapi",
          raw: { offerId, expiresAt, roomName: roomType.name, offer },
        });
      }
    }
  }
  return results;
}

// --- Room availability: same as search but optionally by hotelIds
export async function roomAvailability(params: {
  hotelIds: string[];
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms?: number;
  currency?: string;
}): Promise<LiteApiRatesResponse> {
  const body: LiteApiRatesRequest = {
    checkin: params.checkIn,
    checkout: params.checkOut,
    currency: params.currency || "AUD",
    guestNationality: "AU",
    occupancies: [{ rooms: params.rooms || 1, adults: params.adults }],
    hotelIds: params.hotelIds,
  };
  return liteApiFetch<LiteApiRatesResponse>("/hotels/rates", { method: "POST", body });
}

// --- Rate details (prebook) to get current price and validity
interface PrebookRequest {
  offerId: string;
  usePaymentSdk?: boolean;
}

interface PrebookResponse {
  data?: {
    prebookId?: string;
    offerId?: string;
    expiresAt?: string;
    price?: { total?: number; currency?: string };
  };
}

export async function rateDetails(offerId: string): Promise<PrebookResponse> {
  const body: PrebookRequest = { offerId, usePaymentSdk: false };
  return liteApiFetch<PrebookResponse>("/rates/prebook", { method: "POST", body });
}

// --- StaysProvider implementation
export class LiteApiStaysProvider implements StaysProvider {
  async search(params: StaySearchParams): Promise<{ results: NormalizedStay[]; debug: any }> {
    try {
      const data = await searchRates(params);
      const results = normalizeResults(data, params);
      return {
        results,
        debug: { provider: "liteapi", count: results.length, city: params.city },
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[LiteApiStaysProvider] search error:", message);
      return { results: [], debug: { provider: "liteapi", error: message } };
    }
  }

  async quote(stayId: string, params: StaySearchParams): Promise<{ quote: any; debug: any }> {
    try {
      const prebook = await rateDetails(stayId);
      const d = prebook.data;
      const expiresAt = d?.expiresAt;
      if (expiresAt && !isRateValid(expiresAt)) {
        return {
          quote: null,
          debug: { provider: "liteapi", error: "Rate expired", offerId: stayId },
        };
      }
      return {
        quote: {
          id: stayId,
          offerId: stayId,
          prebookId: d?.prebookId,
          total: d?.price?.total ?? 0,
          currency: d?.price?.currency ?? params.currency ?? "AUD",
          validUntil: expiresAt ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
        debug: { provider: "liteapi", offerId: stayId },
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[LiteApiStaysProvider] quote error:", message);
      return {
        quote: null,
        debug: { provider: "liteapi", error: message, stayId },
      };
    }
  }

  async book(
    offerId: string,
    _paymentIntentId: string,
    guestInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      specialRequests?: string;
    }
  ): Promise<{ booking: any; debug: any }> {
    // Booking with LiteAPI requires prebookId from quote first; then POST /rates/book.
    // For staging/sandbox we return a placeholder until full book flow is wired.
    try {
      const prebook = await rateDetails(offerId);
      const prebookId = prebook.data?.prebookId;
      if (!prebookId) {
        throw new Error("Prebook required before book. Call quote first to get prebookId.");
      }
      // Optional: call POST /rates/book with prebookId and guestInfo when ready.
      const booking = {
        id: `liteapi-${Date.now()}`,
        offerId,
        prebookId,
        status: "pending",
        confirmationNumber: null,
        guestInfo,
        provider: "liteapi",
      };
      return { booking, debug: { provider: "liteapi", offerId, prebookId } };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[LiteApiStaysProvider] book error:", message);
      throw new Error(`Hotel booking failed: ${message}`);
    }
  }
}

export const liteApiStaysProvider = new LiteApiStaysProvider();

/** Minimal health check for LiteAPI (sandbox test request). */
export async function liteApiHealthCheck(): Promise<{
  ok: boolean;
  message?: string;
  statusCode?: number;
}> {
  if (!process.env.LITEAPI_API_KEY) {
    return { ok: false, message: "LITEAPI_API_KEY not set" };
  }
  try {
    // Lightweight request: search rates with minimal params (sandbox accepts this)
    const res = await fetch(`${LITEAPI_BASE}/hotels/rates`, {
      method: "POST",
      headers: {
        "X-API-Key": process.env.LITEAPI_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        checkin: new Date().toISOString().split("T")[0],
        checkout: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        currency: "AUD",
        guestNationality: "AU",
        occupancies: [{ rooms: 1, adults: 1 }],
        city: "Sydney",
        countryCode: "AU",
      }),
    });
    const statusCode = res.status;
    if (res.ok) {
      return { ok: true, statusCode };
    }
    const text = await res.text();
    return { ok: false, message: text.slice(0, 200), statusCode };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
}
