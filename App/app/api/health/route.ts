export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    app: process.env.NEXT_PUBLIC_APP_NAME || "Ecovira Air & Stays (v2)",
    hasDuffelKey: !!process.env.DUFFEL_ACCESS_TOKEN,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    primaryFlight: process.env.PRIMARY_FLIGHT_PROVIDER || "duffel",
    primaryHotel: process.env.PRIMARY_HOTEL_PROVIDER || "liteapi",
    timestamp: new Date().toISOString(),
    healthEndpoints: {
      flights: "/api/health/flights",
      hotels: "/api/health/hotels",
    },
  });
}