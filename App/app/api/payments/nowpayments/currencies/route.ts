import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Fetch supported cryptocurrencies from NOWPayments API
 */
export async function GET() {
  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "NOWPAYMENTS_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Fetch available currencies from NOWPayments API
    const response = await fetch("https://api.nowpayments.io/v1/currencies", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[NOWPayments Currencies] API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch currencies from NOWPayments" },
        { status: response.status || 502 }
      );
    }

    const data = await response.json();
    
    // NOWPayments returns { currencies: string[] } or similar structure
    // Extract the currency list
    const currencies = data.currencies || data || [];
    const currencyList = Array.isArray(currencies) ? currencies : [];

    // Baseline default list (if API fetch fails or returns empty)
    const defaultCurrencies = [
      "btc", "eth", "sol", "usdttrc20", "usdterc20", "usdtbep20",
      "usdctrc20", "usdcerc20", "usdcbep20", "bnb", "xrp", "ada", "doge", "trx", "matic", "ltc"
    ];

    // Merge API currencies with defaults, removing duplicates and converting to lowercase
    const allCurrencies = [...new Set([...currencyList.map((c: string) => c.toLowerCase()), ...defaultCurrencies])];

    return NextResponse.json({
      ok: true,
      currencies: allCurrencies,
      source: currencyList.length > 0 ? "api" : "default",
    });
  } catch (error: unknown) {
    console.error("[NOWPayments Currencies] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch currencies" },
      { status: 500 }
    );
  }
}

