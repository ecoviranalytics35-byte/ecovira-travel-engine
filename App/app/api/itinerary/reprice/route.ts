import { NextRequest, NextResponse } from 'next/server';
import { getItinerary, updateItinerary, updateItineraryItems } from '../../../../lib/itinerary';
import { searchFlights } from '../../../../lib/search/orchestrator';
import { searchStays } from '../../../../lib/search/orchestrator';
import { searchCars } from '../../../../lib/search/orchestrator';
import { searchTransfers } from '../../../../lib/search/orchestrator';
import { ItineraryItem } from '../../../../lib/core/types';

export async function POST(request: NextRequest) {
  try {
    const { itineraryId } = await request.json();

    const itinerary = await getItinerary(itineraryId);
    if (!itinerary) {
      return NextResponse.json({ ok: false, error: 'Itinerary not found' }, { status: 404 });
    }

    const updatedItems: ItineraryItem[] = [];

    for (const item of itinerary.items) {
      let results: any[] = [];
      let response: any;
      switch (item.type) {
        case 'flight':
          const flight = item.item as any;
          response = await searchFlights({
            from: flight.from,
            to: flight.to,
            departDate: flight.departDate,
            adults: flight.adults ?? 1,
            returnDate: flight.returnDate,
            tripType: flight.tripType || 'oneway',
            currency: 'USD',
          });
          results = response.results;
          break;
        case 'stay':
          const stay = item.item as any;
          response = await searchStays({
            city: stay.city,
            checkIn: stay.checkIn,
            nights: stay.nights,
            adults: stay.adults || 1,
          });
          results = response.results;
          break;
        case 'car':
          // For simplicity, assume same params
          const car = item.item as any;
          response = await searchCars({
            pickupLat: 0, // placeholder
            pickupLng: 0,
            pickupDate: car.pickupDate || '2024-12-01',
            pickupTime: '10:00',
            dropoffDate: car.dropoffDate || '2024-12-02',
            dropoffTime: '10:00',
            driverAge: 30,
          });
          results = response.results;
          break;
        case 'transfer':
          const transfer = item.item as any;
          response = await searchTransfers({
            startLat: 0,
            startLng: 0,
            endLat: 0,
            endLng: 0,
            dateTime: transfer.dateTime,
            adults: 1,
          });
          results = response.results;
          break;
      }
      // Assume first result or match by id
      const updatedItem = results.find(r => r.id === item.item.id) || item.item;
      updatedItems.push({ ...item, item: updatedItem });
    }

    const total = updatedItems.reduce((sum, item) => sum + Number((item.item as any).price || (item.item as any).total || 0), 0);

    // Update in DB
    await updateItinerary(itineraryId, { total, status: 'priced' });
    await updateItineraryItems(itineraryId, updatedItems);

    // For now, return updated
    return NextResponse.json({ ok: true, data: { ...itinerary, items: updatedItems, total } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}