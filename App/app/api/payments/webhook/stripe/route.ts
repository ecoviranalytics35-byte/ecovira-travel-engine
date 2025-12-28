import { getStripeClient } from "@/lib/payments/stripe";
import { sendConfirmation } from "@/lib/notifications";
import { updateBookingStatus, updateItinerary, getBookingByPaymentId } from "@/lib/itinerary";

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
  // Send confirmation
  await sendConfirmationEmail(itineraryId);
}

async function sendConfirmationEmail(itineraryId: string) {
  // Assume email/phone from user, for now placeholder
  await sendConfirmation(itineraryId, 'user@example.com', '+1234567890');
}