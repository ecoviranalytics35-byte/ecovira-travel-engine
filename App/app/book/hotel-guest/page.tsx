"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingStore } from "@/stores/bookingStore";
import type { StayResult } from "@/lib/core/types";
import { EcoviraButton } from "@/components/Button";
import { Input } from "@/components/Input";
import { EcoviraCard } from "@/components/EcoviraCard";

function HotelGuestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, setStayGuestInfo, addItem } = useBookingStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Get stay ID from URL
  const stayId = searchParams.get("stayId");
  const checkIn = searchParams.get("checkIn") || "";
  const nights = parseInt(searchParams.get("nights") || "1");
  const adults = parseInt(searchParams.get("adults") || "1");
  const currency = searchParams.get("currency") || "AUD";

  // Load stay from search results or store
  const [selectedStay, setSelectedStay] = useState<StayResult | null>(null);

  useEffect(() => {
    if (stayId) {
      // Try to find stay in store
      const stay = items.stays?.find((s) => s.id === stayId);
      if (stay) {
        setSelectedStay(stay);
      } else {
        // If not in store, fetch from API (for direct navigation)
        // For now, show error
        setError("Stay not found. Please select a hotel from search results.");
      }
    }
  }, [stayId, items.stays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!selectedStay) {
      setError("No hotel selected. Please go back and select a hotel.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Save guest info to store
      setStayGuestInfo({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        specialRequests: specialRequests.trim() || undefined,
      });

      // Ensure stay is in store
      if (!items.stays?.find((s) => s.id === selectedStay.id)) {
        addItem("stay", selectedStay);
      }

      // Navigate to unified checkout
      router.push("/book/checkout");
    } catch (err) {
      console.error("[HotelGuestPage] Error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStay && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ec-night">
        <div className="text-white text-center">
          <p className="text-lg mb-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-4">
          Guest Information
        </h1>
        <p className="text-ec-muted text-lg">
          Please provide your details to complete your hotel booking
        </p>
      </div>

      {error && (
        <EcoviraCard variant="glass" className="mb-6 p-6 border-red-500/30">
          <p className="text-red-400">{error}</p>
        </EcoviraCard>
      )}

      {selectedStay && (
        <EcoviraCard variant="glass" className="mb-6 p-6">
          <h2 className="text-xl font-semibold text-ec-text mb-4">Booking Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ec-muted">Hotel</span>
              <span className="text-ec-text font-medium">{selectedStay.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ec-muted">Check-in</span>
              <span className="text-ec-text font-medium">
                {checkIn ? new Date(checkIn).toLocaleDateString() : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ec-muted">Nights</span>
              <span className="text-ec-text font-medium">{nights}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ec-muted">Guests</span>
              <span className="text-ec-text font-medium">{adults} adult{adults > 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[rgba(28,140,130,0.15)]">
              <span className="text-ec-muted">Total</span>
              <span className="text-ec-text font-bold text-lg">
                {currency} {typeof selectedStay.total === "number" ? selectedStay.total.toFixed(2) : selectedStay.total}
              </span>
            </div>
          </div>
        </EcoviraCard>
      )}

      <EcoviraCard variant="glass" className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                First Name *
              </label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                Last Name *
              </label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Email Address *
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Phone Number *
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61 400 000 000"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Special Requests (Optional)
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special requests or preferences..."
              rows={4}
              className="w-full px-4 py-3 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all resize-none"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <EcoviraButton
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              Back
            </EcoviraButton>
            <EcoviraButton
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Processing..." : "Continue to Checkout"}
            </EcoviraButton>
          </div>
        </form>
      </EcoviraCard>
    </div>
  );
}

export default function HotelGuestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <HotelGuestContent />
    </Suspense>
  );
}
