import { searchFlights } from '@/lib/search/orchestrator';
import { generateDemoFlights } from '@/lib/demo/data-generators';

export const runtime = "nodejs";

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
  const demo = searchParams.get('demo');

  const currency = searchParams.get('currency') || 'USD';
  
  const params = {
    from: from || 'MEL',
    to: to || 'SYD',
    departDate: departDate || new Date().toISOString().split('T')[0],
    adults: Number.isFinite(adults) ? adults : 1,
    cabinClass,
    tripType,
    returnDate,
    children: Number.isFinite(children) ? children : 0,
    infants: Number.isFinite(infants) ? infants : 0,
    currency,
  };

  // Check for demo mode
  const isDemoMode = demo === 'true' || demo === '1';
  
  if (isDemoMode) {
    // Always return demo results in demo mode
    const demoResults = generateDemoFlights(params);
    return Response.json({ 
      results: demoResults, 
      meta: { demo: true, mode: 'demo' }, 
      errors: [] 
    });
  }

  // Try real search
  const { results, meta, errors } = await searchFlights(params);
  
  // If no results or errors, return demo results as fallback
  if ((!results || results.length === 0) || (errors && errors.length > 0)) {
    const demoResults = generateDemoFlights(params);
    return Response.json({ 
      results: demoResults, 
      meta: { ...meta, demo: true, fallback: true }, 
      errors: [] 
    });
  }

  return Response.json({ results, meta, errors });
}