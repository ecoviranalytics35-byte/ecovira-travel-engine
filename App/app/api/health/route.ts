export async function GET() {
  return Response.json({
    ok: true,
    app: process.env.NEXT_PUBLIC_APP_NAME || "Ecovira Air & Stays (v2)",
    hasDuffelKey: !!process.env.DUFFEL_ACCESS_TOKEN,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    timestamp: new Date().toISOString()
  });
}