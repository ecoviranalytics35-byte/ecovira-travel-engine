import { getStripeClient } from "@/lib/payments/stripe";
import { sendConfirmation } from "@/lib/notifications";
import { notifyBookingConfirmed } from "@/lib/notifications/trips";
import { updateBookingStatus, updateItinerary, getBookingByPaymentId, getBookingByOrderId, mapLegacyStatus } from "@/lib/itinerary";
import { issueTicket } from "@/lib/tickets/issuance";
import { fulfillHotelBooking } from "@/lib/stays/fulfillment";
import { supabaseAdmin } from "@/lib/core/supabase";
import type { BookingStatus } from "@/lib/core/types";

export const runtime = "nodejs";

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

    // Handle checkout.session.completed (for Checkout Sessions)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Only process if payment was successful
      if (session.payment_status !== 'paid') {
        console.log("[Stripe Webhook] Payment not completed, status:", session.payment_status);
        return Response.json({ ok: true, received: true });
      }

      const orderId = session.metadata?.orderId;
      const sessionId = session.id;
      
      console.log("[Stripe Webhook] Checkout session completed:", {
        sessionId,
        orderId,
        paymentStatus: session.payment_status,
      });

      // Find booking by orderId or sessionId (payment_id)
      let booking = null;
      if (orderId) {
        booking = await getBookingByOrderId(orderId);
      }
      if (!booking && sessionId) {
        booking = await getBookingByPaymentId(sessionId);
      }

      // If no booking exists, create one from session metadata
      if (!booking && session.metadata?.bookingData) {
        try {
          const { createBookingFromCheckoutSession } = await import('@/lib/bookings/create-from-checkout');
          const bookingData = JSON.parse(session.metadata.bookingData);
          const amount = session.amount_total ? session.amount_total / 100 : 0;
          const currency = session.currency?.toUpperCase() || 'AUD';
          
          const { bookingId } = await createBookingFromCheckoutSession(
            sessionId,
            bookingData,
            session.customer_email || session.customer_details?.email || '',
            amount,
            currency
          );
          
          booking = await getBookingByPaymentId(sessionId);
        } catch (error) {
          console.error('[Stripe Webhook] Failed to create booking from session:', error);
        }
      }

      if (booking) {
        // Idempotency: Check if already processed (support both new and legacy statuses)
        const currentStatus = typeof booking.status === 'string' ? booking.status.toUpperCase() : booking.status;
        if (currentStatus === 'PAID' || currentStatus === 'TICKETED' || currentStatus === 'FULFILLMENT_PENDING' || 
            booking.status === 'paid' || booking.status === 'issued' || booking.status === 'confirmed') {
          console.log("[Stripe Webhook] Booking already processed:", booking.id);
          return Response.json({ ok: true, received: true });
        }

        // Mark booking as PAID (new status enum)
        await updateBookingStatus(booking.id, 'PAID');
        
        // Update itinerary status
        const itineraryId = booking.itineraryId ?? (booking as { itinerary_id?: string }).itinerary_id;
        await updateItinerary(itineraryId, { status: 'paid' });

        // Determine booking type and fulfill accordingly
        const itinerary = await supabaseAdmin
          .from('itineraries')
          .select(`
            *,
            itinerary_items (*)
          `)
          .eq('id', itineraryId)
          .single();

        if (itinerary.data) {
          const items = itinerary.data.itinerary_items || [];
          const hasFlights = items.some((item: any) => item.type === 'flight');
          const hasHotels = items.some((item: any) => item.type === 'stay');
          const hasCars = items.some((item: any) => item.type === 'car');
          const hasTransfers = items.some((item: any) => item.type === 'transfer');

          if (hasHotels) {
            // Fulfill hotel booking
            await fulfillHotelBooking(booking.id);
          } else if (hasCars) {
            // Fulfill car booking
            const { fulfillCarBooking } = await import("@/lib/transport/cars/fulfillment");
            await fulfillCarBooking(booking.id);
          } else if (hasTransfers) {
            // Fulfill transfer booking
            const { fulfillTransferBooking } = await import("@/lib/transport/transfers/fulfillment");
            await fulfillTransferBooking(booking.id);
          } else if (hasFlights) {
            // Issue flight ticket
            await issueTicket(booking.id);
          } else {
            // Unknown type - mark as fulfilled
            await updateBookingStatus(booking.id, 'FULFILLMENT_PENDING');
          }
        }
      } else {
        console.warn("[Stripe Webhook] Booking not found for orderId:", orderId, "sessionId:", sessionId);
      }
    }

    // Handle payment_intent.succeeded (for Payment Intents)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const itineraryId = paymentIntent.metadata.itineraryId;

      if (itineraryId) {
        const booking = await getBookingByPaymentId(paymentIntent.id);
        if (booking) {
          // Idempotency: Check if already processed (support both new and legacy statuses)
          const currentStatus = typeof booking.status === 'string' ? booking.status.toUpperCase() : booking.status;
          if (currentStatus === 'PAID' || currentStatus === 'TICKETED' || currentStatus === 'FULFILLMENT_PENDING' || 
              booking.status === 'paid' || booking.status === 'issued' || booking.status === 'confirmed') {
            console.log("[Stripe Webhook] Booking already processed:", booking.id);
            return Response.json({ ok: true, received: true });
          }

          // Update booking status (new status enum)
          await updateBookingStatus(booking.id, 'PAID');
          // Update itinerary status
          await updateItinerary(itineraryId, { status: 'paid' });
          
          // Determine booking type and fulfill accordingly
          const itinerary = await supabaseAdmin
            .from('itineraries')
            .select(`
              *,
              itinerary_items (*)
            `)
            .eq('id', itineraryId)
            .single();

          if (itinerary.data) {
            const items = itinerary.data.itinerary_items || [];
            const hasFlights = items.some((item: any) => item.type === 'flight');
            const hasHotels = items.some((item: any) => item.type === 'stay');

            if (hasHotels) {
              // Fulfill hotel booking
              await fulfillHotelBooking(booking.id);
            } else if (hasFlights) {
              // Issue flight ticket
              await issueTicket(booking.id);
            } else {
              // Unknown type - mark as fulfilled
              await updateBookingStatus(booking.id, 'FULFILLMENT_PENDING');
            }
          }
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
    const hotelItem = itinerary?.itinerary_items?.find((item: any) => item.type === 'stay');
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

    const phoneNumber = (booking as any).phone_number;
    const smsOptIn = (booking as any).sms_opt_in === true;

    // Handle hotel bookings
    if (hotelItem) {
      const { notifyHotelBookingConfirmed } = await import('@/lib/notifications/hotels');
      const itemData = hotelItem.item_data || hotelItem.item;
      const confirmationNumber = booking.supplier_reference || bookingReference;
      
      const { emailSent, smsSent } = await notifyHotelBookingConfirmed(
        booking.id,
        bookingReference,
        confirmationNumber,
        passengerEmail,
        {
          hotelName: itemData?.name || 'Hotel',
          checkIn: itemData?.checkIn || '',
          checkOut: itemData?.checkOut || '',
          nights: itemData?.nights || 1,
          city: itemData?.city || '',
        },
        phoneNumber,
        smsOptIn
      );

      if (emailSent) {
        await supabaseAdmin
          .from('bookings')
          .update({ booking_confirmed_email_sent_at: new Date().toISOString() })
          .eq('id', booking.id);
      }
      return;
    }

    // Handle flight bookings (existing logic)
    if (flightItem) {
      const itemData = flightItem.item_data || flightItem.item;
      const airlineIata = itemData?.raw?.airline_iata || itemData?.from?.substring(0, 2);
      const flightNumber = itemData?.raw?.flight_number || 'N/A';

      // Send email and SMS (if opted in)
      const { emailSent, smsSent } = await notifyBookingConfirmed(
        booking.id,
        bookingReference,
        passengerEmail,
        {
          from: itemData?.from || '',
          to: itemData?.to || '',
          departDate: itemData?.departDate || '',
          returnDate: undefined,
        },
        {
          airline: airlineIata,
          flightNumber,
          departureTime: itemData?.departDate || '',
          airport: itemData?.from,
        },
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
    }
  } catch (error) {
    console.error('[Webhook] Failed to send booking confirmed email:', error);
  }
}