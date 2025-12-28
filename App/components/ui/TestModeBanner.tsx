"use client";

export function TestModeBanner() {
  // Check if we're using test API (all Amadeus endpoints use test.api.amadeus.com)
  const isTestMode = true; // Always true for now since we use test.api.amadeus.com

  if (!isTestMode) return null;

  return (
    <div className="mb-6 p-3 bg-[rgba(200,162,77,0.15)] border border-[rgba(200,162,77,0.3)] rounded-ec-md text-ec-text text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold">Test Mode:</span>
        <span className="text-ec-muted">Using Amadeus sandbox endpoints. Results are for testing purposes only.</span>
      </div>
    </div>
  );
}

