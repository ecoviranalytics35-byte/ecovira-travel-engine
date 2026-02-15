import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';
import { isDemoBookingId, getDemoBookingFromDB, getDemoTripById } from '@/lib/demo/booking-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    
    // Check if this is a demo booking
    if (isDemoBookingId(bookingId)) {
      // Try to get from DB first (for seeded demo bookings)
      const demoBooking = await getDemoBookingFromDB(bookingId);
      if (demoBooking) {
        return NextResponse.json({ trip: demoBooking });
      }
      
      // Fallback to generated mock trip
      const mockTrip = getDemoTripById(bookingId);
      if (mockTrip) {
        return NextResponse.json({ trip: mockTrip });
      }
    }

    // Check for demo bookings in DB (is_demo=true)
    const { data: demoBooking, error: demoError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        itineraries (
          *,
          itinerary_items (*)
        )
      `)
      .eq('id', bookingId)
      .eq('is_demo', true)
      .single();

    if (!demoError && demoBooking) {
      // Transform demo booking to TripBooking format
      const itinerary = (demoBooking as any).itineraries;
      const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');
      const stayItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'stay');

      const trip = {
        id: demoBooking.id,
        bookingReference: (demoBooking as any).booking_reference || demoBooking.id,
        itineraryId: demoBooking.itinerary_id,
        status: demoBooking.status,
        supplierReference: (demoBooking as any).supplier_reference,
        createdAt: demoBooking.created_at,
        updatedAt: demoBooking.updated_at,
        flightData: flightItem ? {
          airlineIata: flightItem.item_data?.airlineIata || flightItem.item_data?.raw?.airline_iata || flightItem.item?.raw?.airline_iata || flightItem.item?.from?.substring(0, 2),
          flightNumber: flightItem.item_data?.flightNumber || flightItem.item_data?.raw?.flight_number || flightItem.item?.raw?.flight_number || 'N/A',
          departureAirport: flightItem.item_data?.departureAirport || flightItem.item_data?.from || flightItem.item?.from || '',
          arrivalAirport: flightItem.item_data?.arrivalAirport || flightItem.item_data?.to || flightItem.item?.to || '',
          scheduledDeparture: flightItem.item_data?.scheduledDeparture || flightItem.item_data?.departDate || flightItem.item?.departDate || '',
          scheduledArrival: flightItem.item_data?.scheduledArrival || flightItem.item_data?.arrivalDate || flightItem.item?.arrivalDate || '',
          pnr: (demoBooking as any).supplier_reference,
        } : undefined,
        hotelData: stayItem ? {
          hotelId: stayItem.item_data?.hotelId || '',
          hotelName: stayItem.item_data?.hotelName || '',
          checkIn: stayItem.item_data?.checkIn || '',
          checkOut: stayItem.item_data?.checkOut || '',
          nights: stayItem.item_data?.nights || 0,
          room: stayItem.item_data?.room || {},
          numberOfRooms: stayItem.item_data?.numberOfRooms || 1,
          adults: stayItem.item_data?.adults || 0,
          children: stayItem.item_data?.children || 0,
          extras: stayItem.item_data?.extras || undefined,
        } : undefined,
        passengerLastName: (demoBooking as any).passenger_last_name,
        passengerCount: itinerary?.itinerary_items?.reduce((sum: number, item: any) => {
          return sum + (item.item_data?.adults || item.item?.adults || item.item_data?.numberOfRooms ? (item.item_data?.adults || 0) + (item.item_data?.children || 0) : 1);
        }, 0) || 1,
        route: flightItem ? {
          from: flightItem.item_data?.departureAirport || flightItem.item_data?.from || flightItem.item?.from || '',
          to: flightItem.item_data?.arrivalAirport || flightItem.item_data?.to || flightItem.item?.to || '',
          departDate: flightItem.item_data?.scheduledDeparture || flightItem.item_data?.departDate || flightItem.item?.departDate || '',
          returnDate: undefined,
        } : undefined,
        // Include extras from flight item data
        extras: flightItem?.item_data?.extras || undefined,
      };

      return NextResponse.json({ trip });
    }

    // Try real booking
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
      .is('is_demo', null) // Exclude demo bookings
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'We couldn\'t find a booking with those details. Please check your booking reference and last name exactly as on your ticket, or contact your airline if the booking was made directly.' },
        { status: 404 }
      );
    }

    const itinerary = booking.itineraries;
    const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');
    const stayItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'stay');

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
      hotelData: stayItem ? {
        hotelId: stayItem.item_data?.hotelId || stayItem.item?.hotelId || '',
        hotelName: stayItem.item_data?.hotelName || stayItem.item?.hotelName || '',
        checkIn: stayItem.item_data?.checkIn || stayItem.item?.checkIn || '',
        checkOut: stayItem.item_data?.checkOut || stayItem.item?.checkOut || '',
        nights: stayItem.item_data?.nights || stayItem.item?.nights || 0,
        room: stayItem.item_data?.room || stayItem.item?.room || {},
        numberOfRooms: stayItem.item_data?.numberOfRooms || stayItem.item?.numberOfRooms || 1,
        adults: stayItem.item_data?.adults || stayItem.item?.adults || 0,
        children: stayItem.item_data?.children || stayItem.item?.children || 0,
        extras: stayItem.item_data?.extras || stayItem.item?.extras || undefined,
      } : undefined,
      passengerLastName: (booking as any).passenger_last_name,
      passengerCount: itinerary?.itinerary_items?.reduce((sum: number, item: any) => {
        if (item.type === 'stay') {
          return sum + ((item.item_data?.adults || item.item?.adults || 0) + (item.item_data?.children || item.item?.children || 0));
        }
        return sum + (item.item?.adults || 1);
      }, 0) || 1,
      route: flightItem ? {
        from: flightItem.item?.from || '',
        to: flightItem.item?.to || '',
        departDate: flightItem.item?.departDate || '',
        returnDate: undefined,
      } : undefined,
      // Include extras from flight item data
      extras: flightItem?.item_data?.extras || flightItem?.item?.extras || undefined,
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

