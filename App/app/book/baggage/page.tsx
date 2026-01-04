"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingShell } from "@/components/booking/BookingShell";
import { useBookingStore } from "@/stores/bookingStore";
import { EcoviraCard } from "@/components/EcoviraCard";
import { EcoviraButton } from "@/components/Button";
import { ArrowLeft, ArrowRight, Luggage, Package } from "lucide-react";

export default function BaggagePage() {
  const router = useRouter();
  const selectedOffer = useBookingStore((state) => state.selectedOffer);
  const stepCompletion = useBookingStore((state) => state.stepCompletion);
  const baggage = useBookingStore((state) => state.baggage);
  const pricing = useBookingStore((state) => state.pricing);
  const setBaggage = useBookingStore((state) => state.setBaggage);
  const completeStep = useBookingStore((state) => state.completeStep);

  // Route guard: redirect if passengers not completed
  useEffect(() => {
    if (!selectedOffer) {
      router.push("/flights");
      return;
    }
    if (!stepCompletion.passengers) {
      router.push("/book/passengers");
    }
  }, [selectedOffer, stepCompletion.passengers, router]);

  const handleContinue = () => {
    completeStep("baggage");
    router.push("/book/seats");
  };

  const handleBack = () => {
    router.push("/book/passengers");
  };

  if (!selectedOffer || !stepCompletion.passengers) {
    return null;
  }

  // Baggage options
  const baggageOptions = [
    { type: "20kg" as const, price: 50, label: "20kg Checked Bag" },
    { type: "25kg" as const, price: 75, label: "25kg Checked Bag" },
    { type: "30kg" as const, price: 100, label: "30kg Checked Bag" },
    { type: "35kg" as const, price: 125, label: "35kg Checked Bag" },
  ];

  const addBag = (type: typeof baggageOptions[number]["type"], price: number) => {
    const existing = baggage.checkedBags.find((b) => b.type === type);
    if (existing) {
      setBaggage({
        ...baggage,
        checkedBags: baggage.checkedBags.map((b) =>
          b.type === type ? { ...b, quantity: b.quantity + 1 } : b
        ),
      });
    } else {
      setBaggage({
        ...baggage,
        checkedBags: [...baggage.checkedBags, { type, quantity: 1, price }],
      });
    }
  };

  const removeBag = (type: typeof baggageOptions[number]["type"]) => {
    setBaggage({
      ...baggage,
      checkedBags: baggage.checkedBags
        .map((b) => (b.type === type ? { ...b, quantity: Math.max(0, b.quantity - 1) } : b))
        .filter((b) => b.quantity > 0),
    });
  };

  return (
    <BookingShell currentStep="baggage">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-3">
            Baggage
          </h1>
          <p className="text-lg text-ec-muted">Step 2 of 6 - Select your baggage options</p>
        </div>

        {/* Included Baggage Card */}
        <div
          className="p-6 rounded-2xl border"
          style={{
            background: 'rgba(10, 12, 14, 0.65)',
            backdropFilter: 'blur(14px)',
            borderColor: 'rgba(28, 140, 130, 0.25)',
            boxShadow: '0 18px 55px rgba(0,0,0,0.45), 0 0 0 1px rgba(28,140,130,0.15)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(28, 140, 130, 0.15)',
                border: '1px solid rgba(28, 140, 130, 0.3)',
                boxShadow: '0 0 20px rgba(28,140,130,0.2)',
              }}
            >
              <Luggage size={28} className="text-ec-teal" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-ec-text mb-1">Included Baggage</h3>
              <p className="text-ec-muted">
                Carry-on baggage is included with your ticket.
              </p>
            </div>
          </div>
        </div>

        {/* Add Checked Baggage - Premium Cards */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-ec-teal to-ec-teal/50"></div>
            <h3 className="text-2xl font-serif font-semibold text-ec-text">Add Checked Baggage</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {baggageOptions.map((option) => {
              const selected = baggage.checkedBags.find((b) => b.type === option.type);
              const quantity = selected?.quantity || 0;

              return (
                <div
                  key={option.type}
                  className="p-6 rounded-2xl border transition-all group"
                  style={{
                    background: quantity > 0 
                      ? 'rgba(28, 140, 130, 0.12)' 
                      : 'rgba(10, 12, 14, 0.65)',
                    backdropFilter: 'blur(14px)',
                    borderColor: quantity > 0 
                      ? 'rgba(28, 140, 130, 0.4)' 
                      : 'rgba(255, 255, 255, 0.12)',
                    boxShadow: quantity > 0
                      ? '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(28,140,130,0.25), 0 0 20px rgba(28,140,130,0.15)'
                      : '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    if (quantity === 0) {
                      e.currentTarget.style.borderColor = 'rgba(28, 140, 130, 0.3)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(28,140,130,0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (quantity === 0) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)';
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Package size={24} className="text-ec-teal" />
                      <div>
                        <div className="text-ec-text font-semibold text-lg mb-1">{option.label}</div>
                        <div className="text-xs text-ec-muted">Per bag</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-ec-teal">
                        {pricing.currency} {option.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeBag(option.type)}
                      disabled={quantity === 0}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        background: quantity > 0 ? 'rgba(28, 140, 130, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${quantity > 0 ? 'rgba(28, 140, 130, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: quantity > 0 ? '#1C8C82' : 'rgba(237, 237, 237, 0.5)',
                      }}
                      onMouseEnter={(e) => {
                        if (quantity > 0) {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.boxShadow = '0 0 15px rgba(28,140,130,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-bold text-ec-text">{quantity}</div>
                      <div className="text-xs text-ec-muted">selected</div>
                    </div>
                    <button
                      onClick={() => addBag(option.type, option.price)}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all"
                      style={{
                        background: 'rgba(28, 140, 130, 0.2)',
                        border: '1px solid rgba(28, 140, 130, 0.4)',
                        color: '#1C8C82',
                        boxShadow: '0 0 12px rgba(28,140,130,0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(28,140,130,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
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

