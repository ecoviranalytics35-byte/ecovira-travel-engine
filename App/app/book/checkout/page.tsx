"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingShell } from "@/components/booking/BookingShell";
import { useBookingStore } from "@/stores/bookingStore";
import { EcoviraButton } from "@/components/Button";
import { ArrowLeft, CreditCard, Coins, Lock, Sparkles } from "lucide-react";

// Always enable buttons - let server handle validation
// Server-side will validate actual keys and return appropriate errors

// Visual tokens (chatbot-style)
const glassPanelStyle: React.CSSProperties = {
  background: "rgba(10, 12, 14, 0.78)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
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
  const setPayment = useBookingStore((state) => state.setPayment);
  const completeStep = useBookingStore((state) => state.completeStep);
  
  const [processing, setProcessing] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<"stripe" | "crypto" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);

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

  const handleBack = () => {
    router.push("/book/insurance");
  };

  const handleStripePayment = async () => {
    if (!selectedOffer || passengers.length === 0) {
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'book/checkout/page.tsx:76',message:'[handleStripePayment] Fetching API',data:{amount:Math.round(pricing.total * 100),currency:pricing.currency.toLowerCase(),hasOrderId:!!selectedOffer.id,hasEmail:!!passengers[0]?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'payment-debug',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const res = await fetch("/api/payments/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(pricing.total * 100), // cents
          currency: pricing.currency.toLowerCase(),
          orderId: `booking-${selectedOffer.id}`,
          customerEmail: passengers[0]?.email,
          bookingData: {
            offerId: selectedOffer.id,
            passengers,
            baggage,
            seats,
            insurance,
          },
        }),
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

  const handleCryptoPayment = async () => {
    if (!selectedOffer || passengers.length === 0) {
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
    setProcessingMethod("crypto");
    setPayment({ method: "crypto", status: "processing" });

    try {
      const res = await fetch("/api/payments/nowpayments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceAmount: pricing.total,
          priceCurrency: pricing.currency,
          orderId: `booking-${selectedOffer.id}`,
          orderDescription: `Flight booking ${selectedOffer.from} → ${selectedOffer.to}`,
          bookingData: {
            offerId: selectedOffer.id,
            passengers,
            baggage,
            seats,
            insurance,
          },
        }),
      });

      const data = await res.json();

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

      if (!data.url && !data.invoiceUrl) {
        throw new Error("No payment URL returned");
      }

      // Redirect to crypto payment
      window.location.href = data.url || data.invoiceUrl;
    } catch (err) {
      console.error("Crypto payment error:", err);
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
      <div className="space-y-8">
        {/* Header with UI v2 marker */}
        <header className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-white">
            Review & Pay <span className="text-ec-teal text-2xl">— UI v2</span>
          </h1>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.70)" }}>
            Step 5 of 6 — Complete your booking
          </p>
          <div className="px-4 py-2 rounded-full inline-block mt-2" style={{ background: "rgba(28,140,130,0.2)", border: "1px solid rgba(28,140,130,0.4)" }}>
            <span className="text-sm font-bold text-ec-teal">✓ CHECKOUT UI V2 LOADED</span>
          </div>
        </header>

        {/* Trip Summary - Bubble Rows (Not Rectangles) */}
        <section className="p-8 rounded-2xl" style={glassPanelStyle}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-ec-teal to-ec-teal/50"></div>
            <h2 className="text-2xl font-serif font-semibold text-white">Trip Summary</h2>
          </div>
          
          <div className="space-y-3">
            {/* Flight - Bubble Pill */}
            <div className="flex justify-between items-center px-6 py-4 rounded-full"
              style={{
                background: "rgba(28, 140, 130, 0.12)",
                border: "1px solid rgba(28, 140, 130, 0.25)",
                boxShadow: "0 0 20px rgba(28,140,130,0.15)",
              }}
            >
              <span className="font-medium text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>Flight</span>
              <span className="font-semibold text-base text-white">
                {selectedOffer.from} → {selectedOffer.to}
              </span>
            </div>
            
            {/* Passengers - Bubble Pill */}
            <div className="flex justify-between items-center px-6 py-4 rounded-full"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
              }}
            >
              <span className="font-medium text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>Passengers</span>
              <span className="font-semibold text-white">{passengers.length}</span>
            </div>
            
            {/* Baggage - Bubble Pill */}
            {baggage.checkedBags.length > 0 && (
              <div className="flex justify-between items-center px-6 py-4 rounded-full"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                }}
              >
                <span className="font-medium text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>Baggage</span>
                <span className="font-semibold text-white">{baggage.checkedBags.length} checked bag(s)</span>
              </div>
            )}
            
            {/* Seats - Bubble Pill */}
            {seats.length > 0 && (
              <div className="flex justify-between items-center px-6 py-4 rounded-full"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                }}
              >
                <span className="font-medium text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>Seats</span>
                <span className="font-semibold text-white">{seats.length} selected</span>
              </div>
            )}
            
            {/* Insurance - Bubble Pill */}
            {insurance && insurance.plan !== "none" && (
              <div className="flex justify-between items-center px-6 py-4 rounded-full"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                }}
              >
                <span className="font-medium text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>Insurance</span>
                <span className="font-semibold text-white capitalize">{insurance.plan}</span>
              </div>
            )}
          </div>
        </section>

        {/* Payment Hero Section - Two Big Centered Buttons */}
        <section className="space-y-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Sparkles size={24} className="text-ec-teal" />
              <h2 className="text-3xl font-serif font-semibold text-white">Choose Payment Method</h2>
            </div>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.70)" }}>
              Secure payment processing. All transactions are encrypted.
            </p>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="max-w-2xl mx-auto mb-4">
              <div
                className="p-4 rounded-lg border text-center"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "rgba(255, 255, 255, 0.9)",
                }}
              >
                <p className="text-sm font-medium">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="mt-2 text-xs underline opacity-70 hover:opacity-100"
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
              className="w-full p-10 rounded-2xl border transition-all disabled:opacity-60 disabled:cursor-not-allowed group relative overflow-hidden"
              style={{
                background: "rgba(10, 12, 14, 0.78)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderColor: "rgba(28, 140, 130, 0.4)",
                boxShadow: "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(28,140,130,0.25), 0 0 30px rgba(28,140,130,0.2)",
              }}
              onMouseEnter={(e) => {
                if (!processing) {
                  e.currentTarget.style.borderColor = "rgba(28, 140, 130, 0.6)";
                  e.currentTarget.style.boxShadow = "0 22px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(28,140,130,0.35), 0 0 40px rgba(28,140,130,0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(28, 140, 130, 0.4)";
                e.currentTarget.style.boxShadow = "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(28,140,130,0.25), 0 0 30px rgba(28,140,130,0.2)";
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

            {/* Crypto Payment - Hero Button */}
            <button
              onClick={handleCryptoPayment}
              disabled={processing}
              className="w-full p-10 rounded-2xl border transition-all disabled:opacity-60 disabled:cursor-not-allowed group relative overflow-hidden"
              style={{
                background: "rgba(10, 12, 14, 0.78)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderColor: "rgba(200, 162, 77, 0.5)",
                boxShadow: "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,162,77,0.3), 0 0 35px rgba(200,162,77,0.25)",
              }}
              onMouseEnter={(e) => {
                if (!processing) {
                  e.currentTarget.style.borderColor = "rgba(200, 162, 77, 0.7)";
                  e.currentTarget.style.boxShadow = "0 22px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(200,162,77,0.4), 0 0 50px rgba(200,162,77,0.35)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(200, 162, 77, 0.5)";
                e.currentTarget.style.boxShadow = "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,162,77,0.3), 0 0 35px rgba(200,162,77,0.25)";
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover:scale-110 relative"
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
                    Pay by Crypto
                  </div>
                  <div className="text-base font-medium" style={{ color: "rgba(255,255,255,0.70)" }}>
                    NOWPayments • 10% OFF
                  </div>
                </div>
                <div
                  className="px-5 py-2 rounded-full text-sm font-bold mt-2"
                  style={{
                    background: "linear-gradient(135deg, rgba(200,162,77,0.5), rgba(200,162,77,0.3))",
                    border: "1px solid rgba(200,162,77,0.5)",
                    color: "#E3C77A",
                    boxShadow: "0 0 25px rgba(200,162,77,0.4)",
                  }}
                >
                  10% DISCOUNT
                </div>
                {processingMethod === "crypto" && processing && (
                  <div className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Creating payment invoice...
                  </div>
                )}
              </div>
            </button>
          </div>
        </section>

        {/* Total - Premium Highlight Bubble */}
        <section className="max-w-2xl mx-auto">
          <div
            className="p-8 rounded-full border text-center"
            style={{
              background: "linear-gradient(135deg, rgba(28,140,130,0.15), rgba(28,140,130,0.08))",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderColor: "rgba(28, 140, 130, 0.4)",
              boxShadow: "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(28,140,130,0.25), 0 0 40px rgba(28,140,130,0.2)",
            }}
          >
            <div className="space-y-2">
              <div className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>Total</div>
              <div className="text-5xl font-bold text-ec-teal">
                {pricing.currency} {pricing.total.toFixed(2)}
              </div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.62)" }}>Including all fees</div>
            </div>
          </div>
        </section>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-8">
          <EcoviraButton
            variant="secondary"
            onClick={handleBack}
            disabled={processing}
            className="flex items-center gap-2 rounded-full px-8 py-4"
            style={{ boxShadow: "0 0 20px rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft size={18} />
            Back
          </EcoviraButton>
          
          {processing && (
            <div className="flex items-center gap-3">
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
