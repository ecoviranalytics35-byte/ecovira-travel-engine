import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';
import { getAmadeusToken } from '@/lib/stays/amadeus';
import { fetchJson } from '@/lib/core/http';
import type { FlightStatus } from '@/lib/core/trip-types';

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

    const flightData = {
      airlineIata: flightItem.item?.raw?.airline_iata || flightItem.item?.from?.substring(0, 2),
      flightNumber: flightItem.item?.raw?.flight_number || 'N/A',
      departureAirport: flightItem.item?.from || '',
      arrivalAirport: flightItem.item?.to || '',
      scheduledDeparture: flightItem.item?.departDate || '',
      scheduledArrival: flightItem.item?.arrivalDate || '',
    };

    // Try to get flight status from Amadeus
    let status: FlightStatus | null = null;

    try {
      const token = await getAmadeusToken();
      const flightDate = new Date(flightData.scheduledDeparture).toISOString().split('T')[0];
      const url = `https://test.api.amadeus.com/v2/schedule/flights?carrierCode=${flightData.airlineIata}&flightNumber=${flightData.flightNumber}&scheduledDepartureDate=${flightDate}`;

      const data = await fetchJson<{ data?: any[] }>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.data && data.data.length > 0) {
        const flight = data.data[0];
        status = {
          flightNumber: `${flightData.airlineIata} ${flightData.flightNumber}`,
          airlineIata: flightData.airlineIata,
          departure: {
            airport: flight.departure?.iataCode || flightData.departureAirport,
            scheduled: flight.departure?.scheduledAt || flightData.scheduledDeparture,
            estimated: flight.departure?.estimatedAt,
            actual: flight.departure?.actualAt,
            gate: flight.departure?.terminal?.gate,
            terminal: flight.departure?.terminal?.code,
            status: determineStatus(flight.departure?.scheduledAt, flight.departure?.estimatedAt, flight.departure?.actualAt),
          },
          arrival: {
            airport: flight.arrival?.iataCode || flightData.arrivalAirport,
            scheduled: flight.arrival?.scheduledAt || flightData.scheduledArrival,
            estimated: flight.arrival?.estimatedAt,
            actual: flight.arrival?.actualAt,
            gate: flight.arrival?.terminal?.gate,
            terminal: flight.arrival?.terminal?.code,
            baggageBelt: flight.arrival?.baggageBelt,
            status: determineStatus(flight.arrival?.scheduledAt, flight.arrival?.estimatedAt, flight.arrival?.actualAt),
          },
          lastUpdated: new Date().toISOString(),
          source: 'amadeus',
        };
      }
    } catch (apiError) {
      console.error('[trips/[bookingId]/status] Amadeus API error:', apiError);
      // Fallback to scheduled times only
      status = {
        flightNumber: `${flightData.airlineIata} ${flightData.flightNumber}`,
        airlineIata: flightData.airlineIata,
        departure: {
          airport: flightData.departureAirport,
          scheduled: flightData.scheduledDeparture,
          status: 'on-time',
        },
        arrival: {
          airport: flightData.arrivalAirport,
          scheduled: flightData.scheduledArrival,
          status: 'on-time',
        },
        lastUpdated: new Date().toISOString(),
        source: 'unavailable',
      };
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error('[trips/[bookingId]/status] Error:', error);
    return NextResponse.json(
      { error: 'We couldn\'t find a booking with those details. Please check your booking reference and last name exactly as on your ticket, or contact your airline if the booking was made directly.' },
      { status: 500 }
    );
  }
}

function determineStatus(scheduled?: string, estimated?: string, actual?: string): 'on-time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived' {
  if (actual) {
    return 'departed';
  }
  if (estimated && scheduled) {
    const scheduledTime = new Date(scheduled).getTime();
    const estimatedTime = new Date(estimated).getTime();
    const diffMinutes = (estimatedTime - scheduledTime) / (1000 * 60);
    if (diffMinutes > 15) {
      return 'delayed';
    }
  }
  return 'on-time';
}

