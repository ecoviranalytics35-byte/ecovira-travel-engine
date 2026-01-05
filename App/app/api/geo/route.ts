import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/geo
 * Returns geographic information (country) from request headers
 * Used for currency auto-detection
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get country from headers (Vercel, Cloudflare, etc. set this)
    const country = 
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-country-code") ||
      null;

    return NextResponse.json({
      ok: true,
      country: country || null,
    });
  } catch (error: unknown) {
    console.error("[Geo API] Error:", error);
    return NextResponse.json(
      { error: "Failed to get geographic info" },
      { status: 500 }
    );
  }
}

