import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');
    const lastName = searchParams.get('lastName');

    if (!reference || !lastName) {
      return NextResponse.json(
        { error: 'Booking reference and last name are required' },
        { status: 400 }
      );
    }

    // Look up trips by booking reference and last name
    // This is a simplified MVP - in production, you'd have proper authentication
    // Note: booking_reference and passenger_last_name fields may need to be added to bookings table
    let query = supabaseAdmin
      .from('bookings')
      .select(`
        *,
        itineraries (
          *,
          itinerary_items (*)
        )
      `);

    // Try to filter by booking_reference if column exists, otherwise use id
    try {
      query = query.ilike('booking_reference', reference);
    } catch {
      // Fallback: search by id if booking_reference column doesn't exist
      query = query.eq('id', reference);
    }

    // Try to filter by passenger_last_name if column exists
    try {
      query = query.eq('passenger_last_name', lastName.toLowerCase());
    } catch {
      // Column doesn't exist, skip this filter for MVP
    }

    const { data: trips, error } = await query;

    if (error) {
      console.error('[trips/lookup] Database error:', error);
      return NextResponse.json(
        { error: 'Unable to retrieve trips' },
        { status: 500 }
      );
    }

    // Transform to TripBooking format
    const formattedTrips = (trips || []).map((booking: any) => {
      const itinerary = booking.itineraries;
      const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');

      return {
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
          returnDate: undefined, // Would need to check for return flight
        } : undefined,
      };
    });

    return NextResponse.json({ trips: formattedTrips });
  } catch (error) {
    console.error('[trips/lookup] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

