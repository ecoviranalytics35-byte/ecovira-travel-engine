"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingShell } from "@/components/booking/BookingShell";
import { useBookingStore } from "@/stores/bookingStore";
import { EcoviraCard } from "@/components/EcoviraCard";
import { EcoviraButton } from "@/components/Button";
import { ArrowLeft, ArrowRight, Shield, ShieldCheck } from "lucide-react";

export default function InsurancePage() {
  const router = useRouter();
  const selectedOffer = useBookingStore((state) => state.selectedOffer);
  const stepCompletion = useBookingStore((state) => state.stepCompletion);
  const insurance = useBookingStore((state) => state.insurance);
  const pricing = useBookingStore((state) => state.pricing);
  const setInsurance = useBookingStore((state) => state.setInsurance);
  const passengers = useBookingStore((state) => state.passengers);
  const completeStep = useBookingStore((state) => state.completeStep);

  // Route guard
  useEffect(() => {
    if (!selectedOffer) {
      router.push("/flights");
      return;
    }
    if (!stepCompletion.seats) {
      router.push("/book/seats");
    }
  }, [selectedOffer, stepCompletion.seats, router]);

  const handleContinue = () => {
    completeStep("insurance");
    router.push("/book/checkout");
  };

  const handleBack = () => {
    router.push("/book/seats");
  };

  if (!selectedOffer || !stepCompletion.seats) {
    return null;
  }

  const insurancePlans = [
    {
      plan: "basic" as const,
      label: "Basic Travel Insurance",
      price: 25 * passengers.length,
      features: ["Medical coverage", "Trip cancellation", "Baggage protection"],
    },
    {
      plan: "premium" as const,
      label: "Premium Travel Insurance",
      price: 50 * passengers.length,
      features: [
        "All Basic features",
        "Extended medical coverage",
        "Adventure activities",
        "24/7 support",
      ],
    },
  ];

  return (
    <BookingShell currentStep="insurance">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-white mb-3">
            Travel Insurance
          </h1>
          <p className="text-lg text-ec-muted">Step 4 of 6 — Protect your journey (optional)</p>
        </div>

        <div
          className="p-8 rounded-2xl border"
          style={{
            background: 'rgba(10, 12, 14, 0.78)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderColor: 'rgba(255,255,255,0.10)',
            boxShadow: '0 18px 55px rgba(0,0,0,0.55)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield size={28} className="text-ec-teal" />
            <h3 className="text-2xl font-serif font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>Select Insurance Plan</h3>
          </div>
          <p className="mb-3 font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Protect your journey. Travel insurance is optional but recommended.
          </p>
          <p className="text-xs mb-8" style={{ color: 'rgba(255,255,255,0.62)' }}>
            Insurance provided by third-party providers. Ecovira is not the insurer.
          </p>

          <div className="space-y-4">
            {/* No Insurance Option - Premium Selection Card */}
            <button
              onClick={() => setInsurance(null)}
              className="w-full p-8 rounded-2xl border text-left transition-all group"
              style={
                !insurance
                  ? {
                      background: 'rgba(10, 12, 14, 0.78)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      borderColor: 'rgba(28, 140, 130, 0.4)',
                      boxShadow: '0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(28,140,130,0.3), 0 0 30px rgba(28,140,130,0.2)',
                    }
                  : {
                      background: 'rgba(10, 12, 14, 0.78)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      borderColor: 'rgba(255,255,255,0.10)',
                      boxShadow: '0 18px 55px rgba(0,0,0,0.55)',
                    }
              }
              onMouseEnter={(e) => {
                if (!insurance) return;
                e.currentTarget.style.borderColor = 'rgba(28, 140, 130, 0.3)';
                e.currentTarget.style.boxShadow = '0 22px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(28,140,130,0.25)';
              }}
              onMouseLeave={(e) => {
                if (!insurance) return;
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                e.currentTarget.style.boxShadow = '0 18px 55px rgba(0,0,0,0.55)';
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: !insurance ? 'rgba(28, 140, 130, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${!insurance ? 'rgba(28, 140, 130, 0.3)' : 'rgba(255, 255, 255, 0.10)'}`,
                      boxShadow: !insurance ? '0 0 20px rgba(28,140,130,0.25)' : 'none',
                    }}
                  >
                    <Shield size={24} className={!insurance ? "text-ec-teal" : ""} style={!insurance ? {} : { color: 'rgba(255,255,255,0.62)' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-xl mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>No Insurance</div>
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>Continue without coverage</div>
                  </div>
                </div>
                <div className="px-5 py-2.5 rounded-full text-sm font-semibold"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255,255,255,0.92)',
                  }}
                >
                  Free
                </div>
              </div>
            </button>

            {/* Insurance Plans */}
            {insurancePlans.map((plan) => {
              const isSelected = insurance?.plan === plan.plan;
              
              return (
                <button
                  key={plan.plan}
                  onClick={() =>
                    setInsurance({
                      plan: plan.plan,
                      price: plan.price,
                      provider: "TravelGuard",
                    })
                  }
                  className="w-full p-8 rounded-2xl border text-left transition-all group"
                  style={
                    isSelected
                      ? {
                          background: 'rgba(10, 12, 14, 0.78)',
                          backdropFilter: 'blur(14px)',
                          WebkitBackdropFilter: 'blur(14px)',
                          borderColor: 'rgba(28, 140, 130, 0.4)',
                          boxShadow: '0 18px 55px rgba(0,0,0,0.55), 0 0 0 1px rgba(28,140,130,0.3), 0 0 30px rgba(28,140,130,0.2)',
                        }
                      : {
                          background: 'rgba(10, 12, 14, 0.78)',
                          backdropFilter: 'blur(14px)',
                          WebkitBackdropFilter: 'blur(14px)',
                          borderColor: 'rgba(255,255,255,0.10)',
                          boxShadow: '0 18px 55px rgba(0,0,0,0.55)',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(28, 140, 130, 0.3)';
                      e.currentTarget.style.boxShadow = '0 22px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(28,140,130,0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                      e.currentTarget.style.boxShadow = '0 18px 55px rgba(0,0,0,0.55)';
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-5 flex-1">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isSelected ? 'rgba(28, 140, 130, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isSelected ? 'rgba(28, 140, 130, 0.3)' : 'rgba(255, 255, 255, 0.10)'}`,
                          boxShadow: isSelected ? '0 0 25px rgba(28,140,130,0.25)' : 'none',
                        }}
                      >
                        <ShieldCheck size={28} className={isSelected ? "text-ec-teal" : ""} style={isSelected ? {} : { color: 'rgba(255,255,255,0.62)' }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-xl mb-4" style={{ color: 'rgba(255,255,255,0.92)' }}>{plan.label}</div>
                        <div className="flex flex-wrap gap-2">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="px-4 py-2 rounded-full"
                              style={{
                                background: 'rgba(28, 140, 130, 0.12)',
                                border: '1px solid rgba(28, 140, 130, 0.25)',
                              }}
                            >
                              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="ml-8 text-right">
                      <div className="text-3xl font-bold text-ec-teal mb-2">
                        {pricing.currency} {plan.price.toFixed(2)}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.62)' }}>Total</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-8">
          <EcoviraButton
            variant="secondary"
            onClick={handleBack}
            className="flex items-center gap-2 rounded-full px-8 py-4"
            style={{
              boxShadow: '0 0 20px rgba(255,255,255,0.1)',
            }}
          >
            <ArrowLeft size={18} />
            Back
          </EcoviraButton>
          <EcoviraButton
            variant="primary"
            onClick={handleContinue}
            className="flex items-center gap-2 rounded-full px-8 py-4"
            style={{
              boxShadow: '0 0 25px rgba(28,140,130,0.3), 0 0 0 1px rgba(200,162,77,0.2)',
            }}
          >
            Continue
            <ArrowRight size={18} />
          </EcoviraButton>
        </div>
      </div>
    </BookingShell>
  );
}

