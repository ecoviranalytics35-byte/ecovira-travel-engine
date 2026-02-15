/**
 * LiteAPI hotel provider (sandbox/production via LITEAPI_API_KEY).
 * Server-side only: use LITEAPI_API_KEY (not NEXT_PUBLIC_).
 * Endpoint: POST /hotels/rates = inventory search by city (returns rates), not a rates-by-hotelIds-only endpoint.
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

function sanitizeKeyForLog(key: string): string {
  if (!key) return "length=0";
  const len = key.length;
  const prefix = key.slice(0, 6);
  return `length=${len}, first6=${prefix}`;
}

/** Log outbound request (sanitized). Returns { data, statusCode, rawCount } from response. */
async function liteApiFetchWithLog<T>(
  path: string,
  init: { method: string; body?: object; headers?: Record<string, string> },
  logContext: { city?: string; checkIn?: string; checkOut?: string; adults?: number }
): Promise<{ data: T; statusCode: number; rawCount: number }> {
  const apiKey = getApiKey();
  const url = `${LITEAPI_BASE}${path}`;
  const body = init.body;
  const headers: Record<string, string> = {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init.headers ?? {}),
  };
  const headersForLog = {
    "Content-Type": headers["Content-Type"],
    Accept: headers["Accept"],
    "X-API-Key": sanitizeKeyForLog(apiKey),
  };
  console.log(JSON.stringify({
    event: "liteapi_request",
    provider: "liteapi",
    endpoint: url,
    method: init.method,
    bodyParams: body ? { ...body, cityName: (body as any).cityName, countryCode: (body as any).countryCode, checkin: (body as any).checkin, checkout: (body as any).checkout, occupancies: (body as any).occupancies, currency: (body as any).currency } : undefined,
    headersPresent: Object.keys(headersForLog),
    apiKeySanitized: headersForLog["X-API-Key"],
    ...logContext,
  }));

  const fetchInit: RequestInit = {
    method: init.method,
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
  };
  if (body) fetchInit.body = JSON.stringify(body);

  const res = await fetch(url, fetchInit);
  const statusCode = res.status;
  const rawText = await res.text();

  let parsed: any;
  try {
    parsed = rawText ? JSON.parse(rawText) : {};
  } catch {
    parsed = {};
  }
  const topLevelKeys = Object.keys(parsed);
  const rawDataArray = Array.isArray(parsed?.data) ? parsed.data : Array.isArray(parsed?.hotels) ? parsed.hotels : Array.isArray(parsed?.result) ? parsed.result : (parsed?.result && Array.isArray(parsed.result?.data)) ? parsed.result.data : (parsed?.result && Array.isArray(parsed.result?.items)) ? parsed.result.items : [];
  const rawCount = rawDataArray.length;

  const responseDump = JSON.stringify(parsed).slice(0, 2000);
  console.log(JSON.stringify({
    event: "liteapi_response_structure",
    provider: "liteapi",
    statusCode,
    responseTopLevelKeys: topLevelKeys,
    rawCount,
    hasData: Array.isArray(parsed?.data),
    dataLength: Array.isArray(parsed?.data) ? parsed.data.length : 0,
    hasHotels: Array.isArray(parsed?.hotels),
    hasResult: !!parsed?.result,
    responseDumpSanitized: responseDump,
    ...logContext,
  }));

  if (!res.ok) {
    throw new Error(`LiteAPI ${statusCode}: ${rawText.slice(0, 300)}`);
  }

  if (parsed && (parsed.error || (typeof parsed.message === "string" && parsed.message.length > 0 && parsed.data === undefined))) {
    const msg = parsed.message || parsed.error || String(parsed.error);
    throw new Error(`LiteAPI 200 error: ${msg}`);
  }

  const bodyParams = body ? { cityName: (body as any).cityName, countryCode: (body as any).countryCode, checkin: (body as any).checkin, checkout: (body as any).checkout, occupancies: (body as any).occupancies, currency: (body as any).currency } : undefined;
  return { data: parsed as T, statusCode, rawCount, endpoint: url, bodyParams, responseKeys: topLevelKeys };
}

