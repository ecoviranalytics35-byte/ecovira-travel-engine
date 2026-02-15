import { searchFlights } from "@/lib/search/orchestrator";
import { generateDemoFlights } from "@/lib/demo/data-generators";
import { isProduction } from "@/lib/core/env";

export const runtime = "nodejs";

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

function toIATA(code: string | null): string | null {
  if (code == null) return null;
  const s = code.trim().toUpperCase();
  return s.length === 3 ? s : null;
}

/** Server-only: known-good test date 2–6 weeks from today. */
function getTestDepartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14 + Math.floor(Math.random() * 28));
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testDuffel = searchParams.get("test") === "duffel";
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const departDateRaw = searchParams.get("departDate");
  const adults = parseInt(searchParams.get("adults") || "1");
  const cabinClass = searchParams.get("cabinClass") || "economy";
  const tripType = searchParams.get("tripType") || "oneway";
  const returnDate = searchParams.get("returnDate") ?? undefined;
  const children = parseInt(searchParams.get("children") || "0");
  const infants = parseInt(searchParams.get("infants") || "0");
  const demo = searchParams.get("demo");

  const currency = searchParams.get("currency") || "USD";

  // Known-good test: MEL->SYD, 2–6 weeks out, 1 adult (server-only)
  const from = testDuffel ? "MEL" : (toIATA(fromRaw) ? fromRaw!.trim().toUpperCase().slice(0, 3) : null);
  const to = testDuffel ? "SYD" : (toIATA(toRaw) ? toRaw!.trim().toUpperCase().slice(0, 3) : null);
  const departDate = testDuffel ? getTestDepartDate() : (departDateRaw?.trim() || null);

  // Guard: origin/destination must be valid IATA (3 letters)
  if (!from || from.length !== 3) {
    return Response.json(
      { error: "Origin must be a 3-letter IATA airport code (e.g. MEL, SYD).", results: [], meta: {}, errors: ["Invalid origin"] },
      { status: 400 }
    );
  }
  if (!to || to.length !== 3) {
    return Response.json(
      { error: "Destination must be a 3-letter IATA airport code (e.g. MEL, SYD).", results: [], meta: {}, errors: ["Invalid destination"] },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const departDateFinal = departDate && YYYY_MM_DD.test(departDate) ? departDate : today;
  const adultsFinal = Number.isFinite(adults) && adults >= 1 ? adults : 1;

  if (!testDuffel && departDateFinal < today) {
    return Response.json(
      { error: "Departure date must be today or in the future (YYYY-MM-DD).", results: [], meta: {}, errors: ["Invalid departure_date"] },
      { status: 400 }
    );
  }

  const params: Record<string, unknown> = {
    from,
    to,
    departDate: departDateFinal,
    adults: adultsFinal,
    cabinClass,
    tripType,
    returnDate: tripType === "roundtrip" && returnDate ? returnDate : undefined,
    children: Number.isFinite(children) ? children : 0,
    infants: Number.isFinite(infants) ? infants : 0,
    currency,
  };
  if (testDuffel) (params as { _testDuffel?: boolean })._testDuffel = true;

  // Log exact offerRequest payload sent to Duffel
  const offerRequestPayload = {
    origin: params.from,
    destination: params.to,
    departure_date: params.departDate,
    return_date: params.returnDate ?? null,
    passengers: [
      ...Array(params.adults).fill("adult"),
      ...Array(params.children).fill("child"),
      ...Array(params.infants).fill("infant_without_seat"),
    ].map((type) => ({ type })),
    cabin_class: params.cabinClass,
  };
  console.log(JSON.stringify({ event: "flights_search_request", offerRequestPayload, testDuffel }));

  const production = isProduction();

  if (production) {
    const token = (process.env.DUFFEL_ACCESS_TOKEN ?? "").trim();
    if (!token) {
      return Response.json(
        { error: "Flights search unavailable: DUFFEL_ACCESS_TOKEN is required in production.", results: [], meta: {}, errors: ["DUFFEL_ACCESS_TOKEN missing"] },
        { status: 500 }
      );
    }
  }

  const isDemoMode = demo === "true" || demo === "1";
  if (isDemoMode && !production) {
    const demoResults = generateDemoFlights(params);
    return Response.json({
      results: demoResults,
      meta: { demo: true, mode: "demo" },
      errors: [],
    });
  }

  const { results, meta, errors } = await searchFlights(params);

  if (production) {
    return Response.json({ results: results ?? [], meta: meta ?? {}, errors: errors ?? [] });
  }

  if ((!results || results.length === 0) || (errors && errors.length > 0)) {
    const demoResults = generateDemoFlights(params);
    return Response.json({
      results: demoResults,
      meta: { ...meta, demo: true, fallback: true },
      errors: [],
    });
  }

  return Response.json({ results, meta, errors });
}