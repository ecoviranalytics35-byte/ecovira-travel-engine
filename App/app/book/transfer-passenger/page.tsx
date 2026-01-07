"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingStore } from "@/stores/bookingStore";
import { EcoviraButton } from "@/components/Button";
import { Input } from "@/components/Input";
import { EcoviraCard } from "@/components/EcoviraCard";
import { ArrowLeft, Users, Luggage, MapPin, Calendar, MessageSquare } from "lucide-react";
import type { TransferResult } from "@/lib/core/types";

export default function TransferPassengerInfoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedOffer = useBookingStore((state) => state.selectedOffer);
  const setTransferPassengerInfo = useBookingStore((state) => state.setTransferPassengerInfo);
  const completeStep = useBookingStore((state) => state.completeStep);

  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [specialRequests, setSpecialRequests] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const transferId = searchParams.get("transferId");

  useEffect(() => {
    if (!selectedOffer || selectedOffer.type !== 'transfer' || selectedOffer.id !== transferId) {
      // If no selected transfer or mismatch, redirect back to transfers search
      router.replace("/transfers");
    }
  }, [selectedOffer, transferId, router]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!passengers || passengers < 1) newErrors.passengers = "At least 1 passenger is required.";
    if (passengers > 20) newErrors.passengers = "Maximum 20 passengers allowed.";
    if (luggage < 0) newErrors.luggage = "Luggage count cannot be negative.";
    if (luggage > 50) newErrors.luggage = "Maximum 50 pieces of luggage allowed.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const passengerInfo = {
      passengers,
      luggage,
      specialRequests: specialRequests.trim() || undefined,
    };
    setTransferPassengerInfo(passengerInfo);
    completeStep('transferPassengerInfo');
    router.push("/book/checkout");
  };

  const handleBack = () => {
    router.back();
  };

  if (!selectedOffer || selectedOffer.type !== 'transfer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ec-night">
        <div className="text-white text-center">
          <p className="text-lg mb-4">Loading transfer details or redirecting...</p>
        </div>
      </div>
    );
  }

  const transfer = selectedOffer as TransferResult;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-ec-muted hover:text-ec-text transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-4">
          Passenger Information
        </h1>
        <p className="text-ec-muted text-lg">Enter details for your transfer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <EcoviraCard variant="glass" className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-ec-text mb-6">Transfer Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                  Number of Passengers
                </label>
                <Input
                  icon={Users}
                  type="number"
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                  placeholder="1"
                  min="1"
                  max="20"
                  error={errors.passengers}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                  Number of Luggage Pieces
                </label>
                <Input
                  icon={Luggage}
                  type="number"
                  value={luggage}
                  onChange={(e) => setLuggage(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  max="50"
                  error={errors.luggage}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
                  Special Requests (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(28,140,130,0.2)] rounded-lg text-ec-text placeholder-ec-muted focus:outline-none focus:border-[rgba(28,140,130,0.5)] focus:ring-2 focus:ring-[rgba(28,140,130,0.2)] transition-all"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests or instructions..."
                  rows={4}
                />
              </div>
              <EcoviraButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
              >
                Continue to Checkout →
              </EcoviraButton>
            </form>
          </EcoviraCard>
        </div>

        {/* Sidebar - Booking Summary */}
        <div className="lg:col-span-1">
          <EcoviraCard variant="glass" className="p-6 sticky top-32">
            <h2 className="text-xl font-semibold text-ec-text mb-4">Your Transfer</h2>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-ec-muted mb-1">Transfer Type</div>
                <div className="text-ec-text font-medium">{transfer.name || transfer.transferType || "Private Transfer"}</div>
              </div>
              <div>
                <div className="text-ec-muted mb-1">From</div>
                <div className="text-ec-text font-medium flex items-center gap-2">
                  <MapPin size={16} /> {transfer.from}
                </div>
              </div>
              <div>
                <div className="text-ec-muted mb-1">To</div>
                <div className="text-ec-text font-medium flex items-center gap-2">
                  <MapPin size={16} /> {transfer.to}
                </div>
              </div>
              <div>
                <div className="text-ec-muted mb-1">Date & Time</div>
                <div className="text-ec-text font-medium flex items-center gap-2">
                  <Calendar size={16} /> {new Date(transfer.dateTime).toLocaleString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div className="pt-4 border-t border-[rgba(28,140,130,0.15)]">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-ec-text">Total</div>
                  <div className="text-2xl font-bold text-ec-text">
                    {transfer.currency} {typeof transfer.total === 'string' ? parseFloat(transfer.total).toFixed(2) : transfer.total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </EcoviraCard>
        </div>
      </div>
    </div>
  );
}

