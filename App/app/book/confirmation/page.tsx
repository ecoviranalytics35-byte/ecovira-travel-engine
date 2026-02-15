"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingShell } from "@/components/booking/BookingShell";
import { useBookingStore } from "@/stores/bookingStore";
import { EcoviraCard } from "@/components/EcoviraCard";
import { EcoviraButton } from "@/components/Button";
import { Download, Mail, ArrowRight } from "lucide-react";

export default function ConfirmationPage() {
  const router = useRouter();
  const selectedOffer = useBookingStore((state) => state.selectedOffer);
  const passengers = useBookingStore((state) => state.passengers);
  const seats = useBookingStore((state) => state.seats);
  const baggage = useBookingStore((state) => state.baggage);
  const insurance = useBookingStore((state) => state.insurance);
  const pricing = useBookingStore((state) => state.pricing);
  const payment = useBookingStore((state) => state.payment);
  const booking = useBookingStore((state) => state.booking);
  const clearBooking = useBookingStore((state) => state.clearBooking);

  // Route guard: redirect if payment not completed
  useEffect(() => {
    if (!selectedOffer) {
      router.push("/flights");
      return;
    }
    if (payment.status !== "succeeded" && !booking) {
      router.push("/book/checkout");
    }
  }, [selectedOffer, payment.status, booking, router]);

  const handleDownloadTicket = async () => {
    if (!booking?.bookingId) return;
    try {
      const res = await fetch(`/api/ticket/generate?bookingId=${booking.bookingId}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ecovira-ticket-${booking.bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download ticket:", err);
      alert("Failed to download ticket. Please try again.");
    }
  };

  const handleEmailTicket = async () => {
    if (!booking?.bookingId || !passengers[0]?.email) return;
    try {
      const res = await fetch("/api/ticket/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          email: passengers[0].email,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert("E-ticket sent to your email!");
      } else {
        alert("Failed to send email. Please try again.");
      }
    } catch (err) {
      console.error("Failed to email ticket:", err);
      alert("Failed to send email. Please try again.");
    }
  };

  const handleNewBooking = () => {
    clearBooking();
    router.push("/flights");
  };

  if (!selectedOffer || payment.status !== "succeeded") {
    return null;
  }

  return (
    <BookingShell currentStep="confirmation">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-ec-text mb-2">
            Booking Confirmed
          </h1>
          <p className="text-ec-muted">Step 6 of 6 - Your booking is complete</p>
        </div>

        {/* Booking Reference */}
        <EcoviraCard variant="glass" className="p-6 bg-gradient-to-br from-[rgba(28,140,130,0.15)] to-[rgba(28,140,130,0.05)] border-ec-teal/30">
          <div className="text-center">
            <div className="text-sm text-ec-muted mb-2">Booking Reference</div>
            <div className="text-3xl font-mono font-bold text-ec-teal">
              {booking?.pnr || booking?.reference || "ECV" + Date.now().toString(36).toUpperCase()}
            </div>
          </div>
        </EcoviraCard>

        {/* E-Ticket Display */}
        <EcoviraCard variant="glass" className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(28,140,130,0.15)] pb-4">
              <div>
                <h2 className="text-2xl font-serif font-semibold text-ec-text">E-Ticket / Itinerary Receipt</h2>
                <p className="text-sm text-ec-muted mt-1">Ecovira Air</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-ec-muted">Booking Reference</div>
                <div className="text-lg font-mono font-semibold text-ec-text">
                  {booking?.pnr || booking?.reference || "N/A"}
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div>
              <h3 className="text-lg font-semibold text-ec-text mb-3">Passenger(s)</h3>
              <div className="space-y-2">
                {passengers.map((p, idx) => (
                  <div key={p.id} className="text-sm text-ec-text">
                    {idx + 1}. {p.title} {p.firstName} {p.lastName}
                    {p.email && <span className="text-ec-muted ml-2">({p.email})</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Flight Details */}
            <div>
              <h3 className="text-lg font-semibold text-ec-text mb-3">Flight Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(28,140,130,0.1)] border border-[rgba(28,140,130,0.2)]">
                  <div>
                    <div className="text-ec-text font-medium">
                      {(selectedOffer as { from?: string; to?: string }).from} → {(selectedOffer as { to?: string }).to}
                    </div>
                    <div className="text-xs text-ec-muted mt-1">
                      {(selectedOffer as { departDate?: string; provider?: string }).departDate} • {(selectedOffer as { provider?: string }).provider}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-ec-text font-semibold">
                      {(selectedOffer as { currency?: string; price?: string | number }).currency} {typeof (selectedOffer as { price?: string | number }).price === "string" ? (selectedOffer as { price?: string }).price : Number((selectedOffer as { price?: number }).price).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seats */}
            {seats.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-ec-text mb-2">Seats</h3>
                <div className="text-sm text-ec-text">
                  {seats.map((s) => s.seatNumber).join(", ")}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="pt-4 border-t border-[rgba(28,140,130,0.15)]">
              <h3 className="text-lg font-semibold text-ec-text mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-ec-muted">
                  <span>Total Paid</span>
                  <span className="text-ec-text font-semibold">
                    {pricing.currency} {pricing.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-ec-muted">
                  <span>Payment Method</span>
                  <span className="text-ec-text capitalize">{payment.method}</span>
                </div>
                <div className="flex justify-between text-ec-muted">
                  <span>Status</span>
                  <span className="text-ec-teal capitalize">{payment.status}</span>
                </div>
              </div>
            </div>
          </div>
        </EcoviraCard>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <EcoviraButton
            variant="primary"
            onClick={handleDownloadTicket}
            className="flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download E-Ticket (PDF)
          </EcoviraButton>
          <EcoviraButton
            variant="secondary"
            onClick={handleEmailTicket}
            className="flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            Email me the E-Ticket
          </EcoviraButton>
        </div>

        <EcoviraButton
          variant="secondary"
          onClick={handleNewBooking}
          className="w-full flex items-center justify-center gap-2"
        >
          Start New Booking
          <ArrowRight size={18} />
        </EcoviraButton>
      </div>
    </BookingShell>
  );
}

