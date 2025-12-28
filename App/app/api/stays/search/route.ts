import { searchStays } from "../../../../lib/stays/provider";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const city = searchParams.get("city") || "Melbourne";
  const nights = parseInt(searchParams.get("nights") || "1", 10);
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const debug = searchParams.get("debug") === "1";

  try {
    const { results, debug: staysDebug } = await searchStays({
      city,
      nights: Number.isFinite(nights) ? nights : 1,
      adults: Number.isFinite(adults) ? adults : 1,
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