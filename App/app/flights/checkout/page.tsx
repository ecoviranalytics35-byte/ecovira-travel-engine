"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function FlightsCheckoutPage() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    console.log("[FlightsCheckout] Page loaded", {
      flightId: searchParams.get('flightId'),
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    });
  }, [searchParams]);
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-serif font-semibold text-ec-text mb-6">
        Checkout works
      </h1>
      <p className="text-ec-muted text-lg">
        Navigation successful! Flight ID: {searchParams.get('flightId') || 'Not provided'}
      </p>
    </div>
  );
}

