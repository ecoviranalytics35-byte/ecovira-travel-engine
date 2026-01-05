"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Check, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";
import { BookingShell } from "@/components/booking/BookingShell";

// Convert ETH amount to wei (1 ETH = 10^18 wei)
function toWei(ethAmount: string): string {
  try {
    const amount = parseFloat(ethAmount);
    if (isNaN(amount)) return "0";
    // Convert to wei: multiply by 10^18
    const wei = BigInt(Math.floor(amount * 1e18));
    return wei.toString();
  } catch {
    return "0";
  }
}

// Build proper crypto payment URI based on currency type
// MUST use protocol prefix (bitcoin:, ethereum:, solana:) for wallet compatibility
function buildCryptoURI(currency: string, address: string, amount: string): string {
  if (!address || !amount) {
    console.error("[buildCryptoURI] Missing address or amount", { address, amount, currency });
    return address || ""; // Fallback to address only if amount missing
  }

  const normalizedCurrency = currency.toLowerCase().trim();
  
  switch (normalizedCurrency) {
    case "btc":
    case "bitcoin":
      // Bitcoin: bitcoin:ADDRESS?amount=AMOUNT
      return `bitcoin:${address}?amount=${amount}`;
    
    case "eth":
    case "ethereum":
      // Ethereum: ethereum:ADDRESS?value=AMOUNT_IN_WEI
      const weiAmount = toWei(amount);
      return `ethereum:${address}?value=${weiAmount}`;
    
    case "sol":
    case "solana":
      // Solana: solana:ADDRESS?amount=AMOUNT
      return `solana:${address}?amount=${amount}`;
    
    case "usdttrc20":
    case "usdt-trc20":
    case "usdttrc":
      // TRC20 USDT on Tron network: tron:ADDRESS?amount=AMOUNT
      return `tron:${address}?amount=${amount}`;
    
    case "usdterc20":
    case "usdt-erc20":
    case "usdterc":
      // ERC20 USDT on Ethereum network: ethereum:ADDRESS?value=AMOUNT_IN_WEI
      const weiAmountUSDT = toWei(amount);
      return `ethereum:${address}?value=${weiAmountUSDT}`;
    
    case "usdcerc20":
    case "usdc-erc20":
    case "usdcerc":
      // ERC20 USDC on Ethereum network: ethereum:ADDRESS?value=AMOUNT_IN_WEI
      const weiAmountUSDC = toWei(amount);
      return `ethereum:${address}?value=${weiAmountUSDC}`;
    
    default:
      // Fallback: try to detect if it's a known format
      if (normalizedCurrency.includes("erc20") || normalizedCurrency.includes("erc")) {
        const weiAmount = toWei(amount);
        return `ethereum:${address}?value=${weiAmount}`;
      }
      if (normalizedCurrency.includes("trc20") || normalizedCurrency.includes("trc")) {
        return `tron:${address}?amount=${amount}`;
      }
      // For unknown currencies, still use address with amount (some wallets may accept this)
      return `${address}?amount=${amount}`;
  }
}

