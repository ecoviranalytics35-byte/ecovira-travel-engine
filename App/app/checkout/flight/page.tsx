"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export default function FlightCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [offerId, setOfferId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = searchParams.get('offerId');
    if (id) {
      setOfferId(id);
      console.log("[FlightCheckoutPage] Loaded with offerId", id);
    } else {
      console.warn("[FlightCheckoutPage] No offerId in query params");
    }
  }, [searchParams]);

  const handleSubmit = async (data: {
    passengerEmail: string;
    passengerLastName: string;
    phoneNumber?: string;
    smsOptIn: boolean;
  }) => {
    if (!offerId) {
      console.error("[FlightCheckoutPage] Cannot proceed without offerId");
      return;
    }

    setLoading(true);
    try {
      // TODO: Create itinerary and proceed to payment
      console.log("[FlightCheckoutPage] Submitting checkout", { offerId, ...data });
      // For now, just redirect back to flights page
      router.push('/flights');
    } catch (error) {
      console.error("[FlightCheckoutPage] Error", error);
    } finally {
      setLoading(false);
    }
  };

  if (!offerId) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="rounded-ec-lg bg-ec-card border border-[rgba(28,140,130,0.22)] shadow-ec-card p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-ec-text mb-4">Flight Not Found</h1>
            <p className="text-ec-muted mb-6">No flight selected. Please select a flight from the search results.</p>
            <button
              onClick={() => router.push('/flights')}
              className="px-6 py-3 rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold"
            >
              Back to Flights
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-4">
          Checkout
        </h1>
        <p className="text-ec-muted text-lg">Complete your flight booking</p>
        <p className="text-sm text-ec-dim mt-2">Offer ID: {offerId}</p>
      </div>

      <div className="rounded-ec-lg bg-ec-card border border-[rgba(28,140,130,0.22)] shadow-ec-card p-8">
        <CheckoutForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}

