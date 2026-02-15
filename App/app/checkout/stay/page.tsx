"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DEPRECATED: This checkout page has been replaced by the unified checkout at /book/checkout
 * All products (flights, stays, cars, transfers) now use the unified checkout page.
 * This page redirects to maintain backward compatibility.
 */
export default function StayCheckoutPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to unified checkout page
    router.replace('/book/checkout');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-ec-night">
      <div className="text-white text-center">
        <p className="text-lg mb-4">Redirecting to checkout...</p>
      </div>
    </div>
  );
}
