import { searchDuffelFlights } from '../../../../lib/flights/duffel';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const departDate = searchParams.get('departDate');
  const adults = parseInt(searchParams.get('adults') || '1');
  const debug = searchParams.get('debug') === '1';

  try {
    if (process.env.DUFFEL_ACCESS_TOKEN && from && to && departDate) {
      const { results, debug: duffelDebug } = await searchDuffelFlights({ from, to, departDate, adults });
      if (debug) {
        return Response.json({ ok: true, results, debug: duffelDebug });
      } else {
        return Response.json({ ok: true, results });
      }
    } else {
      const results = [
        {
          id: "mock-flight-1",
          from: "NYC",
          to: "LAX",
          departDate: "2025-12-30",
          price: 299,
          currency: "USD",
          provider: "mock"
        }
      ];
      if (debug) {
        return Response.json({ ok: true, results, debug: { mode: "mock" } });
      } else {
        return Response.json({ ok: true, results });
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}