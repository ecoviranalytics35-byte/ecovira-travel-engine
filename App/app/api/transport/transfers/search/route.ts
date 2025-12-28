import { searchTransfers } from "@/lib/search/orchestrator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const startLat = parseFloat(searchParams.get("startLat") || "");
  const startLng = parseFloat(searchParams.get("startLng") || "");
  const endLat = parseFloat(searchParams.get("endLat") || "");
  const endLng = parseFloat(searchParams.get("endLng") || "");
  const dateTime = searchParams.get("dateTime");
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const debug = searchParams.get("debug") === "1";

  const hasEnv = process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET;
  const hasParams = !isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng) && dateTime;

  // #region agent log
  console.log('[API] transfers/search called', { hasEnv, hasParams, startLat, startLng, endLat, endLng, dateTime, adults });
  // #endregion

  if (!hasParams) {
    // #region agent log
    console.log('[API] transfers/search missing params');
    // #endregion
    return Response.json({ results: [], meta: {}, errors: ['Missing required parameters: startLat, startLng, endLat, endLng, dateTime'] }, { status: 400 });
  }

  const params = {
    startLat,
    startLng,
    endLat,
    endLng,
    dateTime: dateTime!,
    adults,
  };

  try {
    const { results, meta, errors } = await searchTransfers(params);
    // #region agent log
    console.log('[API] transfers/search result', { resultsCount: results?.length || 0, errorsCount: errors?.length || 0, hasErrors: !!errors });
    // #endregion
    return Response.json({ results, meta, errors });
  } catch (error) {
    // #region agent log
    console.error('[API] transfers/search error', error);
    // #endregion
    return Response.json({ results: [], meta: {}, errors: [error instanceof Error ? error.message : 'Unknown error'] }, { status: 500 });
  }
}