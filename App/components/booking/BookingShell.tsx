"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBookingStore } from "@/stores/bookingStore";
import { CurrencySelector } from "../CurrencySelector";
import { useCurrency } from "@/contexts/CurrencyContext";

interface BookingShellProps {
  children: ReactNode;
  currentStep: "passengers" | "baggage" | "seats" | "insurance" | "checkout" | "confirmation";
}

const steps = [
  { id: "passengers", label: "Passengers" },
  { id: "baggage", label: "Baggage" },
  { id: "seats", label: "Seats" },
  { id: "insurance", label: "Insurance" },
  { id: "checkout", label: "Checkout" },
  { id: "confirmation", label: "Confirm" },
] as const;

export function BookingShell({ children, currentStep }: BookingShellProps) {
  const { currency, setCurrency } = useCurrency();
  const stepCompletion = useBookingStore((state) => state.stepCompletion);
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0D10] via-[#0F1114] to-[#07080A]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <Image
                src="/brand/ecovira-logo-transparent.png"
                alt="Ecovira"
                width={240}
                height={96}
                priority
                className="h-8 w-auto opacity-90"
                style={{ width: "auto" }}
              />
              <span className="text-xl font-serif font-bold text-ec-text">Ecovira Air</span>
            </Link>

            {/* Stepper */}
            <div className="hidden md:flex items-center gap-2">
              {steps.map((step, index) => {
                const isCompleted = stepCompletion[step.id as keyof typeof stepCompletion];
                const isCurrent = step.id === currentStep;
                const isPast = index < currentStepIndex;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`
                        flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all
                        ${
                          isCurrent
                            ? "bg-ec-teal text-white shadow-[0_0_12px_rgba(28,140,130,0.6)]"
                            : isCompleted || isPast
                            ? "bg-[rgba(28,140,130,0.3)] text-ec-teal border border-ec-teal"
                            : "bg-[rgba(255,255,255,0.1)] text-ec-muted border border-white/20"
                        }
                      `}
                    >
                      {isCompleted && !isCurrent ? "✓" : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-12 h-0.5 mx-1 ${
                          isCompleted || isPast
                            ? "bg-ec-teal"
                            : "bg-white/20"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-4">
              <CurrencySelector value={currency} onChange={setCurrency} showCrypto={false} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Step Content */}
          <div className="lg:col-span-8">{children}</div>

          {/* Right: Booking Summary Sidebar */}
          <div className="lg:col-span-4">
            <BookingSummary />
          </div>
        </div>
      </main>
    </div>
  );
}

function BookingSummary() {
  const selectedOffer = useBookingStore((state) => state.selectedOffer);
  const passengers = useBookingStore((state) => state.passengers);
  const baggage = useBookingStore((state) => state.baggage);
  const seats = useBookingStore((state) => state.seats);
  const insurance = useBookingStore((state) => state.insurance);
  const pricing = useBookingStore((state) => state.pricing);

  if (!selectedOffer) {
    return (
      <div
        className="p-6 rounded-2xl border sticky top-24"
        style={{
          background: 'rgba(10, 12, 14, 0.65)',
          backdropFilter: 'blur(14px)',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          boxShadow: '0 18px 55px rgba(0,0,0,0.45)',
        }}
      >
        <p className="text-ec-muted text-sm">No flight selected</p>
      </div>
    );
  }

  return (
    <div
      className="p-8 rounded-2xl border sticky top-24 space-y-6"
      style={{
        background: 'rgba(10, 12, 14, 0.65)',
        backdropFilter: 'blur(14px)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        boxShadow: '0 18px 55px rgba(0,0,0,0.45), 0 0 0 1px rgba(28,140,130,0.15)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-ec-teal to-ec-teal/50"></div>
        <h3 className="text-2xl font-serif font-semibold text-ec-text">Trip Summary</h3>
      </div>

      {/* Flight Info - Premium Card */}
      <div
        className="p-5 rounded-xl"
        style={{
          background: 'rgba(28, 140, 130, 0.08)',
          border: '1px solid rgba(28, 140, 130, 0.2)',
        }}
      >
        <div className="text-xs text-ec-muted mb-2 font-medium uppercase tracking-wide">Flight</div>
        <div className="text-xl font-bold text-ec-text mb-1">
          {(selectedOffer as { from?: string; to?: string }).from} → {(selectedOffer as { to?: string }).to}
        </div>
        <div className="text-sm text-ec-muted">
          {(selectedOffer as { departDate?: string; provider?: string }).departDate} • {(selectedOffer as { provider?: string }).provider}
        </div>
      </div>

      {/* Passengers */}
      <div className="pb-4 border-b"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="text-sm text-ec-muted mb-2 font-medium">Passengers</div>
        <div className="text-lg font-semibold text-ec-text">{passengers.length || 0} passenger(s)</div>
      </div>

      {/* Add-ons */}
      {(baggage.checkedBags.length > 0 || seats.length > 0 || insurance) && (
        <div className="pb-4 border-b"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="text-sm text-ec-muted mb-3 font-medium">Add-ons</div>
          <div className="space-y-2">
            {baggage.checkedBags.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-ec-text">Baggage</span>
                <span className="text-ec-teal font-semibold">{baggage.checkedBags.length} item(s)</span>
              </div>
            )}
            {seats.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-ec-text">Seats</span>
                <span className="text-ec-teal font-semibold">{seats.length} selected</span>
              </div>
            )}
            {insurance && insurance.plan !== "none" && (
              <div className="flex justify-between items-center">
                <span className="text-ec-text">Insurance</span>
                <span className="text-ec-teal font-semibold capitalize">{insurance.plan}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Price Breakdown - Premium Invoice Style */}
      <div className="pt-4">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-ec-muted">
            <span>Base Fare</span>
            <span className="font-medium">
              {pricing.currency} {pricing.base.toFixed(2)}
            </span>
          </div>
          {pricing.taxes > 0 && (
            <div className="flex justify-between text-ec-muted">
              <span>Taxes & Fees</span>
              <span className="font-medium">
                {pricing.currency} {pricing.taxes.toFixed(2)}
              </span>
            </div>
          )}
          {pricing.addOns > 0 && (
            <div className="flex justify-between text-ec-muted">
              <span>Add-ons</span>
              <span className="font-medium">
                {pricing.currency} {pricing.addOns.toFixed(2)}
              </span>
            </div>
          )}
          {pricing.discounts > 0 && (
            <div className="flex justify-between text-ec-teal">
              <span>Discount</span>
              <span className="font-semibold">-{pricing.currency} {pricing.discounts.toFixed(2)}</span>
            </div>
          )}
          <div
            className="flex justify-between items-center pt-4 mt-4 border-t"
            style={{
              borderColor: 'rgba(28, 140, 130, 0.25)',
            }}
          >
            <span className="text-xl font-semibold text-ec-text">Total</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-ec-teal">
                {pricing.currency} {pricing.total.toFixed(2)}
              </div>
              <div className="text-xs text-ec-muted mt-1">Including all fees</div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Flight Link */}
      <Link
        href="/flights"
        className="block text-center py-3 rounded-xl text-sm font-medium text-ec-teal hover:text-ec-teal/80 transition-all"
        style={{
          background: 'rgba(28, 140, 130, 0.08)',
          border: '1px solid rgba(28, 140, 130, 0.2)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(28, 140, 130, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(28, 140, 130, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(28, 140, 130, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(28, 140, 130, 0.2)';
        }}
      >
        Change flight
      </Link>
    </div>
  );
}

