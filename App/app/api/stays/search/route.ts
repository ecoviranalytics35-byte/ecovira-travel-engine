import { searchStays } from "@/lib/search/orchestrator";
import { generateDemoStays } from "@/lib/demo/data-generators";
import { isProduction } from "@/lib/core/env";

export const runtime = "nodejs";

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;
const VALID_CURRENCY = /^[A-Z]{3}$/;

/** Optional allowlist for non-production; in production we do NOT restrict cities (global autocomplete). */
const SUPPORTED_CITIES_DEV = new Set([
  "melbourne", "sydney", "brisbane", "perth", "adelaide",
  "rome", "milan", "london", "paris", "new york", "los angeles",
  "dubai", "singapore", "tokyo", "istanbul",
]);

function isSupportedCityForDev(city: string): boolean {
  return city.length > 0 && SUPPORTED_CITIES_DEV.has(city.trim().toLowerCase());
}

/** Server-only: known-good test dates 2–6 weeks ahead. */
function getTestCheckIn(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14 + Math.floor(Math.random() * 28));
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testLiteapi = searchParams.get("test") === "liteapi";
  const production = isProduction();

  const cityRaw = searchParams.get("city")?.trim() || "";
  const city = testLiteapi ? "Sydney" : (cityRaw || "Melbourne");
  const countryCodeParam = searchParams.get("countryCode")?.trim().toUpperCase() || undefined;
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const latitude = latParam != null && latParam !== "" ? parseFloat(latParam) : undefined;
  const longitude = lngParam != null && lngParam !== "" ? parseFloat(lngParam) : undefined;
  const defaultCheckIn = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  })();
  const checkInRaw = searchParams.get("checkIn")?.trim();
  const checkIn = testLiteapi ? getTestCheckIn() : (checkInRaw || defaultCheckIn);
  const nights = parseInt(searchParams.get("nights") || "1", 10);
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  const rooms = parseInt(searchParams.get("rooms") || "1", 10);
  const currencyRaw = (searchParams.get("currency") || "AUD").trim().toUpperCase();
  const currency = VALID_CURRENCY.test(currencyRaw) ? currencyRaw : "AUD";
  const budgetPerNight = searchParams.get("budgetPerNight");
  const roomType = searchParams.get("roomType") || "double";
  const classType = searchParams.get("classType") || "standard";

  // Validate before calling LiteAPI (no city allowlist in production — global autocomplete)
  if (!testLiteapi) {
    if (!city || city.length < 1) {
      return Response.json(
        { error: "City is required.", results: [], meta: {}, errors: ["Invalid city"] },
        { status: 400 }
      );
    }
    if (!production && !isSupportedCityForDev(city)) {
      // In dev, optional allowlist for testing; can be removed or expanded
    }
    if (!YYYY_MM_DD.test(checkIn)) {
      return Response.json(
        { error: "Check-in must be YYYY-MM-DD.", results: [], meta: {}, errors: ["Invalid checkIn"] },
        { status: 400 }
      );
    }
    const today = new Date().toISOString().slice(0, 10);
    if (checkIn < today) {
      return Response.json(
        { error: "Check-in must be today or in the future.", results: [], meta: {}, errors: ["Invalid checkIn"] },
        { status: 400 }
      );
    }
    if (!Number.isFinite(nights) || nights < 1) {
      return Response.json(
        { error: "Nights must be at least 1.", results: [], meta: {}, errors: ["Invalid nights"] },
        { status: 400 }
      );
    }
    if (!Number.isFinite(adults) || adults < 1) {
      return Response.json(
        { error: "Adults must be at least 1.", results: [], meta: {}, errors: ["Invalid adults"] },
        { status: 400 }
      );
    }
    if (!Number.isFinite(rooms) || rooms < 1) {
      return Response.json(
        { error: "Rooms must be at least 1.", results: [], meta: {}, errors: ["Invalid rooms"] },
        { status: 400 }
      );
    }
  }

  const checkOut = (() => {
    const d = new Date(checkIn + "T12:00:00");
    d.setDate(d.getDate() + (Number.isFinite(nights) ? nights : 1));
    return d.toISOString().slice(0, 10);
  })();

  const params = {
    city,
    checkIn,
    nights: Number.isFinite(nights) ? nights : 1,
    adults: Number.isFinite(adults) ? adults : 1,
    children: Number.isFinite(children) ? children : 0,
    rooms: Number.isFinite(rooms) ? rooms : 1,
    currency,
    budgetPerNight: budgetPerNight || undefined,
    roomType,
    classType,
    countryCode: countryCodeParam,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  };

  if (production) {
    const key = (process.env.LITEAPI_API_KEY ?? "").trim();
    if (!key) {
      console.error("[stays/search] Production: LITEAPI_API_KEY is missing");
      return Response.json(
        { error: "Hotel search unavailable: LITEAPI_API_KEY is required in production.", results: [], meta: {}, errors: ["LITEAPI_API_KEY missing"] },
        { status: 500 }
      );
    }
  }

  try {
    const { results, meta, errors } = await searchStays(params);

    const count = results?.length ?? 0;
    const status = errors?.length ? "error" : "success";
    const debug = (meta as { debug?: { rawCount?: number; parsedCount?: number; statusCode?: number; endpoint?: string; bodyParams?: object; responseKeys?: string[] } })?.debug;
    const rawCount = debug?.rawCount ?? count;
    const parsedCount = debug?.parsedCount ?? count;
    console.log(JSON.stringify({
      event: "stays_search",
      provider: "liteapi",
      city: params.city,
      checkIn: params.checkIn,
      checkOut,
      adults: params.adults,
      status,
      statusCode: debug?.statusCode,
      rawCount,
      parsedCount,
      testLiteapi,
    }));
    if (testLiteapi) {
      console.log(JSON.stringify({
        event: "stays_search_test_liteapi",
        endpoint: debug?.endpoint ?? "see liteapi_request log",
        bodyParams: debug?.bodyParams,
        statusCode: debug?.statusCode,
        responseKeys: debug?.responseKeys,
        rawCount,
        parsedCount,
        note: rawCount > 0 && parsedCount === 0 ? "rawCount>0 but parsedCount=0 — check extractDataArray/normalize" : undefined,
      }));
    }

    if (production) {
      if (errors && errors.length > 0) {
        return Response.json({
          results: results || [],
          meta: meta || {},
          errors,
          hasErrors: true,
        });
      }
      return Response.json({ results: results ?? [], meta: meta ?? {}, errors: [] });
    }

    if ((!results || results.length === 0) || (errors && errors.length > 0)) {
      const demoResults = generateDemoStays({ city: params.city, checkIn: params.checkIn, nights: params.nights, adults: params.adults });
      return Response.json({
        results: demoResults,
        meta: { ...meta, demo: true, fallback: true },
        errors: [],
      });
    }

    return Response.json({ results, meta, errors: [] });
  } catch (error) {
    console.error("[stays/search] Error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("Invalid date") || errorMessage.includes("cannot be") || errorMessage.includes("code 425")) {
      return Response.json(
        { results: [], meta: {}, errors: [errorMessage], hasErrors: true },
        { status: 400 }
      );
    }

    if (!production) {
      const demoResults = generateDemoStays({ city: params.city, checkIn: params.checkIn, nights: params.nights, adults: params.adults });
      return Response.json({ results: demoResults, meta: { demo: true, fallback: true }, errors: [] });
    }

    return Response.json(
      { results: [], meta: {}, errors: [errorMessage], hasErrors: true },
      { status: 500 }
    );
  }
}