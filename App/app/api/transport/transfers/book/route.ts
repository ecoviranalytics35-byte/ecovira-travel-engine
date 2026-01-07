import { amadeusTransfersProvider } from "@/lib/transport/transfers/amadeus-provider";
import { mockTransfersProvider } from "@/lib/transport/transfers/provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      offer, // The raw Amadeus transfer offer
      paymentId,
      passengerInfo
    }: {
      offer: any;
      paymentId: string;
      passengerInfo: {
        passengers: number;
        luggage: number;
        specialRequests?: string;
      };
    } = body;

    if (!offer || !paymentId || !passengerInfo) {
      return Response.json({ ok: false, error: "Missing required booking data" }, { status: 400 });
    }

    const bookingReference = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Use Amadeus provider for real booking, fallback to mock if needed
    const provider = process.env.USE_MOCK_TRANSFERS_PROVIDER === 'true' ? mockTransfersProvider : amadeusTransfersProvider;

    const { booking, debug } = await provider.book(offer, passengerInfo, paymentId, bookingReference);

    return Response.json({ ok: true, booking, debug, bookingReference });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] transfers/book error:", error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

