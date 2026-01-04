"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingShell } from "@/components/booking/BookingShell";
import { useBookingStore } from "@/stores/bookingStore";
import { EcoviraButton } from "@/components/Button";
import { ArrowLeft, CreditCard, Coins, Lock, Sparkles } from "lucide-react";

// Environment checks (no error banners - graceful handling)
// Client-side check for Stripe (for UI state). Server-side will validate actual keys.
const STRIPE_ENABLED = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && 
     process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_'))
  : true; // Server-side, let API handle validation

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

    setProcessing(true);
    setProcessingMethod("stripe");
    setPayment({ method: "stripe", status: "processing" });

    try {
      const res = await fetch("/api/payments/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(pricing.total * 100), // cents
          currency: pricing.currency.toLowerCase(),
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

      if (!data.ok || !data.url) {
        throw new Error(data.error || "Failed to create payment session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("Stripe payment error:", err);
      setPayment({ method: "stripe", status: "failed" });
      setProcessing(false);
      setProcessingMethod(null);
    }
  };

  const handleCryptoPayment = async () => {
    if (!selectedOffer || passengers.length === 0) {
      return;
    }

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

      if (!data.ok) {
        // If NOWPayments is not configured, show subtle message (no banner)
        if (data.error?.includes("not configured") || data.error?.includes("key missing")) {
          setPayment({ method: "crypto", status: "failed" });
          setProcessing(false);
          setProcessingMethod(null);
          // Show subtle inline message instead of banner
          return;
        }
        throw new Error(data.error || "Failed to create crypto invoice");
      }

      if (!data.url) {
        throw new Error("No payment URL returned");
      }

      // Redirect to crypto payment
      window.location.href = data.url;
    } catch (err) {
      console.error("Crypto payment error:", err);
      setPayment({ method: "crypto", status: "failed" });
      setProcessing(false);
      setProcessingMethod(null);
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

          <div className="max-w-2xl mx-auto space-y-4">
            {/* Stripe Payment - Hero Button */}
            <button
              onClick={handleStripePayment}
              disabled={!STRIPE_ENABLED || processing}
              className="w-full p-10 rounded-2xl border transition-all disabled:opacity-60 disabled:cursor-not-allowed group relative overflow-hidden"
              style={
                STRIPE_ENABLED
                  ? {
                      background: "rgba(10, 12, 14, 0.78)",
                      backdropFilter: "blur(14px)",
                      WebkitBackdropFilter: "blur(14px)",
                      borderColor: "rgba(28, 140, 130, 0.4)",
                      boxShadow: "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(28,140,130,0.25), 0 0 30px rgba(28,140,130,0.2)",
                    }
                  : {
                      background: "rgba(10, 12, 14, 0.78)",
                      backdropFilter: "blur(14px)",
                      WebkitBackdropFilter: "blur(14px)",
                      borderColor: "rgba(255,255,255,0.10)",
                      boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
                    }
              }
              onMouseEnter={(e) => {
                if (STRIPE_ENABLED && !processing) {
                  e.currentTarget.style.borderColor = "rgba(28, 140, 130, 0.6)";
                  e.currentTarget.style.boxShadow = "0 22px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(28,140,130,0.35), 0 0 40px rgba(28,140,130,0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                if (STRIPE_ENABLED) {
                  e.currentTarget.style.borderColor = "rgba(28, 140, 130, 0.4)";
                  e.currentTarget.style.boxShadow = "0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(28,140,130,0.25), 0 0 30px rgba(28,140,130,0.2)";
                }
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                  style={{
                    background: STRIPE_ENABLED ? "rgba(28, 140, 130, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${STRIPE_ENABLED ? "rgba(28, 140, 130, 0.3)" : "rgba(255, 255, 255, 0.10)"}`,
                    boxShadow: STRIPE_ENABLED ? "0 0 30px rgba(28,140,130,0.3)" : "none",
                  }}
                >
                  {STRIPE_ENABLED ? (
                    <CreditCard size={36} className="text-ec-teal" />
                  ) : (
                    <Lock size={36} style={{ color: "rgba(255,255,255,0.62)" }} />
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    Pay by Card
                  </div>
                  <div className="text-base font-medium" style={{ color: "rgba(255,255,255,0.70)" }}>
                    Stripe • Multi-Currency
                  </div>
                </div>
                {!STRIPE_ENABLED && (
                  <div className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Card payments coming shortly
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
