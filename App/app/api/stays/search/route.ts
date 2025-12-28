import { searchStays } from "../../../../lib/stays/provider";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const city = searchParams.get("city") || "Melbourne";
  const checkIn = searchParams.get("checkIn") || "2026-01-15";
  const nights = parseInt(searchParams.get("nights") || "1", 10);
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  const rooms = parseInt(searchParams.get("rooms") || "1", 10);
  const currency = searchParams.get("currency") || "AUD";
  const budgetPerNight = searchParams.get("budgetPerNight");
  const debug = searchParams.get("debug") === "1";

  try {
    const { results, debug: staysDebug } = await searchStays({
      city,
      checkIn,
      nights: Number.isFinite(nights) ? nights : 1,
      adults: Number.isFinite(adults) ? adults : 1,
      children: Number.isFinite(children) ? children : 0,
      rooms: Number.isFinite(rooms) ? rooms : 1,
      currency,
      budgetPerNight
    });

    if (debug) {
      return Response.json({ ok: true, results, debug: staysDebug });
    }

    return Response.json({ ok: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}