import { getStripeClient } from "@/lib/payments/stripe";
import { getItinerary, createBooking } from "@/lib/itinerary";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      itineraryId,
      passengerEmail,
      passengerLastName,
      phoneNumber,
      smsOptIn,
    } = body;

    const itinerary = await getItinerary(itineraryId);
    if (!itinerary) {
      return Response.json({ ok: false, error: "Itinerary not found" }, { status: 404 });
    }

    const amount = Math.round(itinerary.total * 100); // cents
    const currency = itinerary.currency.toLowerCase();

    // Generate booking reference
    const bookingReference = `ECV${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { itineraryId },
    });

    // Create booking with customer info
    const booking = await createBooking(itineraryId, paymentIntent.id, {
      passengerEmail,
      passengerLastName,
      phoneNumber,
      smsOptIn: smsOptIn === true,
      bookingReference,
    });

    return Response.json({ ok: true, clientSecret: paymentIntent.client_secret, bookingId: booking.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}