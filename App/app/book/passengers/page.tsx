"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingShell } from "@/components/booking/BookingShell";
import { useBookingStore, type Passenger } from "@/stores/bookingStore";
import { EcoviraCard } from "@/components/EcoviraCard";
import { EcoviraButton } from "@/components/Button";
import { Input } from "@/components/Input";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";

export default function PassengersPage() {
  const router = useRouter();
  const selectedOffer = useBookingStore((state) => state.selectedOffer);
  const passengers = useBookingStore((state) => state.passengers);
  const addPassenger = useBookingStore((state) => state.addPassenger);
  const updatePassenger = useBookingStore((state) => state.updatePassenger);
  const removePassenger = useBookingStore((state) => state.removePassenger);
  const completeStep = useBookingStore((state) => state.completeStep);
  const setCurrency = useBookingStore((state) => state.setCurrency);

  // Route guard: redirect if no flight selected (with delay to allow store hydration)
  useEffect(() => {
    console.log("[PassengersPage] Route guard check", { selectedOffer: !!selectedOffer });
    const timer = setTimeout(() => {
      if (!selectedOffer) {
        console.warn("[PassengersPage] No selected offer, redirecting to /flights");
        router.push("/flights");
      }
    }, 500); // Give store time to hydrate from sessionStorage
    
    return () => clearTimeout(timer);
  }, [selectedOffer, router]);

  // Initialize with one passenger if empty
  useEffect(() => {
    if (passengers.length === 0 && selectedOffer) {
      const basePrice = typeof selectedOffer.price === "string"
        ? parseFloat(selectedOffer.price.replace(/[^0-9.]/g, ""))
        : typeof selectedOffer.price === "number"
        ? selectedOffer.price
        : 0;
      const passengerCount = Math.max(1, Math.floor(basePrice / 100) || 1); // Estimate from price or default to 1
      
      for (let i = 0; i < passengerCount; i++) {
        addPassenger({
          id: `passenger-${Date.now()}-${i}`,
          title: "",
          firstName: "",
          lastName: "",
          dob: "",
          gender: "male",
          nationality: "",
          email: "",
          phone: "",
          confirmed: false,
        });
      }
    }
  }, [passengers.length, selectedOffer, addPassenger]);

  const handleContinue = () => {
    // Validate all passengers
    const allValid = passengers.every(
      (p) =>
        p.title &&
        p.firstName &&
        p.lastName &&
        p.dob &&
        p.nationality &&
        p.email &&
        p.phone &&
        p.confirmed
    );

    if (!allValid) {
      alert("Please complete all required fields for all passengers.");
      return;
    }

    completeStep("passengers");
    router.push("/book/baggage");
  };

  const handleAddPassenger = () => {
    addPassenger({
      id: `passenger-${Date.now()}-${Math.random()}`,
      title: "",
      firstName: "",
      lastName: "",
      dob: "",
      gender: "male",
      nationality: "",
      email: "",
      phone: "",
      confirmed: false,
    });
  };

  if (!selectedOffer) {
    return null;
  }

  return (
    <BookingShell currentStep="passengers">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-3">
            Passenger Details
          </h1>
          <p className="text-lg text-ec-muted">Step 1 of 6 - Enter passenger information</p>
        </div>

        {passengers.map((passenger, index) => (
          <PassengerForm
            key={passenger.id}
            passenger={passenger}
            index={index}
            onUpdate={(updates) => updatePassenger(passenger.id, updates)}
            onRemove={passengers.length > 1 ? () => removePassenger(passenger.id) : undefined}
          />
        ))}

        <div
          className="p-6 rounded-2xl border"
          style={{
            background: 'rgba(10, 12, 14, 0.65)',
            backdropFilter: 'blur(14px)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            boxShadow: '0 18px 55px rgba(0,0,0,0.45), 0 0 0 1px rgba(28,140,130,0.15)',
          }}
        >
          <button
            onClick={handleAddPassenger}
            className="flex items-center gap-3 text-ec-teal hover:text-ec-teal/80 transition-all font-semibold"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(28, 140, 130, 0.15)',
                border: '1px solid rgba(28, 140, 130, 0.3)',
              }}
            >
              <Plus size={20} />
            </div>
            Add Passenger
          </button>
        </div>

        <div className="flex items-center justify-between pt-8">
          <EcoviraButton
            variant="secondary"
            onClick={() => router.push("/flights")}
            className="flex items-center gap-2 rounded-full px-8 py-4"
            style={{
              boxShadow: '0 0 20px rgba(255,255,255,0.1)',
            }}
          >
            <ArrowLeft size={18} />
            Back to Search
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

function PassengerForm({
  passenger,
  index,
  onUpdate,
  onRemove,
}: {
  passenger: Passenger;
  index: number;
  onUpdate: (updates: Partial<Passenger>) => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className="p-8 rounded-2xl border space-y-6"
      style={{
        background: 'rgba(10, 12, 14, 0.65)',
        backdropFilter: 'blur(14px)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        boxShadow: '0 18px 55px rgba(0,0,0,0.45), 0 0 0 1px rgba(28,140,130,0.15)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-ec-teal to-ec-teal/50"></div>
          <h3 className="text-2xl font-serif font-semibold text-ec-text">
            Passenger {index + 1}
          </h3>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-sm text-ec-muted hover:text-ec-text transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-2">
            Title *
          </label>
          <select
            value={passenger.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full h-[52px] px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.55)]"
          >
            <option value="">Select</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
            <option value="Miss">Miss</option>
            <option value="Dr">Dr</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-2">
            First Name *
          </label>
          <Input
            value={passenger.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            placeholder="First name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-2">
            Last Name *
          </label>
          <Input
            value={passenger.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            placeholder="Last name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-2">
            Date of Birth *
          </label>
          <Input
            type="date"
            value={passenger.dob}
            onChange={(e) => onUpdate({ dob: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-2">
            Gender *
          </label>
          <select
            value={passenger.gender}
            onChange={(e) => onUpdate({ gender: e.target.value as Passenger["gender"] })}
            className="w-full h-[52px] px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.55)]"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-2">
            Nationality *
          </label>
          <Input
            value={passenger.nationality}
            onChange={(e) => onUpdate({ nationality: e.target.value })}
            placeholder="e.g., Australian"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-2">
            Passport Number (if international)
          </label>
          <Input
            value={passenger.passportNo || ""}
            onChange={(e) => onUpdate({ passportNo: e.target.value })}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-2">
            Passport Expiry
          </label>
          <Input
            type="date"
            value={passenger.passportExpiry || ""}
            onChange={(e) => onUpdate({ passportExpiry: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-2">
            Email *
          </label>
          <Input
            type="email"
            value={passenger.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-2">
            Phone *
          </label>
          <Input
            type="tel"
            value={passenger.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+61 4XX XXX XXX"
          />
        </div>
      </div>

      <div className="pt-4 border-t"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={passenger.confirmed}
            onChange={(e) => onUpdate({ confirmed: e.target.checked })}
            className="w-5 h-5 rounded border-[rgba(28,140,130,0.3)] bg-[rgba(15,17,20,0.55)] text-ec-teal focus:ring-ec-teal"
            style={{
              boxShadow: passenger.confirmed ? '0 0 10px rgba(28,140,130,0.3)' : 'none',
            }}
          />
          <span className="text-sm text-ec-text font-medium">
            I confirm these details match my passport/ID *
          </span>
        </label>
      </div>
    </div>
  );
}

