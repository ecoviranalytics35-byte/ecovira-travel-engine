import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/core/supabase';
import type { HotelBookingSelection } from '@/lib/core/hotel-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hotelId,
      checkIn,
      nights,
      currency,
      bookingSelection,
      paymentMethod,
      passengerEmail,
      passengerLastName,
      phoneNumber,
      smsOptIn,
    } = body;

    if (!hotelId || !passengerEmail || !passengerLastName || !bookingSelection) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + nights);
    
    // Calculate total
    const roomTotal = bookingSelection.room.pricePerNight * nights * bookingSelection.numberOfRooms;
    const breakfastTotal = bookingSelection.extras.breakfast?.selected 
      ? (bookingSelection.extras.breakfast.pricePerPerson * (bookingSelection.adults + bookingSelection.children) * nights)
      : 0;
    const lateCheckoutTotal = bookingSelection.extras.lateCheckout?.selected 
      ? bookingSelection.extras.lateCheckout.price 
      : 0;
    const total = roomTotal + breakfastTotal + lateCheckoutTotal;

    // Create itinerary
    const { data: itinerary, error: itineraryError } = await supabaseAdmin
      .from('itineraries')
      .insert({
        status: 'confirmed',
        total,
        currency: currency || 'AUD',
      })
      .select()
      .single();

    if (itineraryError || !itinerary) {
      throw new Error('Failed to create demo itinerary');
    }

    // Create itinerary item with hotel booking data
    const stayItemData = {
      hotelId,
      hotelName: 'Ecovira Luxury Hotel',
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      nights,
      room: bookingSelection.room,
      numberOfRooms: bookingSelection.numberOfRooms,
      adults: bookingSelection.adults,
      children: bookingSelection.children,
      extras: bookingSelection.extras,
      total,
      currency: currency || 'AUD',
    };

    const { error: itemError } = await supabaseAdmin
      .from('itinerary_items')
      .insert({
        itinerary_id: itinerary.id,
        type: 'stay',
        item_data: stayItemData,
      });

    if (itemError) {
      throw new Error('Failed to create demo itinerary item');
    }

    // Create booking
    const bookingReference = 'STAY' + Date.now().toString().slice(-6);
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        itinerary_id: itinerary.id,
        payment_id: `demo-payment-${Date.now()}`,
        status: 'ticketed',
        booking_reference: bookingReference,
        supplier_reference: `DEMOHOTEL${Date.now()}`,
        passenger_email: passengerEmail,
        passenger_last_name: passengerLastName,
        phone_number: phoneNumber,
        is_demo: true,
        passenger_count: bookingSelection.adults + bookingSelection.children,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      throw new Error('Failed to create demo booking');
    }

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      bookingReference,
      message: 'Demo hotel booking created successfully',
    });
  } catch (error) {
    console.error('[create-demo-stay] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create demo booking' },
      { status: 500 }
    );
  }
}

