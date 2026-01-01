import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';
import type { CheckInInfo } from '@/lib/core/trip-types';
import { resolveAirlineCheckinUrl } from '@/lib/trips/airline-checkin-resolver';
import { generateMockTrip } from '@/lib/trips/mock-trip';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const bookingId = params.bookingId;
    
    // Check if this is a test trip ID - generate mock check-in info
    if (bookingId === 'test-trip-123' || bookingId.startsWith('test-')) {
      const mockTrip = generateMockTrip(72);
      const departure = new Date(mockTrip.flightData!.scheduledDeparture);
      const now = new Date();
      const checkInOpens = new Date(departure.getTime() - 48 * 60 * 60 * 1000);
      const checkInCloses = new Date(departure.getTime() - 60 * 60 * 1000);
      const isOpen = now >= checkInOpens && now < checkInCloses;
      
      const airlineInfo = resolveAirlineCheckinUrl(mockTrip.flightData!.airlineIata);
      
      const checkIn: CheckInInfo = {
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
      
      return NextResponse.json({ checkIn });
    }

    // Get booking and flight data
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


