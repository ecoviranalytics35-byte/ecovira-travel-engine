import { NextResponse } from "next/server";
import { STRIPE_SUPPORTED_CURRENCIES, POPULAR_CURRENCIES } from "@/lib/payments/stripe-currencies";

export const runtime = "nodejs";

/**
 * GET /api/currencies/stripe
 * Returns all Stripe-supported currencies
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    currencies: STRIPE_SUPPORTED_CURRENCIES,
    popular: POPULAR_CURRENCIES,
  });
}

