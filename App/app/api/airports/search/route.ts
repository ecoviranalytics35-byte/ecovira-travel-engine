import { NextRequest, NextResponse } from "next/server";
import { isProduction } from "@/lib/core/env";

const DUFFEL_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

/**
 * Airport search API - DUFFEL ONLY (production).
 * Uses Duffel Places Suggestions. No Amadeus. No fallback in production.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const production = isProduction();

  if (production) {
    const token = (process.env.DUFFEL_ACCESS_TOKEN ?? "").trim();
    if (!token) {
      console.error("[airports/search] Production: DUFFEL_ACCESS_TOKEN is missing");
      return NextResponse.json(
        { error: "Airport search unavailable: DUFFEL_ACCESS_TOKEN is required in production." },
        { status: 500 }
      );
    }
  }

  try {
    const token = (process.env.DUFFEL_ACCESS_TOKEN ?? "").trim();
    if (!token) {
      return NextResponse.json({ results: [] });
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
      if (production) {
        return NextResponse.json(
          { error: "Airport search failed." },
          { status: 502 }
        );
      }
      return NextResponse.json({ results: [] });
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
      return NextResponse.json({ results: fallback });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[airports/search] Error", error);
    if (production) {
      return NextResponse.json(
        { error: "Airport search failed." },
        { status: 500 }
      );
    }
    return NextResponse.json({ results: [] });
  }
}
