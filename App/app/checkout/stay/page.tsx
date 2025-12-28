"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { EcoviraCard } from '@/components/EcoviraCard';

export default function StayCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [stayId, setStayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = searchParams.get('stayId') || searchParams.get('offerId');
    if (id) {
      setStayId(id);
      console.log("[StayCheckoutPage] Loaded with stayId", id);
    } else {
      console.warn("[StayCheckoutPage] No stayId or offerId in query params");
    }
  }, [searchParams]);

  const handleSubmit = async (data: {
    passengerEmail: string;
    passengerLastName: string;
    phoneNumber?: string;
    smsOptIn: boolean;
  }) => {
    if (!stayId) {
      console.error("[StayCheckoutPage] Cannot proceed without stayId");
      return;
    }

    setLoading(true);
    try {
      // TODO: Create itinerary and proceed to payment
      console.log("[StayCheckoutPage] Submitting checkout", { stayId, ...data });
      // For now, just redirect back to stays page
      router.push('/stays');
    } catch (error) {
      console.error("[StayCheckoutPage] Error", error);
    } finally {
      setLoading(false);
    }
  };

  if (!stayId) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <EcoviraCard variant="glass" className="p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-ec-text mb-4">Stay Not Found</h1>
            <p className="text-ec-muted mb-6">No stay selected. Please select a stay from the search results.</p>
            <button
              onClick={() => router.push('/stays')}
              className="px-6 py-3 rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.4)] to-[rgba(28,140,130,0.3)] border border-[rgba(28,140,130,0.5)] text-ec-text font-semibold"
            >
              Back to Stays
            </button>
          </div>
        </EcoviraCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-ec-text mb-4">
          Checkout
        </h1>
        <p className="text-ec-muted text-lg">Complete your stay booking</p>
        <p className="text-sm text-ec-dim mt-2">Stay ID: {stayId}</p>
      </div>

      <EcoviraCard variant="glass" className="p-8">
        <CheckoutForm onSubmit={handleSubmit} loading={loading} />
      </EcoviraCard>
    </div>
  );
}