// Generate QR code URL with proper crypto payment URI
// MUST encode a valid crypto payment URI that wallets can recognize
// Protocol prefix (bitcoin:, ethereum:, solana:) is MANDATORY for wallet compatibility
function generateQRCodeUrl(address: string, amount: string, currency: string): string {
  if (!address || !amount || !currency) {
    console.error("[generateQRCodeUrl] Missing required data", { address, amount, currency });
    return "";
  }

  // Build proper crypto URI with protocol prefix
  const paymentURI = buildCryptoURI(currency, address, amount);
  
  // Validate URI format - MUST have protocol prefix for wallet compatibility
  if (!paymentURI) {
    console.error("[generateQRCodeUrl] Failed to build payment URI", { address, amount, currency });
    return "";
  }

  const hasValidProtocol = paymentURI.startsWith("bitcoin:") || 
                          paymentURI.startsWith("ethereum:") || 
                          paymentURI.startsWith("solana:") || 
                          paymentURI.startsWith("tron:");
  
  if (!hasValidProtocol) {
    console.warn("[generateQRCodeUrl] URI may not be wallet-compatible (missing protocol prefix):", {
      currency,
      paymentURI: paymentURI.substring(0, 100),
    });
  }
  
  // Debug log the payment URI
  console.log("[CryptoPay] Generated payment URI:", {
    currency,
    address: address.substring(0, 20) + "...",
    amount,
    paymentURI: paymentURI.substring(0, 100),
    hasProtocol: hasValidProtocol,
    protocol: paymentURI.split(":")[0],
  });
  
  // Generate QR code from the payment URI
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(paymentURI)}`;
}

export default function CryptoPayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");

  const [paymentData, setPaymentData] = useState<{
    payCurrency: string;
    payAddress: string;
    payAmount: string;
    invoiceUrl: string;
    orderId: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const [polling, setPolling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "confirmed" | "failed">("pending");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setError("Payment ID is required");
      setLoading(false);
      return;
    }

    const loadPaymentData = async () => {
      // Try sessionStorage first
      const stored = sessionStorage.getItem(`crypto_payment_${paymentId}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          
          // Invoice mode: invoiceUrl is required, payment data is optional
          if (data.invoiceUrl) {
            console.log("[CryptoPay] Loaded from sessionStorage:", {
              invoiceId: data.invoiceId,
              invoiceUrl: data.invoiceUrl,
              payCurrency: data.payCurrency,
              hasPayAddress: !!data.payAddress,
              hasPayAmount: !!data.payAmount,
              note: "Payment data may be available after payment method selection",
            });
            
            setPaymentData(data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("[CryptoPay] Failed to parse sessionStorage:", e);
        }
      }

      // Fallback: Fetch from backend API
      try {
        console.log("[CryptoPay] Fetching payment data from API for paymentId:", paymentId);
        const res = await fetch(`/api/payments/nowpayments/status?paymentId=${paymentId}`);
        const apiData = await res.json();

        if (apiData.ok) {
          // Invoice mode: invoiceUrl is required, payment data is optional
          const invoiceUrl = apiData.invoiceUrl || `https://nowpayments.io/payment/?iid=${paymentId}`;
          
          const paymentData = {
            invoiceId: paymentId,
            invoiceUrl: invoiceUrl,
            payCurrency: apiData.payCurrency || null, // Optional - available after payment method selection
            payAddress: apiData.payAddress || null, // Optional - available after payment method selection
            payAmount: apiData.payAmount || null, // Optional - available after payment method selection
            orderId: apiData.orderId || "",
          };

          console.log("[CryptoPay] Loaded from API (async mode):", {
            invoiceId: paymentData.invoiceId,
            invoiceUrl: paymentData.invoiceUrl,
            payCurrency: paymentData.payCurrency,
            hasPayAddress: !!paymentData.payAddress,
            hasPayAmount: !!paymentData.payAmount,
            note: "Payment data may be available after payment method selection on NOWPayments page",
          });

          // Store in sessionStorage for future use
          sessionStorage.setItem(`crypto_payment_${paymentId}`, JSON.stringify(paymentData));
          
          setPaymentData(paymentData);
          setLoading(false);
        } else {
          console.error("[CryptoPay] API response error:", apiData);
          setError("Payment data not found. Please return to checkout.");
          setLoading(false);
        }
      } catch (err) {
        console.error("[CryptoPay] Failed to fetch payment data:", err);
        setError("Failed to load payment data. Please return to checkout.");
        setLoading(false);
      }
    };

    loadPaymentData();
  }, [paymentId]);

  const copyToClipboard = async (text: string, type: "address" | "amount") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const checkPaymentStatus = async (): Promise<boolean> => {
    if (!paymentId) return false;

    try {
      const res = await fetch(`/api/payments/nowpayments/status?paymentId=${paymentId}`);
      const data = await res.json();

      if (data.ok && data.status === "confirmed") {
        setPaymentStatus("confirmed");
        setPolling(false);
        // Stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        // Redirect to success page after 2 seconds
        setTimeout(() => {
          router.push(`/book/success?provider=nowpayments&orderId=${paymentData?.orderId || ""}`);
        }, 2000);
        return true;
      } else if (data.status === "failed") {
        setPaymentStatus("failed");
        setPolling(false);
        // Stop polling on failure
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Status check failed:", err);
      return false;
    }
  };

  const startPolling = () => {
    if (!paymentId || polling) return;

    setPolling(true);
    pollStartTimeRef.current = Date.now();
    
    // Initial check
    checkPaymentStatus();

    // Poll every 5 seconds
    const interval = setInterval(async () => {
      if (!pollStartTimeRef.current) return;
      
      const elapsed = Date.now() - pollStartTimeRef.current;
      const maxDuration = 2 * 60 * 1000; // 2 minutes

      if (elapsed >= maxDuration) {
        // Stop polling after 2 minutes
        clearInterval(interval);
        pollIntervalRef.current = null;
        setPolling(false);
        return;
      }

      const confirmed = await checkPaymentStatus();
      if (confirmed) {
        clearInterval(interval);
        pollIntervalRef.current = null;
      }
    }, 5000); // Poll every 5 seconds

    pollIntervalRef.current = interval;
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const getCoinName = (ticker: string): string => {
    const names: Record<string, string> = {
      btc: "Bitcoin",
      eth: "Ethereum",
      sol: "Solana",
      usdttrc20: "USDT (TRC20)",
      usdterc20: "USDT (ERC20)",
      usdcerc20: "USDC (ERC20)",
    };
    return names[ticker.toLowerCase()] || ticker.toUpperCase();
  };

  if (loading) {
    return (
      <BookingShell currentStep="checkout">
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-ec-teal" />
        </div>
      </BookingShell>
    );
  }

  if (error || !paymentData) {
    return (
      <BookingShell currentStep="checkout">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-2xl border text-center"
            style={{
              background: "rgba(0, 0, 0, 0.9)",
              borderColor: "rgba(239, 68, 68, 0.4)",
              boxShadow: "0 0 40px rgba(239, 68, 68, 0.2)",
            }}
          >
            <p className="text-white text-lg mb-4">{error || "Payment data not found"}</p>
            <button
              onClick={() => router.push("/book/checkout")}
              className="px-6 py-3 rounded-full border font-semibold text-white transition-all"
              style={{
                background: "rgba(28, 140, 130, 0.15)",
                borderColor: "rgba(28, 140, 130, 0.4)",
              }}
            >
              Return to Checkout
            </button>
          </div>
        </div>
      </BookingShell>
    );
  }


  return (
    <BookingShell currentStep="checkout">
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#000000" }}>
        <div className="w-full max-w-[520px]">
          {/* Single Glass Panel */}
          <div
            className="p-10 rounded-2xl border"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderColor: "rgba(16, 185, 129, 0.2)",
              boxShadow: "0 0 40px rgba(28, 140, 130, 0.15)",
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-lg font-semibold text-white/90 mb-1">Ecovira Air – Secure Crypto Payment</h1>
              <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent my-4"></div>
            </div>

            {/* Network Label */}
            <div className="text-center mb-4">
              <div className="text-sm text-white/60 font-medium">
                {paymentData.payCurrency 
                  ? `${paymentData.payCurrency.toUpperCase()} • ${getCoinName(paymentData.payCurrency)}`
                  : "Select payment method on NOWPayments invoice"}
              </div>
            </div>

            {/* Amount - Primary */}
            {paymentData.payAmount && paymentData.payCurrency ? (
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-white mb-1">
                  {paymentData.payAmount} {paymentData.payCurrency.toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="text-center mb-8">
                <div className="text-lg text-white/70 mb-1">
                  Amount will be shown after payment method selection
                </div>
              </div>
            )}

            {/* QR Code - Only show when payment data is available */}
            {/* In invoice mode, payment data may not be available until user selects payment method on NOWPayments page */}
            {paymentData.payAddress && paymentData.payAmount && paymentData.payCurrency ? (
              <div className="flex justify-center mb-8">
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 0 30px rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <img
                    src={generateQRCodeUrl(paymentData.payAddress, paymentData.payAmount, paymentData.payCurrency)}
                    alt={`${paymentData.payCurrency.toUpperCase()} Payment QR Code`}
                    className="w-[260px] h-[260px]"
                    onError={(e) => {
                      console.error("[CryptoPay] QR code generation failed", {
                        address: paymentData.payAddress,
                        amount: paymentData.payAmount,
                        currency: paymentData.payCurrency,
                      });
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-8">
                <div className="text-center p-6 rounded-2xl" style={glassPanelStyle}>
                  <p className="text-white/70 text-sm mb-2">
                    Payment details will be available after selecting payment method
                  </p>
                  <p className="text-white/50 text-xs">
                    Click "Open NOWPayments Invoice" to proceed
                  </p>
                </div>
              </div>
            )}

            {/* Wallet Address - Only show if available */}
            {paymentData.payAddress ? (
              <div className="mb-4">
                <label className="block text-white/70 text-xs mb-2 font-medium">Wallet Address</label>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 p-3 rounded-xl border font-mono text-xs break-all text-white"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {paymentData.payAddress}
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentData.payAddress, "address")}
                    className="p-3 rounded-xl border transition-all flex-shrink-0"
                    style={{
                      background: copied === "address" ? "rgba(28, 140, 130, 0.2)" : "rgba(255, 255, 255, 0.05)",
                      borderColor: copied === "address" ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {copied === "address" ? (
                      <Check size={18} className="text-ec-teal" />
                    ) : (
                      <Copy size={18} className="text-white" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Amount - Only show if available */}
            {paymentData.payAmount && paymentData.payCurrency ? (
              <div className="mb-6">
                <label className="block text-white/70 text-xs mb-2 font-medium">Amount</label>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 p-3 rounded-xl border font-mono text-sm text-white"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {paymentData.payAmount} {paymentData.payCurrency.toUpperCase()}
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentData.payAmount, "amount")}
                    className="p-3 rounded-xl border transition-all flex-shrink-0"
                    style={{
                      background: copied === "amount" ? "rgba(28, 140, 130, 0.2)" : "rgba(255, 255, 255, 0.05)",
                      borderColor: copied === "amount" ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {copied === "amount" ? (
                      <Check size={18} className="text-ec-teal" />
                    ) : (
                      <Copy size={18} className="text-white" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="space-y-3 mb-4">
              <button
                onClick={startPolling}
                disabled={polling || paymentStatus === "confirmed"}
                className="w-full p-4 rounded-xl border font-semibold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: paymentStatus === "confirmed"
                    ? "rgba(28, 140, 130, 0.3)"
                    : "linear-gradient(135deg, rgba(28,140,130,0.3), rgba(28,140,130,0.2))",
                  borderColor: paymentStatus === "confirmed" 
                    ? "rgba(16, 185, 129, 0.5)"
                    : "rgba(16, 185, 129, 0.4)",
                  color: "#FFFFFF",
                  boxShadow: "0 0 30px rgba(28, 140, 130, 0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!polling && paymentStatus !== "confirmed") {
                    e.currentTarget.style.boxShadow = "0 0 40px rgba(28, 140, 130, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(28, 140, 130, 0.2)";
                }}
              >
                {polling ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking payment... (auto-polling every 5s)
                  </span>
                ) : paymentStatus === "confirmed" ? (
                  "Payment Confirmed! Redirecting..."
                ) : (
                  "I've Paid – Check Status"
                )}
              </button>

              {paymentData.invoiceUrl && (
                <a
                  href={paymentData.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border font-semibold text-white/80 transition-all"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(200, 162, 77, 0.3)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(200, 162, 77, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <ExternalLink size={18} />
                  Open NOWPayments (Backup)
                </a>
              )}
            </div>

            {/* Status Message */}
            {paymentStatus === "failed" && (
              <div className="mb-4 p-4 rounded-xl border text-center"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                }}
              >
                <p className="text-white text-sm">Payment verification failed. Please try again.</p>
              </div>
            )}

            {/* Helper Text - Only show if payment data is available */}
            {paymentData.payAmount && paymentData.payCurrency && paymentData.payAddress ? (
              <div className="text-center text-white/40 text-xs mt-6">
                <p>Send exactly {paymentData.payAmount} {paymentData.payCurrency.toUpperCase()} to the address above.</p>
                <p className="mt-1">Payment will be confirmed automatically once received.</p>
              </div>
            ) : (
              <div className="text-center text-white/40 text-xs mt-6">
                <p>Complete payment on the NOWPayments invoice page.</p>
                <p className="mt-1">Payment will be confirmed automatically once received.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BookingShell>
  );
}

