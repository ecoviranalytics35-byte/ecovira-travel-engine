import { amadeusCarsProvider } from "@/lib/transport/cars/amadeus-provider";
import { mockCarsProvider } from "@/lib/transport/cars/provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      offer, // The raw Amadeus car offer
      paymentId,
      driverInfo
    }: {
      offer: any;
      paymentId: string;
      driverInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        licenseNumber?: string;
        licenseCountry?: string;
        age?: number;
      };
    } = body;

    if (!offer || !paymentId || !driverInfo) {
      return Response.json({ ok: false, error: "Missing required booking data" }, { status: 400 });
    }

    const bookingReference = `CAR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Use Amadeus provider for real booking, fallback to mock if needed
    const provider = process.env.USE_MOCK_CARS_PROVIDER === 'true' ? mockCarsProvider : amadeusCarsProvider;

    const { booking, debug } = await provider.book(offer, driverInfo, paymentId, bookingReference);

    return Response.json({ ok: true, booking, debug, bookingReference });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] cars/book error:", error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

