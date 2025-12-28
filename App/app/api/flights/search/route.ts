import { searchFlights } from '@/lib/search/orchestrator';

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

  const currency = searchParams.get('currency') || 'USD';
  
  const params = {
    from,
    to,
    departDate,
    adults: Number.isFinite(adults) ? adults : 1,
    cabinClass,
    tripType,
    returnDate,
    children: Number.isFinite(children) ? children : 0,
    infants: Number.isFinite(infants) ? infants : 0,
    currency,
  };

  const { results, meta, errors } = await searchFlights(params);
  return Response.json({ results, meta, errors });
}