import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';
import type { CheckInInfo } from '@/lib/core/trip-types';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const bookingId = params.bookingId;

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
        { error: 'Trip not found' },
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

    // Generate airline check-in URL (deep link if available)
    const airlineCheckInUrl = getAirlineCheckInUrl(airlineIata, (booking as any).supplier_reference);

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function getAirlineCheckInUrl(airlineIata: string, pnr?: string): string | undefined {
  // Map of airline IATA codes to their check-in URLs
  const airlineUrls: Record<string, string> = {
    'QF': 'https://www.qantas.com/au/en/manage-booking/check-in.html',
    'VA': 'https://www.virginaustralia.com/au/en/manage-booking/check-in/',
    'JQ': 'https://www.jetstar.com/au/en/manage-booking/check-in',
    'AA': 'https://www.aa.com/reservation/findReservation',
    'UA': 'https://www.united.com/en/us/checkin',
    'DL': 'https://www.delta.com/check-in',
    'BA': 'https://www.britishairways.com/en-gb/information/check-in/online-check-in',
    'LH': 'https://www.lufthansa.com/online/checkin',
    'EK': 'https://www.emirates.com/au/english/manage-booking/check-in/',
    'SQ': 'https://www.singaporeair.com/en_UK/us/travel-info/check-in/',
  };

  const baseUrl = airlineUrls[airlineIata];
  if (!baseUrl) return undefined;

  // If we have a PNR, try to append it to the URL (format varies by airline)
  if (pnr) {
    // Most airlines accept PNR as a query parameter
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}pnr=${pnr}`;
  }

  return baseUrl;
}

