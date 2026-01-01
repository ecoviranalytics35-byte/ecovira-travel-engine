import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';
import { generateMockTrip, isTestMode } from '@/lib/trips/mock-trip';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');
    const lastName = searchParams.get('lastName');
    const demo = searchParams.get('demo');

    if (!reference || !lastName) {
      return NextResponse.json(
        { error: 'Booking reference and last name are required' },
        { status: 400 }
      );
    }

    // Check for test/demo mode
    if (isTestMode(reference, lastName, demo)) {
      // Generate mock trip for testing
      const mockTrip = generateMockTrip(72); // 3 days from now (good for check-in testing)
      return NextResponse.json({ trips: [mockTrip] });
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

    // Also include demo bookings if demo mode is active
    const { data: trips, error } = await query;
    
    // If demo mode, also fetch demo bookings
    let demoTrips: any[] = [];
    if (demo === 'true' || isTestMode(reference, lastName, demo)) {
      const { data: demoBookings } = await supabaseAdmin
        .from('bookings')
        .select(`
          *,
          itineraries (
            *,
            itinerary_items (*)
          )
        `)
        .eq('is_demo', true)
        .ilike('booking_reference', reference);
      
      if (demoBookings && demoBookings.length > 0) {
        demoTrips = demoBookings.map((booking: any) => {
          const itinerary = booking.itineraries;
          const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');

          return {
            id: booking.id,
            bookingReference: booking.booking_reference || booking.id,
            itineraryId: booking.itinerary_id,
            status: booking.status,
            supplierReference: booking.supplier_reference,
            createdAt: booking.created_at,
            updatedAt: booking.updated_at,
            flightData: flightItem ? {
              airlineIata: flightItem.item_data?.airlineIata || flightItem.item_data?.raw?.airline_iata || flightItem.item?.raw?.airline_iata || flightItem.item?.from?.substring(0, 2),
              flightNumber: flightItem.item_data?.flightNumber || flightItem.item_data?.raw?.flight_number || flightItem.item?.raw?.flight_number || 'N/A',
              departureAirport: flightItem.item_data?.departureAirport || flightItem.item_data?.from || flightItem.item?.from || '',
              arrivalAirport: flightItem.item_data?.arrivalAirport || flightItem.item_data?.to || flightItem.item?.to || '',
              scheduledDeparture: flightItem.item_data?.scheduledDeparture || flightItem.item_data?.departDate || flightItem.item?.departDate || '',
              scheduledArrival: flightItem.item_data?.scheduledArrival || flightItem.item_data?.arrivalDate || flightItem.item?.arrivalDate || '',
              pnr: booking.supplier_reference,
            } : undefined,
            passengerLastName: booking.passenger_last_name,
            passengerCount: itinerary?.itinerary_items?.reduce((sum: number, item: any) => {
              return sum + (item.item_data?.adults || item.item?.adults || 1);
            }, 0) || 1,
            route: flightItem ? {
              from: flightItem.item_data?.departureAirport || flightItem.item_data?.from || flightItem.item?.from || '',
              to: flightItem.item_data?.arrivalAirport || flightItem.item_data?.to || flightItem.item?.to || '',
              departDate: flightItem.item_data?.scheduledDeparture || flightItem.item_data?.departDate || flightItem.item?.departDate || '',
              returnDate: undefined,
            } : undefined,
          };
        });
      }
    }

    if (error) {
      console.error('[trips/lookup] Database error:', error);
      return NextResponse.json(
        { error: 'We couldn\'t find a booking with those details. Please check your booking reference and last name exactly as on your ticket, or contact your airline if the booking was made directly.' },
        { status: 404 }
      );
    }

    // If no trips found, return user-friendly message
    if (!trips || trips.length === 0) {
      return NextResponse.json(
        { error: 'We couldn\'t find a booking with those details. Please check your booking reference and last name exactly as on your ticket, or contact your airline if the booking was made directly.' },
        { status: 404 }
      );
    }

    // Combine real and demo trips
    const allTrips = [...(trips || []), ...demoTrips];
    
    // Transform to TripBooking format
    const formattedTrips = allTrips.map((booking: any) => {
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
    // Don't expose technical errors to users
    return NextResponse.json(
      { error: 'We couldn\'t find a booking with those details. Please check your booking reference and last name exactly as on your ticket, or contact your airline if the booking was made directly.' },
      { status: 500 }
    );
  }
}

