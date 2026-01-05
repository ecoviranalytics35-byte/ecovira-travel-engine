import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Fetch available merchant coins from NOWPayments API
 * Uses /v1/merchant/coins to get merchant-specific enabled coins
 */
export async function GET() {
  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    
    if (!apiKey) {
      // Return default list if API key not configured
      const defaultCoins = [
        { ticker: "btc", name: "Bitcoin" },
        { ticker: "eth", name: "Ethereum" },
        { ticker: "sol", name: "Solana", network: "Solana" },
        { ticker: "usdttrc20", name: "USDT", network: "TRC20" },
        { ticker: "usdterc20", name: "USDT", network: "ERC20" },
        { ticker: "usdtbep20", name: "USDT", network: "BEP20" },
        { ticker: "usdctrc20", name: "USDC", network: "TRC20" },
        { ticker: "usdcerc20", name: "USDC", network: "ERC20" },
        { ticker: "usdcbep20", name: "USDC", network: "BEP20" },
      ];
      return NextResponse.json({
        ok: true,
        coins: defaultCoins,
        source: "default",
      });
    }

    // Fetch merchant coins from NOWPayments API
    // Try /v1/merchant/coins first (merchant-specific enabled coins)
    let response = await fetch("https://api.nowpayments.io/v1/merchant/coins", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    // If merchant/coins doesn't work, fallback to /v1/currencies
    if (!response.ok) {
      console.log("[NOWPayments Coins] merchant/coins failed, trying /v1/currencies");
      response = await fetch("https://api.nowpayments.io/v1/currencies", {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[NOWPayments Coins] API error:", errorData);
      
      // Return default list on API failure
      const defaultCoins = [
        { ticker: "btc", name: "Bitcoin" },
        { ticker: "eth", name: "Ethereum" },
        { ticker: "sol", name: "Solana", network: "Solana" },
        { ticker: "usdttrc20", name: "USDT", network: "TRC20" },
        { ticker: "usdterc20", name: "USDT", network: "ERC20" },
        { ticker: "usdtbep20", name: "USDT", network: "BEP20" },
        { ticker: "usdctrc20", name: "USDC", network: "TRC20" },
        { ticker: "usdcerc20", name: "USDC", network: "ERC20" },
        { ticker: "usdcbep20", name: "USDC", network: "BEP20" },
      ];
      return NextResponse.json({
        ok: true,
        coins: defaultCoins,
        source: "default_fallback",
      });
    }

    const data = await response.json();
    
    // NOWPayments API returns different structures:
    // /v1/merchant/coins might return: { selectedCurrencies: string[] } or { currencies: string[] }
    // /v1/currencies returns: { currencies: string[] } or string[]
    let coinList: string[] = [];
    
    if (Array.isArray(data)) {
      coinList = data;
    } else if (data.selectedCurrencies && Array.isArray(data.selectedCurrencies)) {
      coinList = data.selectedCurrencies;
    } else if (data.currencies && Array.isArray(data.currencies)) {
      coinList = data.currencies;
    } else if (data.coins && Array.isArray(data.coins)) {
      coinList = data.coins;
    }

    // Normalize coin list to lowercase
    coinList = coinList.map((c: string) => c.toLowerCase());

    // Map to normalized format with metadata
    const coinMetadata: Record<string, { name: string; network?: string }> = {
      btc: { name: "Bitcoin" },
      eth: { name: "Ethereum" },
      sol: { name: "Solana", network: "Solana" },
      bnb: { name: "BNB", network: "BNB Chain" },
      xrp: { name: "XRP" },
      ada: { name: "Cardano" },
      doge: { name: "Dogecoin" },
      trx: { name: "Tron" },
      matic: { name: "Polygon", network: "Polygon" },
      pol: { name: "Polygon", network: "Polygon" },
      ltc: { name: "Litecoin" },
      usdttrc20: { name: "USDT", network: "TRC20" },
      usdterc20: { name: "USDT", network: "ERC20" },
      usdtbep20: { name: "USDT", network: "BEP20" },
      usdctrc20: { name: "USDC", network: "TRC20" },
      usdcerc20: { name: "USDC", network: "ERC20" },
      usdcbep20: { name: "USDC", network: "BEP20" },
    };

    const normalizedCoins = coinList.map((ticker: string) => {
      const meta = coinMetadata[ticker] || {
        name: ticker.charAt(0).toUpperCase() + ticker.slice(1).toUpperCase(),
      };
      return {
        ticker,
        name: meta.name,
        network: meta.network,
      };
    });

    // If SOL is not in the list, add a note (but don't add it to the list)
    const hasSol = coinList.includes("sol");
    
    return NextResponse.json({
      ok: true,
      coins: normalizedCoins,
      source: "api",
      hasSol,
      totalCoins: normalizedCoins.length,
    });
  } catch (error: unknown) {
    console.error("[NOWPayments Coins] Error:", error);
    
    // Return default list on error
    const defaultCoins = [
      { ticker: "btc", name: "Bitcoin" },
      { ticker: "eth", name: "Ethereum" },
      { ticker: "sol", name: "Solana", network: "Solana" },
      { ticker: "usdttrc20", name: "USDT", network: "TRC20" },
      { ticker: "usdterc20", name: "USDT", network: "ERC20" },
      { ticker: "usdtbep20", name: "USDT", network: "BEP20" },
      { ticker: "usdctrc20", name: "USDC", network: "TRC20" },
      { ticker: "usdcerc20", name: "USDC", network: "ERC20" },
      { ticker: "usdcbep20", name: "USDC", network: "BEP20" },
    ];
    
    return NextResponse.json({
      ok: true,
      coins: defaultCoins,
      source: "default_error",
    });
  }
}

