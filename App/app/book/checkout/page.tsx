"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookingShell } from "@/components/booking/BookingShell";
import { useBookingStore } from "@/stores/bookingStore";
import { ArrowLeft, CreditCard, Coins, Lock, Sparkles } from "lucide-react";
import { CurrencySelector } from "@/components/checkout/CurrencySelector";
import { CryptoSelector } from "@/components/checkout/CryptoSelector";
import { getCurrencyFromLocale } from "@/lib/payments/currency-defaults";

// Always enable buttons - let server handle validation
// Server-side will validate actual keys and return appropriate errors

// Visual tokens - reduced opacity, better contrast
const glassPanelStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(16, 185, 129, 0.2)",
  boxShadow: "0 0 40px rgba(28, 140, 130, 0.15)",
};

export default function CheckoutPage() {
  const router = useRouter();
  const selectedOffer = useBookingStore((state) => state.selectedOffer);
  const stepCompletion = useBookingStore((state) => state.stepCompletion);
  const passengers = useBookingStore((state) => state.passengers);
  const baggage = useBookingStore((state) => state.baggage);
  const seats = useBookingStore((state) => state.seats);
  const insurance = useBookingStore((state) => state.insurance);
  const pricing = useBookingStore((state) => state.pricing);
  const currency = useBookingStore((state) => state.currency);
  const setCurrency = useBookingStore((state) => state.setCurrency);
  const setPayment = useBookingStore((state) => state.setPayment);
  const completeStep = useBookingStore((state) => state.completeStep);
  
  const [processing, setProcessing] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<"stripe" | "crypto" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [fxData, setFxData] = useState<{ convertedAmount: number; rate: number; timestamp: string } | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [currencyInitialized, setCurrencyInitialized] = useState(false);

  // Calculate totals: base flight price + extras + fees - discounts
  const totals = useMemo(() => {
    const baseFare = Number(pricing?.base || pricing?.total || 0);
    const seatsTotal = Number(seats?.reduce((sum, s) => sum + (s.price || 0), 0) ?? 0);
    const bagsTotal = Number(
      baggage?.checkedBags?.reduce((sum, b) => sum + (b.price || 0), 0) ?? 0
    );
    const insuranceTotal = Number(insurance?.price ?? 0);
    const serviceFee = baseFare * 0.04; // 4% service fee
    const cryptoDiscount = selectedCrypto ? baseFare * 0.10 : 0; // 10% crypto discount
    
    const subtotal = baseFare + seatsTotal + bagsTotal + insuranceTotal;
    const fees = serviceFee;
    const discounts = cryptoDiscount;
    const total = subtotal + fees - discounts;
    
    return {
      baseFare,
      seatsTotal,
      bagsTotal,
      insuranceTotal,
      serviceFee,
      cryptoDiscount,
      subtotal,
      fees,
      discounts,
      total,
    };
  }, [pricing?.base, pricing?.total, seats, baggage, insurance, selectedCrypto]);

  // Debug: Log render state
  useEffect(() => {
    const bookingId = selectedOffer?.id ? `booking-${selectedOffer.id}` : "none";
    console.log("[CHECKOUT] Render state", {
      selectedCrypto,
      priceAmount: totals.total,
      priceCurrency: pricing?.currency,
      bookingId,
      hasSelectedOffer: !!selectedOffer,
      passengersCount: passengers?.length || 0,
      totals,
    });
  }, [selectedCrypto, totals.total, pricing?.currency, selectedOffer?.id, passengers?.length, totals]);

  // Route guard
  useEffect(() => {
    if (!selectedOffer) {
      router.push("/flights");
      return;
    }
    if (!stepCompletion.insurance) {
      router.push("/book/insurance");
    }
  }, [selectedOffer, stepCompletion.insurance, router]);

  // Auto-default currency (only once, before user manually changes it)
  useEffect(() => {
    if (currencyInitialized) return;
    
    const initializeCurrency = async () => {
      // 1. Check localStorage first
      const storedCurrency = localStorage.getItem("ecovira_currency");
      if (storedCurrency) {
        setCurrency(storedCurrency);
        setCurrencyInitialized(true);
        return;
      }

      // 2. Try geo API (server-side country detection)
      try {
        const geoRes = await fetch("/api/geo");
        const geoData = await geoRes.json();
        if (geoData.ok && geoData.country) {
          const { getCurrencyForCountry } = await import("@/lib/payments/currency-defaults");
          const geoCurrency = getCurrencyForCountry(geoData.country);
          if (geoCurrency && geoCurrency !== currency) {
            setCurrency(geoCurrency);
            localStorage.setItem("ecovira_currency", geoCurrency);
            setCurrencyInitialized(true);
            return;
          }
        }
      } catch (err) {
        console.error("[Checkout] Geo API error:", err);
      }

      // 3. Fallback to browser locale
      const localeCurrency = getCurrencyFromLocale();
      if (localeCurrency && localeCurrency !== currency) {
        setCurrency(localeCurrency);
        localStorage.setItem("ecovira_currency", localeCurrency);
      }
      
      setCurrencyInitialized(true);
    };

    initializeCurrency();
  }, [currency, setCurrency, currencyInitialized]);

  // Fetch FX conversion when currency changes
  useEffect(() => {
    if (!currency || currency === pricing.currency || !pricing.total) return;
    
    const fetchFX = async () => {
      setFxLoading(true);
      try {
        const res = await fetch(`/api/fx?from=${pricing.currency}&to=${currency}&amount=${totals.total}`);
        const data = await res.json();
        if (data.ok) {
          setFxData({
            convertedAmount: data.convertedAmount,
            rate: data.rate,
            timestamp: data.timestamp,
          });
        }
      } catch (err) {
        console.error("[Checkout] FX conversion error:", err);
        setFxData(null);
      } finally {
        setFxLoading(false);
      }
    };

    fetchFX();
  }, [currency, pricing.currency, totals.total]);

  // Payment handlers - must be defined before return statement
  const handleBack = () => {
    router.push("/book/insurance");
  };

  const handleStripePayment = async () => {
    if (!selectedOffer) {
      setErrorMessage("Please select a flight first");
      return;
    }

    if (passengers.length === 0) {
      setErrorMessage("Please add passenger information");
      return;
    }

    // Debounce: prevent rapid clicks
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      return;
    }
    setLastClickTime(now);

    // Prevent if already processing
    if (processing) {
      return;
    }

    setErrorMessage(null);
    setProcessing(true);
    setProcessingMethod("stripe");
    setPayment({ method: "stripe", status: "processing" });

    try {
      // Determine charge amount - use FX converted amount if available, otherwise calculated total
      const baseAmountForFX = totals.total;
      const chargeAmount = fxData && currency !== pricing.currency 
        ? fxData.convertedAmount 
        : baseAmountForFX;
      
      const requestBody: any = {
        chargeCurrency: currency,
        amount: chargeAmount,
        baseAmount: totals.total,
        baseCurrency: pricing.currency,
        orderId: `booking-${selectedOffer.id}`,
        customerEmail: passengers[0]?.email,
        bookingData: {
          offerId: selectedOffer.id,
          passengers,
          baggage,
          seats,
          insurance,
        },
      };

      // Add FX data if conversion was done
      if (fxData && currency !== pricing.currency) {
        requestBody.fxRate = fxData.rate;
        requestBody.fxTimestamp = fxData.timestamp;
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'book/checkout/page.tsx:100',message:'[handleStripePayment] Fetching API',data:{chargeCurrency:currency,chargeAmount:chargeAmount,baseAmount:pricing.total,baseCurrency:pricing.currency,hasFxData:!!fxData,hasOrderId:!!selectedOffer.id},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      const res = await fetch("/api/payments/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'book/checkout/page.tsx:95',message:'[handleStripePayment] API response',data:{status:res.status,ok:res.ok,dataOk:data.ok,hasError:!!data.error,error:data.error,hasUrl:!!data.url,hasCode:!!data.code},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (!data.ok) {
        // Handle specific error codes
        if (data.code === "STRIPE_NOT_CONFIGURED") {
          setErrorMessage("Card payments unavailable.");
          setPayment({ method: "stripe", status: "failed" });
          setProcessing(false);
          setProcessingMethod(null);
          return;
        }
        if (data.code === "STRIPE_INVALID_KEY_FORMAT") {
          setErrorMessage(data.message || "Stripe key format invalid. Please check configuration.");
          setPayment({ method: "stripe", status: "failed" });
          setProcessing(false);
          setProcessingMethod(null);
          return;
        }
        if (data.code === "STRIPE_AUTH_ERROR") {
          setErrorMessage("Stripe key rejected (live/test mismatch or invalid key).");
          setPayment({ method: "stripe", status: "failed" });
          setProcessing(false);
          setProcessingMethod(null);
          return;
        }
        // Use API message or fallback
        const errorMessage = data.message || data.error || "Failed to create payment session";
        setErrorMessage(errorMessage);
        setPayment({ method: "stripe", status: "failed" });
        setProcessing(false);
        setProcessingMethod(null);
        return;
      }

      if (!data.url) {
        throw new Error("No payment URL returned");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("Stripe payment error:", err);
      const message = err instanceof Error ? err.message : "Card payment unavailable. Try again or use crypto.";
      setErrorMessage(message);
      setPayment({ method: "stripe", status: "failed" });
      setProcessing(false);
      setProcessingMethod(null);
      // Do not throw - show error in UI
    }
  };

  const handleCryptoPayment = async (e?: React.MouseEvent) => {
    // Prevent default form submission if any
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const bookingId = selectedOffer?.id ? `booking-${selectedOffer.id}` : "none";
    const priceAmount = totals.total;
    const priceCurrency = pricing?.currency || "AUD";

    // Hard debug log on click
    console.log("[CRYPTO] click", {
      selectedCrypto,
      bookingId,
      priceAmount,
      priceCurrency,
      hasSelectedOffer: !!selectedOffer,
      passengersCount: passengers?.length || 0,
      processing,
    });

    if (!selectedOffer) {
      setErrorMessage("Please select a flight first");
      return;
    }

    if (passengers.length === 0) {
      setErrorMessage("Please add passenger information");
      return;
    }

    // Hard-block if no crypto selected - show premium inline error
    if (!selectedCrypto) {
      console.error("[CRYPTO PAY] No crypto selected - state bug!");
      setErrorMessage("Select a cryptocurrency to continue.");
      return;
    }

    // Normalize coin code: trim whitespace and convert to lowercase
    // NOWPayments expects lowercase codes (e.g., "sol", "btc", "usdttrc20")
    const payCurrency = selectedCrypto.trim().toLowerCase();
    
    console.log("[CRYPTO PAY] Normalized payCurrency:", {
      original: selectedCrypto,
      normalized: payCurrency,
    });

    // Debounce: prevent rapid clicks
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      console.log("[CRYPTO] Debounced");
      return;
    }
    setLastClickTime(now);

    // Prevent if already processing
    if (processing) {
      console.log("[CRYPTO] Already processing");
      return;
    }

    setErrorMessage(null);
    setProcessing(true);
    setProcessingMethod("crypto");
    setPayment({ method: "crypto", status: "processing" });

    try {
      // Construct URLs
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const successUrl = `${siteUrl}/book/success?provider=nowpayments&orderId=${encodeURIComponent(bookingId)}`;
      const cancelUrl = `${siteUrl}/book/checkout?canceled=1`;
      const ipnCallbackUrl = `${siteUrl}/api/payments/nowpayments/ipn`;

      const requestPayload = {
        price_amount: priceAmount,
        price_currency: priceCurrency,
        pay_currency: payCurrency,
        order_id: bookingId,
        order_description: `Flight booking ${selectedOffer.from} → ${selectedOffer.to}`,
        bookingData: {
          offerId: selectedOffer.id,
          passengers,
          baggage,
          seats,
          insurance,
        },
      };

      // Hard debug log with exact payload format
      console.log("[NOWPAYMENTS] create-invoice payload", {
        price_amount: requestPayload.price_amount,
        price_currency: requestPayload.price_currency,
        pay_currency: requestPayload.pay_currency,
        order_id: requestPayload.order_id,
        order_description: requestPayload.order_description,
        fullPayload: requestPayload,
      });

      const res = await fetch("/api/payments/nowpayments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      console.log("[CRYPTO] Response status", res.status, res.ok);

      const data = await res.json();
      console.log("[CRYPTO] Response data", {
        ok: data.ok,
        hasUrl: !!data.url,
        hasInvoiceUrl: !!data.invoiceUrl,
        invoiceId: data.invoiceId,
        invoiceUrl: data.invoiceUrl,
        url: data.url,
        payCurrency: data.payCurrency,
        payAddress: data.payAddress,
        payAmount: data.payAmount,
        error: data.error,
        code: data.code,
        message: data.message,
        fullResponse: data,
      });

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'book/checkout/page.tsx:194',message:'[handleCryptoPayment] API response',data:{status:res.status,ok:res.ok,dataOk:data.ok,hasError:!!data.error,error:data.error,hasUrl:!!data.url,hasInvoiceId:!!data.invoiceId},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (!data.ok) {
        // Handle specific error codes
        if (data.code === "NOWPAYMENTS_NOT_CONFIGURED") {
          setErrorMessage("Crypto payments temporarily unavailable.");
          setPayment({ method: "crypto", status: "failed" });
          setProcessing(false);
          setProcessingMethod(null);
          return;
        }
        if (data.code === "NOWPAYMENTS_UPSTREAM") {
          setErrorMessage("Crypto payment service temporarily unavailable.");
          setPayment({ method: "crypto", status: "failed" });
          setProcessing(false);
          setProcessingMethod(null);
          return;
        }
        // Use API message or fallback
        const errorMessage = data.message || data.error || "Failed to create crypto invoice";
        setErrorMessage(errorMessage);
        setPayment({ method: "crypto", status: "failed" });
        setProcessing(false);
        setProcessingMethod(null);
        return;
      }

      // NOWPayments invoice mode: Invoice URL is sufficient for redirect
      // Payment data (payAddress, payAmount) may not be available immediately
      const invoiceUrl = data.url || data.invoiceUrl;
      if (!invoiceUrl) {
        console.error("[CRYPTO] Missing invoiceUrl in response", data);
        throw new Error("Missing invoice URL in payment response");
      }

      // Store invoice data (payment data is optional - may be available later)
      const invoiceData = {
        invoiceId: data.invoiceId || data.paymentId,
        invoiceUrl: invoiceUrl, // Use EXACT URL from API - redirect user here
        payCurrency: data.payCurrency || selectedCrypto, // Selected crypto (from request or response)
        payAddress: data.payAddress || null, // Optional - available after payment method selection
        payAmount: data.payAmount || null, // Optional - available after payment method selection
        orderId: bookingId,
      };
      
      console.log("[CRYPTO] Invoice created (async mode):", {
        invoiceId: invoiceData.invoiceId,
        invoiceUrl: invoiceData.invoiceUrl,
        payCurrency: invoiceData.payCurrency,
        hasPayAddress: !!invoiceData.payAddress,
        hasPayAmount: !!invoiceData.payAmount,
        note: "Redirecting to NOWPayments invoice - payment data available after selection",
      });
      
      // Store invoice data in sessionStorage (for potential later use)
      if (invoiceData.invoiceId) {
        sessionStorage.setItem(`crypto_payment_${invoiceData.invoiceId}`, JSON.stringify(invoiceData));
      }

      // Redirect directly to NOWPayments invoice URL (async flow)
      // User will select payment method on NOWPayments page, then payment data becomes available
      console.log("[CRYPTO] Redirecting to NOWPayments invoice", invoiceUrl);
      window.location.href = invoiceUrl;
    } catch (err) {
      console.error("[CRYPTO] Error caught", err);
      const message = err instanceof Error ? err.message : "Crypto payment unavailable. Try again or use card checkout.";
      setErrorMessage(message);
      setPayment({ method: "crypto", status: "failed" });
      setProcessing(false);
      setProcessingMethod(null);
      // Do not throw - show error in UI
    }
  };

  if (!selectedOffer || !stepCompletion.insurance) {
    return null;
  }

  return (
    <BookingShell currentStep="checkout">
      
      <div className="space-y-8" style={{ background: "#000000", minHeight: "100vh", padding: "2rem 0" }}>
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-white">
            Review & Pay
          </h1>
          <p className="text-lg text-white/70">
            Step 5 of 6 — Complete your booking
          </p>
        </header>

        {/* Trip Summary */}
        <section 
          className="p-8 rounded-2xl border"
          style={glassPanelStyle}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-ec-teal to-ec-teal/50"></div>
            <h2 className="text-2xl font-serif font-semibold text-white">Trip Summary</h2>
          </div>
          
          <div className="space-y-3">
            {/* Flight */}
            <div className="flex justify-between items-center px-6 py-4 rounded-full border"
              style={glassPanelStyle}
            >
              <span className="font-medium text-sm text-white">Flight</span>
              <span className="font-semibold text-base text-white">
                {selectedOffer.from} → {selectedOffer.to}
              </span>
            </div>
            
            {/* Passengers */}
            <div className="flex justify-between items-center px-6 py-4 rounded-full border"
              style={glassPanelStyle}
            >
              <span className="font-medium text-sm text-white">Passengers</span>
              <span className="font-semibold text-white">{passengers.length}</span>
            </div>
            
            {/* Baggage */}
            {baggage.checkedBags.length > 0 && (
              <div className="flex justify-between items-center px-6 py-4 rounded-full border"
                style={glassPanelStyle}
              >
                <span className="font-medium text-sm text-white">Baggage</span>
                <span className="font-semibold text-white">{baggage.checkedBags.length} checked bag(s)</span>
              </div>
            )}
            
            {/* Seats */}
            {seats.length > 0 && (
              <div className="flex justify-between items-center px-6 py-4 rounded-full border"
                style={glassPanelStyle}
              >
                <span className="font-medium text-sm text-white">Seats</span>
                <span className="font-semibold text-white">{seats.length} selected</span>
              </div>
            )}
            
            {/* Insurance */}
            {insurance && insurance.plan !== "none" && (
              <div className="flex justify-between items-center px-6 py-4 rounded-full border"
                style={glassPanelStyle}
              >
                <span className="font-medium text-sm text-white">Insurance</span>
                <span className="font-semibold text-white capitalize">{insurance.plan}</span>
              </div>
            )}
          </div>
        </section>

        {/* Currency Selector */}
        <section className="max-w-2xl mx-auto">
          <CurrencySelector
            value={currency}
            onChange={(newCurrency) => {
              setCurrency(newCurrency);
              localStorage.setItem("ecovira_currency", newCurrency);
            }}
            disabled={processing}
          />
        </section>

        {/* Payment Options */}
        <section className="max-w-2xl mx-auto space-y-6">
          {/* Error Message Display */}
          {errorMessage && (
            <div className="max-w-2xl mx-auto mb-4">
              <div
                className="p-4 rounded-lg border text-center animate-in fade-in slide-in-from-top-2"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  color: "rgba(255, 255, 255, 0.95)",
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.2)",
                }}
              >
                <p className="text-sm font-semibold mb-2">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-xs underline opacity-70 hover:opacity-100 transition-opacity"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="max-w-2xl mx-auto space-y-4">
            {/* Stripe Payment - Hero Button */}
            <button
              onClick={handleStripePayment}
              disabled={processing}
              className="w-full p-10 rounded-full border transition-all disabled:opacity-60 disabled:cursor-not-allowed group relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(28,140,130,0.25), rgba(28,140,130,0.15))",
                borderColor: "rgba(16, 185, 129, 0.4)",
                boxShadow: "0 0 40px rgba(28, 140, 130, 0.2)",
                color: "#FFFFFF",
              }}
              onMouseEnter={(e) => {
                if (!processing) {
                  e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 50px rgba(28, 140, 130, 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.4)";
                e.currentTarget.style.boxShadow = "0 0 40px rgba(28, 140, 130, 0.2)";
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                  style={{
                    background: "rgba(28, 140, 130, 0.15)",
                    border: "1px solid rgba(28, 140, 130, 0.3)",
                    boxShadow: "0 0 30px rgba(28,140,130,0.3)",
                  }}
                >
                  <CreditCard size={36} className="text-ec-teal" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    Pay by Card
                  </div>
                  <div className="text-base font-medium" style={{ color: "rgba(255,255,255,0.70)" }}>
                    Stripe • Multi-Currency
                  </div>
                </div>
                {processingMethod === "stripe" && processing && (
                  <div className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Creating payment session...
                  </div>
                )}
              </div>
            </button>

            {/* Crypto Payment - Hero Section with Selector */}
            <div
              className="w-full p-8 rounded-2xl border relative"
              style={{
                ...glassPanelStyle,
                borderColor: "rgba(200, 162, 77, 0.3)",
                pointerEvents: "auto",
                color: "#FFFFFF",
              }}
            >
              <div className="flex flex-col items-center gap-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: "rgba(200, 162, 77, 0.15)",
                    border: "1px solid rgba(200, 162, 77, 0.3)",
                    boxShadow: "0 0 30px rgba(200,162,77,0.3)",
                  }}
                >
                  <Coins size={36} className="text-ec-gold" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    Pay with Crypto
                  </div>
                  <div className="text-base font-medium" style={{ color: "rgba(255,255,255,0.70)" }}>
                    NOWPayments • Select your cryptocurrency
                  </div>
                </div>

                {/* Crypto Selector */}
                <div className="w-full max-w-md">
                  <CryptoSelector
                    value={selectedCrypto}
                    onChange={setSelectedCrypto}
                    disabled={processing}
                  />
                </div>

                <div
                  className="px-5 py-2 rounded-full text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(200,162,77,0.5), rgba(200,162,77,0.3))",
                    border: "1px solid rgba(200,162,77,0.5)",
                    color: "#E3C77A",
                    boxShadow: "0 0 25px rgba(200,162,77,0.4)",
                  }}
                >
                  10% DISCOUNT
                </div>

                {/* Pay Button - Large Hero Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const bookingId = selectedOffer?.id ? `booking-${selectedOffer.id}` : "none";
                    const priceAmount = totals.total;
                    const priceCurrency = pricing?.currency || "AUD";
                    
                    // Hard debug log at button click
                    console.log("[CRYPTO PAY] click", {
                      selectedCrypto,
                      priceAmount,
                      priceCurrency,
                      bookingId,
                      hasSelectedOffer: !!selectedOffer,
                      passengersCount: passengers?.length || 0,
                    });
                    
                    handleCryptoPayment(e);
                  }}
                  disabled={!selectedCrypto || processing}
                  className="w-full p-10 rounded-full border font-semibold text-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed group relative overflow-hidden"
                  style={{
                    background: selectedCrypto && !processing
                      ? "linear-gradient(135deg, rgba(200,162,77,0.3), rgba(200,162,77,0.2))"
                      : "rgba(255,255,255,0.05)",
                    borderColor: selectedCrypto && !processing
                      ? "rgba(200, 162, 77, 0.4)"
                      : "rgba(255,255,255,0.1)",
                    color: selectedCrypto && !processing ? "#E3C77A" : "rgba(255,255,255,0.6)",
                    boxShadow: selectedCrypto && !processing
                      ? "0 0 40px rgba(200,162,77,0.25)"
                      : "0 0 20px rgba(0,0,0,0.1)",
                    cursor: processing || !selectedCrypto ? "not-allowed" : "pointer",
                    pointerEvents: "auto",
                    position: "relative",
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => {
                    if (!processing && selectedCrypto) {
                      e.currentTarget.style.borderColor = "rgba(200, 162, 77, 0.5)";
                      e.currentTarget.style.boxShadow = "0 0 50px rgba(200,162,77,0.3)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    if (selectedCrypto && !processing) {
                      e.currentTarget.style.borderColor = "rgba(200, 162, 77, 0.4)";
                      e.currentTarget.style.boxShadow = "0 0 40px rgba(200,162,77,0.25)";
                    }
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    {processingMethod === "crypto" && processing ? (
                      <>
                        <div className="w-8 h-8 border-2 border-ec-gold border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-lg font-bold text-ec-gold">Creating payment invoice...</span>
                      </>
                    ) : selectedCrypto ? (
                      <span className="text-2xl font-bold text-ec-gold">Continue to Payment</span>
                    ) : (
                      <span className="text-xl font-semibold text-white/60">Select a cryptocurrency first</span>
                    )}
                  </div>
                </button>

                {/* Premium inline error if no crypto selected */}
                {!selectedCrypto && !processing && (
                  <div className="mt-3 p-4 rounded-full border text-center" style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    boxShadow: "0 0 20px rgba(239, 68, 68, 0.2)",
                  }}>
                    <p className="text-sm font-semibold text-white">
                      Select a cryptocurrency to continue.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Total - Premium Highlight Bubble with Breakdown */}
        <section className="max-w-2xl mx-auto">
          <div
            className="p-8 rounded-2xl border"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderColor: "rgba(16, 185, 129, 0.3)",
              boxShadow: "0 0 40px rgba(28, 140, 130, 0.2)",
            }}
          >
            <div className="space-y-4">
              {/* Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/90">
                  <span>Base Fare</span>
                  <span>{currency} {totals.baseFare.toFixed(2)}</span>
                </div>
                {totals.seatsTotal > 0 && (
                  <div className="flex justify-between text-white/90">
                    <span>Seats</span>
                    <span>{currency} {totals.seatsTotal.toFixed(2)}</span>
                  </div>
                )}
                {totals.bagsTotal > 0 && (
                  <div className="flex justify-between text-white/90">
                    <span>Baggage</span>
                    <span>{currency} {totals.bagsTotal.toFixed(2)}</span>
                  </div>
                )}
                {totals.insuranceTotal > 0 && (
                  <div className="flex justify-between text-white/90">
                    <span>Insurance</span>
                    <span>{currency} {totals.insuranceTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/90">
                  <span>Service Fee</span>
                  <span>{currency} {totals.serviceFee.toFixed(2)}</span>
                </div>
                {totals.cryptoDiscount > 0 && (
                  <div className="flex justify-between text-ec-gold">
                    <span>Crypto Discount (10%)</span>
                    <span>-{currency} {totals.cryptoDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-white/20 pt-4">
                <div className="text-lg font-semibold text-white mb-2">Total</div>
                <div className="text-5xl font-bold text-ec-teal">
                  {currency} {(fxData && currency !== pricing.currency ? fxData.convertedAmount : totals.total).toFixed(2)}
                </div>
                {currency !== pricing.currency && fxData && (
                  <div className="text-sm text-white/70 mt-1">
                    ≈ {pricing.currency} {totals.total.toFixed(2)}
                  </div>
                )}
                <div className="text-sm text-white/70 mt-1">Including all fees and discounts</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={processing}
            className="flex items-center gap-2 rounded-full px-8 py-4 border font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={glassPanelStyle}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          
          {processing && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-full border"
              style={glassPanelStyle}
            >
              <div className="w-6 h-6 border-2 border-ec-teal border-t-transparent rounded-full animate-spin"></div>
              <span className="text-base font-medium text-white">
                Processing {processingMethod === "stripe" ? "card" : "crypto"} payment...
              </span>
            </div>
          )}
        </div>
      </div>
    </BookingShell>
  );
}
