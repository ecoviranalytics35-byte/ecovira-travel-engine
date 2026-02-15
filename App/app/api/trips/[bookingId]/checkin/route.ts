import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';
import type { CheckInInfo } from '@/lib/core/trip-types';
import { resolveAirlineCheckinUrl } from '@/lib/trips/airline-checkin-resolver';
import { isDemoBookingId, getDemoBookingFromDB, getDemoTripById } from '@/lib/demo/booking-helpers';
import { generateMockTrip } from '@/lib/trips/mock-trip';

/**
 * Generate check-in info from trip data
 */
function generateCheckInInfo(trip: any): CheckInInfo {
  if (!trip?.flightData?.scheduledDeparture) {
    return {
      isOpen: false,
      opensAt: new Date().toISOString(),
      closesAt: new Date().toISOString(),
      airlineCheckInUrl: undefined,
      requiredInfo: {
        bookingReference: true,
        lastName: true,
        passport: true,
        ticketNumber: false,
      },
    };
  }

  const departure = new Date(trip.flightData.scheduledDeparture);
  const now = new Date();
  const checkInOpens = new Date(departure.getTime() - 48 * 60 * 60 * 1000);
  const checkInCloses = new Date(departure.getTime() - 60 * 60 * 1000);
  const isOpen = now >= checkInOpens && now < checkInCloses;
  
  const airlineIata = trip.flightData.airlineIata || 'QF';
  const airlineInfo = resolveAirlineCheckinUrl(airlineIata);
  
  return {
    isOpen,
    opensAt: checkInOpens.toISOString(),
    closesAt: checkInCloses.toISOString(),
    airlineCheckInUrl: airlineInfo?.url,
    requiredInfo: {
      bookingReference: true,
      lastName: true,
      passport: true,
      ticketNumber: false,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const departureOffsetHours = searchParams.get('departureOffsetHours') 
      ? parseInt(searchParams.get('departureOffsetHours')!) 
      : undefined;
    
    // Check if this is a demo booking
    if (isDemoBookingId(bookingId) || bookingId.includes('demo') || bookingId.includes('test')) {
      // Try to get from DB first
      const demoBooking = await getDemoBookingFromDB(bookingId);
      if (demoBooking) {
        const checkIn = generateCheckInInfo(demoBooking);
        return NextResponse.json({ checkIn });
      }
      
      // Fallback to generated mock trip
      const mockTrip = getDemoTripById(bookingId, departureOffsetHours) || generateMockTrip(departureOffsetHours || 72);
      if (mockTrip) {
        const checkIn = generateCheckInInfo(mockTrip);
        return NextResponse.json({ checkIn });
      }
    }

    // Check for demo bookings in DB
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
      // Transform to trip format and generate check-in info
      const itinerary = (demoBooking as any).itineraries;
      const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');
      
      if (flightItem) {
        const trip = {
          flightData: {
            airlineIata: flightItem.item_data?.airlineIata || flightItem.item_data?.raw?.airline_iata || flightItem.item?.raw?.airline_iata || 'QF',
            scheduledDeparture: flightItem.item_data?.scheduledDeparture || flightItem.item_data?.departDate || flightItem.item?.departDate || new Date().toISOString(),
          },
        };
        const checkIn = generateCheckInInfo(trip);
        return NextResponse.json({ checkIn });
      }
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

    if (!flightItem) {
      return NextResponse.json(
        { error: 'No flight data found for this trip' },
        { status: 404 }
      );
    }

    const scheduledDeparture = new Date(flightItem.item?.departDate || '');
    const airlineIata = flightItem.item?.raw?.airline_iata || flightItem.item?.from?.substring(0, 2);

    // Calculate check-in window (typically 24-48 hours before departure)
    const checkInOpens = new Date(scheduledDeparture);
    checkInOpens.setHours(checkInOpens.getHours() - 48); // 48 hours before

    const checkInCloses = new Date(scheduledDeparture);
    checkInCloses.setHours(checkInCloses.getHours() - 1); // 1 hour before departure

    const now = new Date();
    const isOpen = now >= checkInOpens && now <= checkInCloses;

    // Generate airline check-in URL using resolver
    const airlineInfo = resolveAirlineCheckinUrl(airlineIata);
    const airlineCheckInUrl = airlineInfo?.url;

    const checkIn: CheckInInfo = {
      isOpen,
      opensAt: checkInOpens.toISOString(),
      closesAt: checkInCloses.toISOString(),
      airlineCheckInUrl,
      requiredInfo: {
        bookingReference: true,
        lastName: true,
        passport: true, // Assume international for MVP
        ticketNumber: false,
      },
    };

    return NextResponse.json({ checkIn });
  } catch (error) {
    console.error('[trips/[bookingId]/checkin] Error:', error);
    return NextResponse.json(
      { error: 'We couldn\'t find a booking with those details. Please check your booking reference and last name exactly as on your ticket, or contact your airline if the booking was made directly.' },
      { status: 500 }
    );
  }
}


