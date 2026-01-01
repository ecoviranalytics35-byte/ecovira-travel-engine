import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';
import { generateMockTrip } from '@/lib/trips/mock-trip';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const bookingId = params.bookingId;
    
    // Check if this is a test trip ID
    if (bookingId === 'test-trip-123' || bookingId.startsWith('test-')) {
      const mockTrip = generateMockTrip(72);
      return NextResponse.json({ trip: mockTrip });
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        itineraries (
          *,
          itinerary_items (*)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'We couldn\'t find a booking with those details. Please check your booking reference and last name exactly as on your ticket, or contact your airline if the booking was made directly.' },
        { status: 404 }
      );
    }

    const itinerary = booking.itineraries;
    const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');

    const trip = {
      id: booking.id,
      bookingReference: (booking as any).booking_reference || booking.id,
      itineraryId: booking.itinerary_id,
      status: booking.status,
      supplierReference: (booking as any).supplier_reference,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      flightData: flightItem ? {
        airlineIata: flightItem.item?.raw?.airline_iata || flightItem.item?.from?.substring(0, 2),
        flightNumber: flightItem.item?.raw?.flight_number || 'N/A',
        departureAirport: flightItem.item?.from || '',
        arrivalAirport: flightItem.item?.to || '',
        scheduledDeparture: flightItem.item?.departDate || '',
        scheduledArrival: flightItem.item?.arrivalDate || '',
        pnr: (booking as any).supplier_reference,
      } : undefined,
      passengerLastName: (booking as any).passenger_last_name,
      passengerCount: itinerary?.itinerary_items?.reduce((sum: number, item: any) => {
        return sum + (item.item?.adults || 1);
      }, 0) || 1,
      route: flightItem ? {
        from: flightItem.item?.from || '',
        to: flightItem.item?.to || '',
        departDate: flightItem.item?.departDate || '',
        returnDate: undefined,
      } : undefined,
    };

    return NextResponse.json({ trip });
  } catch (error) {
    console.error('[trips/[bookingId]] Error:', error);
    return NextResponse.json(
      { error: 'We couldn\'t find a booking with those details. Please check your booking reference and last name exactly as on your ticket, or contact your airline if the booking was made directly.' },
      { status: 500 }
    );
  }
}