function liteApiFetch<T>(path: string, init: { method: string; body?: object; headers?: Record<string, string> }): Promise<T> {
  const apiKey = getApiKey();
  const url = `${LITEAPI_BASE}${path}`;
  const fetchInit: RequestInit = {
    method: init.method,
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
  };
  if (init.body) fetchInit.body = JSON.stringify(init.body);
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
  cityName?: string;
  countryCode?: string;
  hotelIds?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
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

const CBD_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Sydney: { lat: -33.8688, lng: 151.2093 },
  Melbourne: { lat: -37.8136, lng: 144.9631 },
};

function getCheckOutStr(params: StaySearchParams): string {
  const checkOut = new Date(params.checkIn + "T12:00:00");
  checkOut.setDate(checkOut.getDate() + (params.nights || 1));
  return checkOut.toISOString().split("T")[0];
}

function buildRatesOccupancies(params: StaySearchParams): LiteApiRatesRequest["occupancies"] {
  return [{ rooms: params.rooms || 1, adults: params.adults || 1, ...(params.children ? { children: [10] } : {}) }];
}

// --- Step 1: GET /data/hotels to obtain hotel IDs by city (for 2-step fallback)
async function getHotelIdsByCity(cityName: string, countryCode: string): Promise<string[]> {
  const apiKey = getApiKey();
  const url = `${LITEAPI_BASE}/data/hotels?countryCode=${encodeURIComponent(countryCode)}&cityName=${encodeURIComponent(cityName)}&limit=50`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-API-Key": apiKey, Accept: "application/json" },
  });
  const raw = await res.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    return [];
  }
  if (!res.ok) {
    console.warn(JSON.stringify({ event: "liteapi_data_hotels", statusCode: res.status, error: data?.message || raw.slice(0, 200) }));
    return [];
  }
  const hotelIds: string[] = [];
  const rawIds = data.hotelIds ?? data.HotelIds ?? data.hotel_ids;
  if (typeof rawIds === "string") {
    rawIds.split(",").forEach((id: string) => {
      const t = id.trim();
      if (t) hotelIds.push(t);
    });
  }
  if (Array.isArray(data.data)) {
    data.data.forEach((h: any) => {
      const id = h?.hotelId ?? h?.id ?? h?.hotel_id;
      if (id) hotelIds.push(String(id));
    });
  }
  if (Array.isArray(data.hotels)) {
    data.hotels.forEach((h: any) => {
      const id = h?.hotelId ?? h?.id ?? h?.hotel_id;
      if (id) hotelIds.push(String(id));
    });
  }
  console.log(JSON.stringify({ event: "liteapi_data_hotels", cityName, countryCode, hotelIdsCount: hotelIds.length }));
  return hotelIds;
}

// --- Hotel search (POST /hotels/rates) — supports cityName, geo, or hotelIds
async function searchRates(
  params: StaySearchParams,
  overrides?: { cityName?: string; countryCode?: string; hotelIds?: string[]; latitude?: number; longitude?: number; radius?: number }
): Promise<{ data: LiteApiRatesResponse; statusCode: number; rawCount: number }> {
  const checkIn = params.checkIn;
  const checkoutStr = getCheckOutStr(params);
  const countryCode = overrides?.countryCode != null ? overrides.countryCode : inferCountryCode(params.city);
  const cityName =
    (overrides && typeof overrides.cityName === "string" && overrides.cityName.trim())
    || (typeof params.city === "string" && params.city.trim())
    || "Melbourne";
  const body: LiteApiRatesRequest = {
    checkin: checkIn,
    checkout: checkoutStr,
    currency: params.currency || "AUD",
    guestNationality: "AU",
    occupancies: buildRatesOccupancies(params),
    cityName,
    countryCode,
    hotelIds: overrides?.hotelIds,
    latitude: overrides?.latitude,
    longitude: overrides?.longitude,
    radius: overrides?.radius != null ? overrides.radius : 5000,
  };
  if (overrides?.hotelIds?.length) {
    body.cityName = undefined;
    body.countryCode = undefined;
    body.latitude = undefined;
    body.longitude = undefined;
    body.radius = undefined;
  } else if (overrides?.latitude != null && overrides?.longitude != null) {
    body.cityName = undefined;
    body.countryCode = undefined;
  }
  if (body.latitude == null && body.longitude == null) {
    body.radius = undefined;
  }
  const logContext = { city: params.city, checkIn, checkOut: checkoutStr, adults: params.adults };
  return liteApiFetchWithLog<LiteApiRatesResponse>("/hotels/rates", { method: "POST", body }, logContext);
}

