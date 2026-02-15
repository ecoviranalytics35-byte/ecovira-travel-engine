import { NextRequest, NextResponse } from "next/server";

/** Curated list for city autocomplete (LiteAPI-compatible cityName + countryCode). No external API required. */
const SUPPORTED_CITIES: { cityName: string; countryCode: string }[] = [
  { cityName: "Melbourne", countryCode: "AU" },
  { cityName: "Sydney", countryCode: "AU" },
  { cityName: "Brisbane", countryCode: "AU" },
  { cityName: "Perth", countryCode: "AU" },
  { cityName: "Adelaide", countryCode: "AU" },
  { cityName: "Rome", countryCode: "IT" },
  { cityName: "Milan", countryCode: "IT" },
  { cityName: "London", countryCode: "GB" },
  { cityName: "Paris", countryCode: "FR" },
  { cityName: "New York", countryCode: "US" },
  { cityName: "Los Angeles", countryCode: "US" },
  { cityName: "Dubai", countryCode: "AE" },
  { cityName: "Singapore", countryCode: "SG" },
  { cityName: "Tokyo", countryCode: "JP" },
];

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? searchParams.get("query") ?? "").trim().toLowerCase();

  if (!q) {
    console.log(JSON.stringify({ event: "cities_search", query: "", count: 0, statusCode: 200, provider: "static" }));
    return NextResponse.json({ results: [] });
  }

  const results = SUPPORTED_CITIES.filter(
    (c) => c.cityName.toLowerCase().includes(q) || c.cityName.toLowerCase().startsWith(q)
  )
    .slice(0, 10)
    .map((c) => ({
      cityName: c.cityName,
      countryCode: c.countryCode,
      displayName: `${c.cityName}, ${c.countryCode}`,
    }));

  console.log(JSON.stringify({ event: "cities_search", query: q, count: results.length, statusCode: 200, provider: "static" }));
  return NextResponse.json({ results });
}
