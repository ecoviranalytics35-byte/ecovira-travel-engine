export async function POST(request: Request) {
  try {
    // Placeholder: DO NOT implement full signature verification yet
    // TODO: Verify Stripe webhook signature using STRIPE_WEBHOOK_SECRET
    const warning = !process.env.STRIPE_WEBHOOK_SECRET ? "STRIPE_WEBHOOK_SECRET missing - signature not verified" : undefined;

    // For now, just acknowledge receipt
    return Response.json({ ok: true, received: true, warning });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}