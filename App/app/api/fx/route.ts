import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/fx?from=AUD&to=USD&amount=100
 * FX conversion endpoint
 * 
 * Note: In production, you should use a real FX API (e.g., exchangerate-api.com, fixer.io)
 * For now, this returns a mock conversion with a static rate
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from")?.toUpperCase();
    const to = searchParams.get("to")?.toUpperCase();
    const amount = parseFloat(searchParams.get("amount") || "0");

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to currency codes are required" },
        { status: 400 }
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    if (from === to) {
      return NextResponse.json({
        ok: true,
        from,
        to,
        amount,
        convertedAmount: amount,
        rate: 1,
        timestamp: new Date().toISOString(),
      });
    }

    // Mock FX rates (in production, fetch from a real FX API)
    // Base: AUD
    const FX_RATES: Record<string, number> = {
      USD: 0.65,
      EUR: 0.60,
      GBP: 0.52,
      JPY: 97.5,
      CAD: 0.88,
      CHF: 0.58,
      CNY: 4.7,
      HKD: 5.08,
      NZD: 1.08,
      SGD: 0.88,
      AED: 2.39,
      TRY: 21.0,
      THB: 23.5,
      INR: 54.2,
      KRW: 865.0,
      MXN: 11.0,
      BRL: 3.25,
      ZAR: 12.1,
      SEK: 6.85,
      NOK: 6.95,
      DKK: 4.48,
      PLN: 2.6,
      CZK: 14.8,
      HUF: 230.0,
      // Add more rates as needed
    };

    // If converting FROM AUD, use direct rate
    // If converting TO AUD, use inverse rate
    let rate: number;
    if (from === "AUD") {
      rate = FX_RATES[to] || 1; // Default to 1 if rate not found
    } else if (to === "AUD") {
      rate = 1 / (FX_RATES[from] || 1);
    } else {
      // Convert from -> AUD -> to
      const fromToAUD = 1 / (FX_RATES[from] || 1);
      const audToTo = FX_RATES[to] || 1;
      rate = fromToAUD * audToTo;
    }

    const convertedAmount = amount * rate;
    const timestamp = new Date().toISOString();

    return NextResponse.json({
      ok: true,
      from,
      to,
      amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimals
      rate: Math.round(rate * 100000) / 100000, // Round to 5 decimals
      timestamp,
      note: "Final amount may vary slightly due to FX rounding.",
    });
  } catch (error: unknown) {
    console.error("[FX API] Error:", error);
    return NextResponse.json(
      { error: "Failed to convert currency" },
      { status: 500 }
    );
  }
}

