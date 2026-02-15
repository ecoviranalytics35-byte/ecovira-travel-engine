import { searchStays } from "@/lib/search/orchestrator";
import { isProduction } from "@/lib/core/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const city = searchParams.get("city") || "Melbourne";
  const checkIn = searchParams.get("checkIn") || "2025-12-28";
  const nights = parseInt(searchParams.get("nights") || "1", 10);
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  const rooms = parseInt(searchParams.get("rooms") || "1", 10);
  const currency = searchParams.get("currency") || "AUD";
  const budgetPerNight = searchParams.get("budgetPerNight");
  const roomType = searchParams.get("roomType") || "double";
  const classType = searchParams.get("classType") || "standard";

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
  };

  const production = isProduction();

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
    console.log(JSON.stringify({ event: "stays_search", provider: "liteapi", count, status, city: params.city }));

    if (errors && errors.length > 0) {
      return Response.json({
        results: results || [],
        meta: meta || {},
        errors,
        hasErrors: true,
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

    return Response.json(
      { results: [], meta: {}, errors: [errorMessage], hasErrors: true },
      { status: 500 }
    );
  }
}