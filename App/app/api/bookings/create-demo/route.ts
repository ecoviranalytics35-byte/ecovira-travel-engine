import { NextRequest, NextResponse } from 'next/server';
import { createDemoFlightBooking } from '@/lib/demo/create-demo-booking';
import type { BookingExtras } from '@/lib/core/booking-extras';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      flightId,
      cabinClass,
      passengers,
      currency,
      extras,
      paymentMethod,
      passengerEmail,
      passengerLastName,
      phoneNumber,
      smsOptIn,
    } = body;

    if (!flightId || !passengerEmail || !passengerLastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For demo mode, create a mock flight result
    const mockFlight = {
      id: flightId,
      airline: 'QF',
      flightNumber: 'QF101',
      from: 'MEL',
      to: 'SYD',
      price: '250',
      currency: currency || 'AUD',
      raw: { demo: true },
    };

    // Create demo booking with extras
    const { bookingId, bookingReference } = await createDemoFlightBooking({
      flight: mockFlight as any,
      passengerEmail,
      passengerLastName,
      phoneNumber,
      departureOffsetHours: 72,
      extras: extras as BookingExtras,
    });

    // Store extras in booking metadata (would be in DB in production)
    // For now, we'll store it in the booking record's metadata field if it exists
    // Or we can add an extras field to the bookings table

    return NextResponse.json({
      ok: true,
      bookingId,
      bookingReference,
      message: 'Demo booking created successfully',
    });
  } catch (error) {
    console.error('[create-demo-booking] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create demo booking' },
      { status: 500 }
    );
  }
}

