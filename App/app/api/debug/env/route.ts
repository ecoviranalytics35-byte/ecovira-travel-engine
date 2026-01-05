import { NextResponse } from "next/server";

/**
 * Temporary debug endpoint to check environment variables
 * Returns safe info about env vars (prefixes, lengths, existence)
 */
export async function GET() {
  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  const nowKey = process.env.NOWPAYMENTS_API_KEY || "";
  const nowIpn = process.env.NOWPAYMENTS_IPN_SECRET || "";

  return NextResponse.json({
    cwd: process.cwd(),
    stripe: {
      prefix: stripeKey.slice(0, 10),
      length: stripeKey.length,
      startsWithSk: stripeKey.startsWith("sk_"),
      startsWithPk: stripeKey.startsWith("pk_"),
    },
    nowpayments: {
      hasKey: !!process.env.NOWPAYMENTS_API_KEY,
      keyLength: nowKey.length,
      hasIpn: !!process.env.NOWPAYMENTS_IPN_SECRET,
      ipnLength: nowIpn.length,
    },
    nodeEnv: process.env.NODE_ENV,
  });
}

