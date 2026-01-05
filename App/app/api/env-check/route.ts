import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Environment variable check endpoint
 * Returns presence, prefix, and length for critical env vars
 * DO NOT return full keys - only prefix and length for verification
 */
export async function GET() {
  const envVars = [
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NOWPAYMENTS_API_KEY",
    "NOWPAYMENTS_IPN_SECRET",
    "AMADEUS_API_KEY",
    "AMADEUS_API_SECRET",
  ];

  const result: Record<string, {
    exists: boolean;
    prefix?: string;
    length: number;
  }> = {};

  for (const varName of envVars) {
    const value = process.env[varName] || "";
    const exists = varName in process.env && value.length > 0;
    
    result[varName] = {
      exists,
      length: value.length,
      // Only show prefix for non-empty values, max 10 chars
      prefix: value.length > 0 ? value.slice(0, Math.min(10, value.length)) : undefined,
    };
  }

  // Additional diagnostics
  const diagnostics = {
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    hasNextPublicSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    totalEnvVarsCount: Object.keys(process.env).length,
    // Show sample of env var names that contain key patterns
    stripeRelated: Object.keys(process.env).filter(k => k.includes("STRIPE") || k.includes("stripe")),
    nowpaymentsRelated: Object.keys(process.env).filter(k => k.includes("NOW") || k.includes("now")),
    amadeusRelated: Object.keys(process.env).filter(k => k.includes("AMADEUS") || k.includes("amadeus")),
  };

  return NextResponse.json({
    ok: true,
    env: result,
    diagnostics,
  });
}

