import { getHotelProvider } from "@/lib/providers/hotels";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      offerId, 
      paymentIntentId,
      guestInfo 
    }: { 
      offerId: string; 
      paymentIntentId: string;
      guestInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        specialRequests?: string;
      };
    } = body;

    if (!offerId || !paymentIntentId || !guestInfo) {
      return Response.json(
        { ok: false, error: "Missing required fields: offerId, paymentIntentId, guestInfo" },
        { status: 400 }
      );
    }

    const provider = getHotelProvider();
    const { booking, debug } = await provider.book(offerId, paymentIntentId, guestInfo);

    return Response.json({ ok: true, booking, debug });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[stays/book] Error:", error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}