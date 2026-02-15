import { NextRequest, NextResponse } from "next/server";
import { isProduction } from "@/lib/core/env";

const DUFFEL_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

/** Ensure response is exactly { results: T[] } with no extra output. */
function jsonResults<T>(arr: T[]): NextResponse {
  const results = Array.isArray(arr) ? arr : [];
  return NextResponse.json({ results });
}

/**
 * Airport search API - DUFFEL ONLY (production).
 * Uses Duffel Places Suggestions. No Amadeus. No fallback in production.
 * Returns exactly one JSON object: { results: [...] }.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? searchParams.get("query") ?? "").trim();

  if (!query) {
    return jsonResults([]);
  }

  const production = isProduction();

  /** Dev fallback when no token or Duffel returns empty — so dropdown always shows when typing */
  const STATIC_AIRPORTS = [
    { iataCode: "MEL", name: "Melbourne", city: "Melbourne", country: "AU", displayName: "Melbourne (MEL)", fullDisplay: "Melbourne - Melbourne - MEL" },
    { iataCode: "SYD", name: "Sydney", city: "Sydney", country: "AU", displayName: "Sydney (SYD)", fullDisplay: "Sydney - Sydney - SYD" },
    { iataCode: "LHR", name: "London Heathrow", city: "London", country: "GB", displayName: "London Heathrow (LHR)", fullDisplay: "London Heathrow - London - LHR" },
    { iataCode: "LGW", name: "London Gatwick", city: "London", country: "GB", displayName: "London Gatwick (LGW)", fullDisplay: "London Gatwick - London - LGW" },
    { iataCode: "IST", name: "Istanbul", city: "Istanbul", country: "TR", displayName: "Istanbul (IST)", fullDisplay: "Istanbul - Istanbul - IST" },
    { iataCode: "CDG", name: "Paris Charles de Gaulle", city: "Paris", country: "FR", displayName: "Paris Charles de Gaulle (CDG)", fullDisplay: "Paris Charles de Gaulle - Paris - CDG" },
    { iataCode: "JFK", name: "New York JFK", city: "New York", country: "US", displayName: "New York JFK (JFK)", fullDisplay: "New York JFK - New York - JFK" },
  ];
  const qLower = query.toLowerCase();
  const staticMatch = () => STATIC_AIRPORTS.filter((a) => a.iataCode.toLowerCase().startsWith(qLower) || a.city.toLowerCase().includes(qLower) || a.name.toLowerCase().includes(qLower)).slice(0, 10);

  if (production) {
    const token = (process.env.DUFFEL_ACCESS_TOKEN || "").trim();
    if (!token) {
      console.error("[airports/search] Production: DUFFEL_ACCESS_TOKEN is missing");
      return NextResponse.json(
        { error: "Airport search unavailable: DUFFEL_ACCESS_TOKEN is required in production." },
        { status: 500 }
      );
    }
  }

  try {
    const token = (process.env.DUFFEL_ACCESS_TOKEN || "").trim();
    if (!token) {
      console.log(JSON.stringify({ event: "airports_search", query, count: 0, statusCode: 200, provider: "duffel", note: "no_token" }));
      if (!production) return jsonResults(staticMatch());
      return jsonResults([]);
    }

    const url = `${DUFFEL_BASE}/places/suggestions?${new URLSearchParams({ query })}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Duffel-Version": DUFFEL_VERSION,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[airports/search] Duffel API error", { status: res.status, body: errText.slice(0, 200) });
      console.log(JSON.stringify({ event: "airports_search", query, count: 0, statusCode: res.status, provider: "duffel" }));
      if (production) {
        return NextResponse.json(
          { error: "Airport search failed." },
          { status: 502 }
        );
      }
      return jsonResults([]);
    }

    const data = (await res.json()) as { data?: Array<{ type?: string; iata_code?: string; name?: string; iata_country_code?: string; city_name?: string; city?: { name?: string } }> };
    const raw = data.data ?? [];

    const results = raw
      .filter((p) => p.iata_code && (p.type === "airport" || p.type === "city"))
      .slice(0, 10)
      .map((p) => {
        const iataCode = p.iata_code ?? "";
        const name = p.name ?? "";
        const city = p.city_name ?? p.city?.name ?? "";
        const country = p.iata_country_code ?? "";
        return {
          iataCode,
          name,
          city,
          country,
          displayName: `${name} (${iataCode})`,
          fullDisplay: `${name} - ${city} - ${iataCode}`,
        };
      });

    if (production && results.length === 0 && raw.length > 0) {
      const withCode = raw.filter((p) => p.iata_code).slice(0, 10);
      const fallback = withCode.map((p) => {
        const iataCode = p.iata_code ?? "";
        const name = p.name ?? "";
        const city = p.city_name ?? p.city?.name ?? "";
        const country = p.iata_country_code ?? "";
        return {
          iataCode,
          name,
          city,
          country,
          displayName: `${name} (${iataCode})`,
          fullDisplay: `${name} - ${city} - ${iataCode}`,
        };
      });
      console.log(JSON.stringify({ event: "airports_search", query, count: fallback.length, statusCode: res.status, provider: "duffel" }));
      return jsonResults(fallback);
    }

    console.log(JSON.stringify({ event: "airports_search", query, count: results.length, statusCode: res.status, provider: "duffel" }));
    if (results.length === 0 && !production) return jsonResults(staticMatch());
    return jsonResults(results);
  } catch (error) {
    console.error("[airports/search] Error", error);
    console.log(JSON.stringify({ event: "airports_search", query, count: 0, statusCode: 500, provider: "duffel" }));
    if (production) {
      return NextResponse.json(
        { error: "Airport search failed." },
        { status: 500 }
      );
    }
    return jsonResults(staticMatch());
  }
}
