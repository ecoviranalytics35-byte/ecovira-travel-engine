import { NextRequest, NextResponse } from 'next/server';

/**
 * Airport search API - uses Amadeus Airport & City Search
 * Returns airports matching the query (name, city, or IATA code)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Get Amadeus token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_API_KEY || '',
        client_secret: process.env.AMADEUS_API_SECRET || '',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('[airports/search] Failed to get Amadeus token');
      // Fallback to static airport list
      return NextResponse.json({ results: getStaticAirports(query) });
    }

    const { access_token } = await tokenResponse.json();
    
    // Search airports using Amadeus Airport & City Search
    const searchResponse = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(query)}&max=10`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!searchResponse.ok) {
      console.error('[airports/search] Amadeus API error');
      return NextResponse.json({ results: getStaticAirports(query) });
    }

    const data = await searchResponse.json();
    
    const results = (data.data || []).map((airport: any) => ({
      iataCode: airport.iataCode,
      name: airport.name,
      city: airport.address?.cityName || '',
      country: airport.address?.countryName || '',
      displayName: `${airport.name} (${airport.iataCode})`,
      fullDisplay: `${airport.name} - ${airport.address?.cityName || ''} - ${airport.iataCode}`,
    }));

    // If no results from Amadeus, fallback to static list
    if (results.length === 0) {
      return NextResponse.json({ results: getStaticAirports(query) });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[airports/search] Error:', error);
    // Fallback to static airport list
    return NextResponse.json({ results: getStaticAirports(query) });
  }
}

/**
 * Static airport list fallback (common airports)
 */
function getStaticAirports(query: string) {
  const airports = [
    { iataCode: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia' },
    { iataCode: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia' },
    { iataCode: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia' },
    { iataCode: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia' },
    { iataCode: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'Australia' },
    { iataCode: 'CBR', name: 'Canberra Airport', city: 'Canberra', country: 'Australia' },
    { iataCode: 'OOL', name: 'Gold Coast Airport', city: 'Gold Coast', country: 'Australia' },
    { iataCode: 'CNS', name: 'Cairns Airport', city: 'Cairns', country: 'Australia' },
    { iataCode: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States' },
    { iataCode: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
    { iataCode: 'LHR', name: 'London Heathrow', city: 'London', country: 'United Kingdom' },
    { iataCode: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
    { iataCode: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates' },
    { iataCode: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore' },
    { iataCode: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong' },
    { iataCode: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan' },
    { iataCode: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea' },
  ];

  const lowerQuery = query.toLowerCase();
  return airports
    .filter(airport => 
      airport.iataCode.toLowerCase().includes(lowerQuery) ||
      airport.name.toLowerCase().includes(lowerQuery) ||
      airport.city.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 10)
    .map(airport => ({
      iataCode: airport.iataCode,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      displayName: `${airport.name} (${airport.iataCode})`,
      fullDisplay: `${airport.name} - ${airport.city} - ${airport.iataCode}`,
    }));
}

