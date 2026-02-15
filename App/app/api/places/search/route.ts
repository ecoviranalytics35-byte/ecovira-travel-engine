import { NextRequest, NextResponse } from "next/server";
import { isProduction } from "@/lib/core/env";

const DUFFEL_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

/**
 * Global places search for hotels/stays — Duffel Places (cities + airports).
 * Returns places worldwide for autocomplete; no restricted list.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? searchParams.get("query") ?? "").trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const production = isProduction();

  const qLower = q.toLowerCase();
  const STATIC_PLACES = [
    { label: "Melbourne, AU", city: "Melbourne", countryCode: "AU", lat: -37.8136, lng: 144.9631 },
    { label: "Sydney, AU", city: "Sydney", countryCode: "AU", lat: -33.8688, lng: 151.2093 },
    { label: "London, GB", city: "London", countryCode: "GB", lat: 51.5074, lng: -0.1278 },
    { label: "Istanbul, TR", city: "Istanbul", countryCode: "TR", lat: 41.0082, lng: 28.9784 },
    { label: "Paris, FR", city: "Paris", countryCode: "FR", lat: 48.8566, lng: 2.3522 },
    { label: "New York, US", city: "New York", countryCode: "US", lat: 40.7128, lng: -74.006 },
    { label: "Dubai, AE", city: "Dubai", countryCode: "AE", lat: 25.2048, lng: 55.2708 },
    { label: "Tokyo, JP", city: "Tokyo", countryCode: "JP", lat: 35.6762, lng: 139.6503 },
  ];
  const staticMatch = () => STATIC_PLACES.filter((p) => p.label.toLowerCase().includes(qLower) || p.city.toLowerCase().includes(qLower)).slice(0, 10);

  const token = (process.env.DUFFEL_ACCESS_TOKEN || "").trim();
  if (production && !token) {
    console.log(JSON.stringify({ event: "places_search", query: q, count: 0, statusCode: 500, provider: "duffel", note: "no_token" }));
    return NextResponse.json(
      { error: "Place search unavailable: DUFFEL_ACCESS_TOKEN is required in production.", results: [] },
      { status: 500 }
    );
  }
  if (!token) {
    console.log(JSON.stringify({ event: "places_search", query: q, count: 0, statusCode: 200, provider: "duffel", note: "no_token" }));
    if (!production) return NextResponse.json({ results: q.length >= 1 ? staticMatch() : [] });
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `${DUFFEL_BASE}/places/suggestions?${new URLSearchParams({ query: q })}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Duffel-Version": DUFFEL_VERSION,
        Accept: "application/json",
      },
    });

    type DuffelPlace = {
      type?: string;
      name?: string;
      iata_code?: string;
      iata_country_code?: string;
      city_name?: string;
      city?: { name?: string };
      latitude?: number | null;
      longitude?: number | null;
    };

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[places/search] Duffel API error", { status: res.status, body: errText.slice(0, 200) });
      console.log(JSON.stringify({ event: "places_search", query: q, count: 0, statusCode: res.status, provider: "duffel" }));
      if (production) {
        return NextResponse.json({ error: "Place search failed.", results: [] }, { status: 502 });
      }
      return NextResponse.json({ results: staticMatch() });
    }

    const data = (await res.json()) as { data?: DuffelPlace[] };
    const raw = data.data ?? [];

    const results = raw
      .slice(0, 15)
      .map((p) => {
        const name = p.name ?? "";
        const city = (p.city_name ?? p.city?.name ?? "").trim() || name;
        const countryCode = (p.iata_country_code ?? "").toUpperCase() || "";
        const lat = typeof p.latitude === "number" ? p.latitude : 0;
        const lng = typeof p.longitude === "number" ? p.longitude : 0;
        const label = city && countryCode ? `${city}, ${countryCode}` : name || (p.iata_code ? `${name} (${p.iata_code})` : "");
        return {
          label: label.trim() || name,
          city: city || name,
          countryCode: countryCode || "AU",
          lat: lat || 0,
          lng: lng || 0,
        };
      })
      .filter((r) => r.label.length > 0);

    // Dedupe by label
    const seen = new Set<string>();
    const deduped = results.filter((r) => {
      const key = `${r.city}|${r.countryCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(JSON.stringify({ event: "places_search", query: q, count: deduped.length, statusCode: res.status, provider: "duffel" }));
    if (deduped.length === 0 && !production) return NextResponse.json({ results: staticMatch() });
    return NextResponse.json({ results: deduped });
  } catch (error) {
    console.error("[places/search] Error", error);
    console.log(JSON.stringify({ event: "places_search", query: q, count: 0, statusCode: 500, provider: "duffel" }));
    if (production) {
      return NextResponse.json({ error: "Place search failed.", results: [] }, { status: 500 });
    }
    return NextResponse.json({ results: staticMatch() });
  }
}
