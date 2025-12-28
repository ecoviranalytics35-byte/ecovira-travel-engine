import { getStripeClient } from "@/lib/payments/stripe";
import { sendConfirmation } from "@/lib/notifications";
import { notifyBookingConfirmed } from "@/lib/notifications/trips";
import { updateBookingStatus, updateItinerary, getBookingByPaymentId } from "@/lib/itinerary";
import { supabaseAdmin } from "@/lib/core/supabase";

export async function POST(request: Request) {
  try {
    const stripe = getStripeClient();
    const sig = request.headers.get('stripe-signature');
    const body = await request.text();

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      return Response.json({ ok: false, error: 'Webhook signature verification failed' }, { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const itineraryId = paymentIntent.metadata.itineraryId;

      if (itineraryId) {
        const booking = await getBookingByPaymentId(paymentIntent.id);
        if (booking) {
          // Update booking status
          await updateBookingStatus(booking.id, 'paid');
          // Update itinerary status
          await updateItinerary(itineraryId, { status: 'paid' });
          // Trigger booking worker
          await processBooking(itineraryId);
        }
      }
    }

    return Response.json({ ok: true, received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

async function processBooking(itineraryId: string) {
  // Placeholder for booking worker
  // Call providers to book
  // Update status to confirmed
  await updateItinerary(itineraryId, { status: 'confirmed' });
  // Send booking confirmed email
  await sendBookingConfirmedEmail(itineraryId);
}

async function sendBookingConfirmedEmail(itineraryId: string) {
  try {
    // Get booking and itinerary details
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        itineraries (
          *,
          itinerary_items (*)
        )
      `)
      .eq('itinerary_id', itineraryId)
      .single();

    if (!booking) return;

    const itinerary = (booking as any).itineraries;
    const flightItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'flight');
    const passengerEmail = (booking as any).passenger_email;
    const bookingReference = (booking as any).booking_reference || booking.id;

    if (!passengerEmail) {
      console.warn('[Webhook] No passenger email for booking confirmation:', booking.id);
      return;
    }

    // Check if email already sent (idempotent)
    if ((booking as any).booking_confirmed_email_sent_at) {
      console.log('[Webhook] Booking confirmed email already sent for:', booking.id);
      return;
    }

    const itemData = flightItem?.item_data || flightItem?.item;
    const airlineIata = itemData?.raw?.airline_iata || itemData?.from?.substring(0, 2);
    const flightNumber = itemData?.raw?.flight_number || 'N/A';
    const phoneNumber = (booking as any).phone_number;
    const smsOptIn = (booking as any).sms_opt_in === true;

    // Send email and SMS (if opted in)
    const { emailSent, smsSent } = await notifyBookingConfirmed(
      booking.id,
      bookingReference,
      passengerEmail,
      flightItem ? {
        from: itemData?.from || '',
        to: itemData?.to || '',
        departDate: itemData?.departDate || '',
        returnDate: undefined,
      } : undefined,
      flightItem ? {
        airline: airlineIata,
        flightNumber,
        departureTime: itemData?.departDate || '',
        airport: itemData?.from,
      } : undefined,
      phoneNumber,
      smsOptIn
    );

    if (emailSent) {
      // Mark email as sent
      await supabaseAdmin
        .from('bookings')
        .update({ booking_confirmed_email_sent_at: new Date().toISOString() })
        .eq('id', booking.id);
    }
    
    if (smsSent) {
      // Mark SMS as sent (optional tracking)
      console.log('[Webhook] Booking confirmed SMS sent for:', booking.id);
    }
  } catch (error) {
    console.error('[Webhook] Failed to send booking confirmed email:', error);
  }
}