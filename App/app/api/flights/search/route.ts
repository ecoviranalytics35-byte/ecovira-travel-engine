import { searchDuffelFlights } from '@/lib/flights/duffel';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const departDate = searchParams.get('departDate');
  const adults = parseInt(searchParams.get('adults') || '1');
  const cabinClass = searchParams.get('cabinClass') || 'economy';
  const tripType = searchParams.get('tripType') || 'oneway';
  const returnDate = searchParams.get('returnDate') ?? undefined;
  const children = parseInt(searchParams.get('children') || '0');
  const infants = parseInt(searchParams.get('infants') || '0');
  const debug = searchParams.get('debug') === '1';

  try {
    if (process.env.DUFFEL_ACCESS_TOKEN && from && to && departDate) {
      const { results, debug: duffelDebug } = await searchDuffelFlights({ from, to, departDate, adults, cabinClass, tripType, returnDate, children, infants });
      if (debug) {
        return Response.json({ ok: true, results, debug: duffelDebug });
      } else {
        return Response.json({ ok: true, results });
      }
    } else {
      const results = [
        {
          id: "mock-flight-1",
          from: from || "MEL",
          to: to || "SYD",
          departDate: departDate || "2025-12-30",
          price: 299,
          currency: "USD",
          provider: "mock",
          cabinClass,
          tripType,
          children,
          infants
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