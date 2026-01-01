"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function StayCheckoutPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const stayId = sp.get("stayId");
  const checkIn = sp.get("checkIn");
  const checkOut = sp.get("checkOut");
  const adults = sp.get("adults");
  const rooms = sp.get("rooms");
  const currency = sp.get("currency") ?? "AUD";

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-b from-black via-[#0e1116] to-black">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Stay Checkout</h1>
          <p className="text-white/60 mt-1">
            Review your stay details and continue securely
          </p>
        </div>

        {/* Main Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left details */}
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
            <h2 className="text-sm uppercase tracking-wider text-white/60 mb-4">
              Stay details
            </h2>

            <div className="space-y-3 text-white">
              <div><span className="text-white/60">Stay:</span> {stayId}</div>
              <div><span className="text-white/60">Check-in:</span> {checkIn}</div>
              <div><span className="text-white/60">Check-out:</span> {checkOut}</div>
              {adults && <div><span className="text-white/60">Adults:</span> {adults}</div>}
              {rooms && <div><span className="text-white/60">Rooms:</span> {rooms}</div>}
              <div><span className="text-white/60">Currency:</span> {currency}</div>
            </div>
          </div>

          {/* Right summary */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 flex flex-col">
            <h2 className="text-sm uppercase tracking-wider text-white/60 mb-4">
              Summary
            </h2>

            <div className="flex-1 text-white/80 text-sm">
              Final pricing will be confirmed before payment.
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full rounded-full border border-white/20 py-2 text-white/80 hover:bg-white/5 transition"
              >
                Back
              </button>

              <button
                className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 py-3 font-semibold text-black hover:opacity-90 transition"
                onClick={() =>
                  console.log("Proceed to payment", { stayId, checkIn, checkOut })
                }
              >
                Continue →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