/** Extract hotel/rate items array from LiteAPI response (multiple possible shapes). */
function extractDataArray(raw: any): any[] {
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.hotels)) return raw.hotels;
  if (Array.isArray(raw?.result)) return raw.result;
  if (raw?.result && Array.isArray(raw.result?.data)) return raw.result.data;
  if (raw?.result && Array.isArray(raw.result?.items)) return raw.result.items;
  if (Array.isArray(raw)) return raw;
  return [];
}

// --- Normalize and filter expired
function normalizeResults(
  raw: any,
  params: StaySearchParams
): NormalizedStay[] {
  const results: NormalizedStay[] = [];
  const seen = new Set<string>();
  const now = Date.now();

  const items = extractDataArray(raw);
  for (const item of items) {
    const hotel = (item as any).hotel ?? item;
    const hotelId = hotel?.hotelId ?? hotel?.hotel_id ?? "";
    const hotelName = hotel?.name ?? "Hotel";
    const city = hotel?.city ?? params.city;
    const roomTypesList = (item as any).roomTypes ?? (item as any).room_types ?? [];

    for (const roomType of roomTypesList) {
      const offersList = roomType.offers ?? roomType.rates ?? [];
      for (const offer of offersList) {
        const offerId = offer.offerId ?? offer.offer_id ?? offer.rateId ?? offer.rate_id;
        if (!offerId || seen.has(offerId)) continue;
        const expiresAt = offer.expiresAt ?? offer.expires_at;
        if (expiresAt && new Date(expiresAt).getTime() <= now) continue;
        seen.add(offerId);
        const priceObj = offer.price ?? offer;
        const total = typeof priceObj?.total === "number" ? priceObj.total : parseFloat(String(priceObj?.total ?? 0)) || 0;
        results.push({
          id: String(offerId),
          city,
          name: hotelName,
          checkIn: params.checkIn,
          nights: params.nights,
          roomType: params.roomType || "double",
          classType: params.classType || "standard",
          total,
          currency: priceObj?.currency || params.currency || "AUD",
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

// --- StaysProvider implementation with fallback chain: geo (if lat/lng) -> cityName -> CBD geo -> 2-step (data/hotels + rates)
export class LiteApiStaysProvider implements StaysProvider {
  async search(params: StaySearchParams): Promise<{ results: NormalizedStay[]; debug: any }> {
    const checkOutStr = getCheckOutStr(params);
    const countryCode = params.countryCode ?? inferCountryCode(params.city);
    const cityName = params.city?.trim() || "Melbourne";
    const hasGeo = params.latitude != null && params.longitude != null;

    const run = async (
      mode: "cityName" | "geo" | "hotelIds",
      overrides?: { cityName?: string; countryCode?: string; hotelIds?: string[]; latitude?: number; longitude?: number; radius?: number }
    ): Promise<{ data: any; statusCode: number; rawCount: number }> => {
      return searchRates(params, overrides);
    };

    let lastData: any = null;
    let lastStatusCode = 0;
    let lastRawCount = 0;
    let lastEndpoint: string | undefined;
    let lastBodyParams: object | undefined;
    let lastResponseKeys: string[] | undefined;
    let results: NormalizedStay[] = [];

    const setLast = (res: { data: any; statusCode: number; rawCount: number; endpoint?: string; bodyParams?: object; responseKeys?: string[] }) => {
      lastData = res.data;
      lastStatusCode = res.statusCode;
      lastRawCount = res.rawCount;
      lastEndpoint = res.endpoint;
      lastBodyParams = res.bodyParams;
      lastResponseKeys = res.responseKeys;
    };

    try {
      // If user selected a place with lat/lng, try geo first
      if (hasGeo) {
        const resGeo = await run("geo", {
          latitude: params.latitude!,
          longitude: params.longitude!,
          radius: 5000,
          cityName: undefined,
          countryCode,
        });
        setLast(resGeo);
        results = normalizeResults(resGeo.data, params);
        if (results.length > 0) {
          console.log(JSON.stringify({
            event: "stays_search",
            provider: "liteapi",
            city: params.city,
            checkIn: params.checkIn,
            checkOut: checkOutStr,
            adults: params.adults,
            statusCode: lastStatusCode,
            rawCount: lastRawCount,
            parsedCount: results.length,
            mode: "geo",
          }));
          return {
            results,
            debug: { provider: "liteapi", count: results.length, status: "success", city: params.city, rawCount: lastRawCount, parsedCount: results.length, statusCode: lastStatusCode, mode: "geo", endpoint: lastEndpoint, bodyParams: lastBodyParams, responseKeys: lastResponseKeys },
          };
        }
      }

      const resCity = await run("cityName", {
        cityName,
        countryCode,
      });
      setLast(resCity);
      results = normalizeResults(resCity.data, params);

      if (results.length > 0) {
        console.log(JSON.stringify({
          event: "stays_search",
          provider: "liteapi",
          city: params.city,
          checkIn: params.checkIn,
          checkOut: checkOutStr,
          adults: params.adults,
          statusCode: lastStatusCode,
          rawCount: lastRawCount,
          parsedCount: results.length,
          mode: "cityName",
        }));
        return {
          results,
          debug: { provider: "liteapi", count: results.length, status: "success", city: params.city, rawCount: lastRawCount, parsedCount: results.length, statusCode: lastStatusCode, mode: "cityName", endpoint: lastEndpoint, bodyParams: lastBodyParams, responseKeys: lastResponseKeys },
        };
      }

      const cbd = CBD_COORDINATES[cityName];
      if (cbd) {
        const res2 = await run("geo", {
          latitude: cbd.lat,
          longitude: cbd.lng,
          radius: 5000,
          cityName: undefined,
          countryCode,
        });
        setLast(res2);
        results = normalizeResults(res2.data, params);
        if (results.length > 0) {
          console.log(JSON.stringify({
            event: "stays_search",
            provider: "liteapi",
            city: params.city,
            checkIn: params.checkIn,
            checkOut: checkOutStr,
            adults: params.adults,
            statusCode: lastStatusCode,
            rawCount: lastRawCount,
            parsedCount: results.length,
            mode: "geo",
          }));
          return {
            results,
            debug: { provider: "liteapi", count: results.length, status: "success", city: params.city, rawCount: lastRawCount, parsedCount: results.length, statusCode: lastStatusCode, mode: "geo", endpoint: lastEndpoint, bodyParams: lastBodyParams, responseKeys: lastResponseKeys },
          };
        }
      }

      const hotelIds = await getHotelIdsByCity(cityName, countryCode);
      if (hotelIds.length > 0) {
        const res3 = await run("hotelIds", {
          hotelIds: hotelIds.slice(0, 30),
          cityName: undefined,
          countryCode: undefined,
        });
        setLast(res3);
        results = normalizeResults(res3.data, params);
        if (results.length > 0) {
          console.log(JSON.stringify({
            event: "stays_search",
            provider: "liteapi",
            city: params.city,
            checkIn: params.checkIn,
            checkOut: checkOutStr,
            adults: params.adults,
            statusCode: lastStatusCode,
            rawCount: lastRawCount,
            parsedCount: results.length,
            mode: "hotelIds",
          }));
          return {
            results,
            debug: { provider: "liteapi", count: results.length, status: "success", city: params.city, rawCount: lastRawCount, parsedCount: results.length, statusCode: lastStatusCode, mode: "hotelIds", endpoint: lastEndpoint, bodyParams: lastBodyParams, responseKeys: lastResponseKeys },
          };
        }
      }

      const parsedCount = results.length;
      console.log(JSON.stringify({
        event: "stays_search",
        provider: "liteapi",
        city: params.city,
        checkIn: params.checkIn,
        checkOut: checkOutStr,
        adults: params.adults,
        statusCode: lastStatusCode,
        rawCount: lastRawCount,
        parsedCount,
        mode: "all_fallbacks_tried",
      }));
      return {
        results,
        debug: {
          provider: "liteapi",
          count: parsedCount,
          status: "empty",
          city: params.city,
          rawCount: lastRawCount,
          parsedCount,
          statusCode: lastStatusCode,
          endpoint: lastEndpoint,
          bodyParams: lastBodyParams,
          responseKeys: lastResponseKeys,
        },
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[LiteApiStaysProvider] search error:", message);
      console.log(JSON.stringify({
        event: "stays_search",
        provider: "liteapi",
        city: params.city,
        checkIn: params.checkIn,
        checkOut: checkOutStr,
        adults: params.adults,
        statusCode: null,
        rawCount: 0,
        parsedCount: 0,
        error: message,
      }));
      return {
        results: [],
        debug: { provider: "liteapi", error: message, count: 0, status: "error", rawCount: 0, parsedCount: 0, statusCode: null, endpoint: lastEndpoint, bodyParams: lastBodyParams, responseKeys: lastResponseKeys },
      };
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

function newRequestId(): string {
  return `lite_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function structuredLog(level: "info" | "warn" | "error", payload: Record<string, unknown>): void {
  const log = { level, ...payload, timestamp: new Date().toISOString() };
  if (level === "error") {
    console.error(JSON.stringify(log));
  } else if (level === "warn") {
    console.warn(JSON.stringify(log));
  } else {
    console.log(JSON.stringify(log));
  }
}

/** Minimal health check for LiteAPI (sandbox test request). */
export async function liteApiHealthCheck(): Promise<{
  ok: boolean;
  message?: string;
  statusCode?: number;
  requestId?: string;
  errorBody?: string;
}> {
  const requestId = newRequestId();
  if (!process.env.LITEAPI_API_KEY) {
    structuredLog("error", {
      event: "liteapi_health",
      requestId,
      message: "LITEAPI_API_KEY not set",
    });
    return { ok: false, message: "LITEAPI_API_KEY not set", requestId };
  }
  try {
    const res = await fetch(`${LITEAPI_BASE}/hotels/rates`, {
      method: "POST",
      headers: {
        "X-API-Key": getApiKey(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        checkin: new Date().toISOString().split("T")[0],
        checkout: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        currency: "AUD",
        guestNationality: "AU",
        occupancies: [{ rooms: 1, adults: 1 }],
        cityName: "Sydney",
        countryCode: "AU",
      }),
    });
    const statusCode = res.status;
    if (res.ok) {
      structuredLog("info", {
        event: "liteapi_health",
        requestId,
        statusCode,
      });
      return { ok: true, statusCode, requestId };
    }
    const errorBody = await res.text();
    structuredLog("error", {
      event: "liteapi_health",
      requestId,
      statusCode,
      errorBody: errorBody.slice(0, 300),
    });
    return { ok: false, message: errorBody.slice(0, 200), statusCode, requestId, errorBody: errorBody.slice(0, 300) };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    structuredLog("error", {
      event: "liteapi_health",
      requestId,
      errorBody: message,
    });
    return { ok: false, message, requestId, errorBody: message };
  }
}
