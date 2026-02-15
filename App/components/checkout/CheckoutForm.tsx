"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Coins,
  Sparkles,
  Lock,
  Plane,
  Luggage,
  ShieldCheck,
} from "lucide-react";

import { BookingShell } from "@/components/booking/BookingShell";
import { EcoviraButton } from "@/components/Button";
import { useBookingStore } from "@/stores/bookingStore";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function GlassCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border",
        "bg-[rgba(24,26,30,0.55)] backdrop-blur-[16px]",
        "border-[rgba(255,255,255,0.16)]",
        "shadow-[0_22px_70px_rgba(0,0,0,0.60)]"
      )}
    >
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)]">
              {icon}
            </div>
          ) : null}
          <div>
            <div className="text-white text-xl md:text-2xl font-semibold tracking-tight">
              {title}
            </div>
            {subtitle ? (
              <div className="text-[rgba(255,255,255,0.72)] text-sm md:text-base mt-0.5">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

function BubbleRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border px-4 py-3",
        "border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)]",
        "flex items-center justify-between gap-4"
      )}
    >
      <div className="flex items-center gap-3">
        {icon ? (
          <div className="h-9 w-9 rounded-xl flex items-center justify-center border border-[rgba(28,140,130,0.35)] bg-[rgba(28,140,130,0.14)]">
            {icon}
          </div>
        ) : null}
        <div className="text-white font-medium">{label}</div>
      </div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  );
}

function PaymentHeroButton({
  title,
  subtitle,
  badge,
  icon,
  onClick,
  loading,
  tone,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading: boolean;
  tone: "teal" | "gold";
}) {
  const border =
    tone === "gold"
      ? "border-[rgba(200,162,77,0.45)]"
      : "border-[rgba(28,140,130,0.45)]";

  const glow =
    tone === "gold"
      ? "shadow-[0_0_40px_rgba(200,162,77,0.16)] hover:shadow-[0_0_55px_rgba(200,162,77,0.22)]"
      : "shadow-[0_0_40px_rgba(28,140,130,0.16)] hover:shadow-[0_0_55px_rgba(28,140,130,0.22)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cx(
        "w-full text-left rounded-2xl border p-6 transition-all",
        "bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.08)]",
        border,
        glow,
        loading && "opacity-70 cursor-not-allowed"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={cx(
              "h-12 w-12 rounded-2xl flex items-center justify-center border",
              tone === "gold"
                ? "border-[rgba(200,162,77,0.45)] bg-[rgba(200,162,77,0.14)]"
                : "border-[rgba(28,140,130,0.45)] bg-[rgba(28,140,130,0.14)]"
            )}
          >
            {icon}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-white text-lg md:text-xl font-semibold">
                {title}
              </div>
              {badge ? (
                <span
                  className={cx(
                    "text-xs font-semibold px-3 py-1 rounded-full border",
                    tone === "gold"
                      ? "border-[rgba(200,162,77,0.40)] bg-[rgba(200,162,77,0.14)] text-[rgba(255,255,255,0.92)]"
                      : "border-[rgba(28,140,130,0.40)] bg-[rgba(28,140,130,0.14)] text-[rgba(255,255,255,0.92)]"
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </div>

            <div className="text-[rgba(255,255,255,0.72)] text-sm mt-1">
              {subtitle}
            </div>
          </div>
        </div>

        <div
          className={cx(
            "mt-1 text-xs text-[rgba(255,255,255,0.70)] flex items-center gap-2"
          )}
        >
          <Lock size={14} />
          Secure
        </div>
      </div>

      <div className="mt-4">
        <div
          className={cx(
            "rounded-xl px-4 py-3 border text-sm font-semibold",
            tone === "gold"
              ? "border-[rgba(200,162,77,0.35)] bg-[rgba(200,162,77,0.10)] text-white"
              : "border-[rgba(28,140,130,0.35)] bg-[rgba(28,140,130,0.10)] text-white"
          )}
        >
          {loading ? "Opening payment…" : "Continue →"}
        </div>
      </div>
    </button>
  );
}

export function CheckoutForm({
  onSubmit,
  loading,
  requirePassport,
}: {
  onSubmit: (data: { passengerEmail: string; passengerLastName: string; phoneNumber?: string; smsOptIn: boolean; passportNumber?: string; nationality?: string; passportExpiry?: string }) => Promise<void>;
  loading: boolean;
  requirePassport?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [lastName, setLastName] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ passengerEmail: email, passengerLastName: lastName, smsOptIn: false });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-2 rounded-lg border border-[rgba(28,140,130,0.3)] bg-[rgba(15,17,20,0.6)] text-white" />
      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required className="w-full px-4 py-2 rounded-lg border border-[rgba(28,140,130,0.3)] bg-[rgba(15,17,20,0.6)] text-white" />
      <EcoviraButton type="submit" disabled={loading}>{loading ? "Saving…" : "Continue"}</EcoviraButton>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();

  const selectedOffer = useBookingStore((s) => s.selectedOffer);
  const stepCompletion = useBookingStore((s) => s.stepCompletion);
  const passengers = useBookingStore((s) => s.passengers);
  const pricing = useBookingStore((s) => s.pricing);
  const seats = useBookingStore((s) => s.seats);
  const baggage = useBookingStore((s) => s.baggage);
  const insurance = useBookingStore((s) => s.insurance);
  const completeStep = useBookingStore((s) => s.completeStep);

  const [loadingCard, setLoadingCard] = useState(false);
  const [loadingCrypto, setLoadingCrypto] = useState(false);

  // Guard
  useEffect(() => {
    if (!selectedOffer) router.push("/flights");
    else if (!stepCompletion.insurance) router.push("/book/insurance");
  }, [selectedOffer, stepCompletion.insurance, router]);

  const currency = pricing?.currency || "AUD";

  const totals = useMemo(() => {
    const base = Number(pricing?.total ?? pricing?.base ?? 0);
    const seatsTotal = Number(seats?.reduce((sum, s) => sum + (s.price || 0), 0) ?? 0);
    const bagsTotal = Number(
      baggage?.checkedBags?.reduce((sum, b) => sum + (b.price || 0), 0) ?? 0
    );
    const insuranceTotal = Number(insurance?.price ?? 0);
    const addons = seatsTotal + bagsTotal + insuranceTotal;
    const total = base + addons;
    return { base, seatsTotal, bagsTotal, insuranceTotal, addons, total };
  }, [pricing, seats, baggage, insurance]);

  if (!selectedOffer || !stepCompletion.insurance) return null;

  const commonPayload = {
    offer: selectedOffer,
    pricing,
    passengers,
    seats,
    baggage,
    insurance,
    currency,
    totals,
  };

  async function startStripe() {
    setLoadingCard(true);
    try {
      const res = await fetch("/api/payments/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commonPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Stripe session failed");

      // Expect backend returns { url }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Stripe response missing url");
    } catch (e: any) {
      alert(e?.message || "Payment error");
    } finally {
      setLoadingCard(false);
    }
  }

  async function startCrypto() {
    setLoadingCrypto(true);
    try {
      const res = await fetch("/api/payments/nowpayments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commonPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Crypto invoice failed");

      // Expect backend returns { url } (hosted invoice) OR { invoiceId }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      if (data?.invoiceId) {
        router.push(`/book/crypto?invoiceId=${encodeURIComponent(data.invoiceId)}`);
        return;
      }

      throw new Error("NOWPayments response missing url/invoiceId");
    } catch (e: any) {
      alert(e?.message || "Payment error");
    } finally {
      setLoadingCrypto(false);
    }
  }

  // Passenger form submit still exists — it should update store; then user presses payment
  const onPassengerSubmit = async (_data?: { passengerEmail?: string; passengerLastName?: string; phoneNumber?: string; smsOptIn?: boolean; passportNumber?: string; nationality?: string; passportExpiry?: string }) => {
    completeStep("checkout");
    // We do not auto-pay here; user chooses the big CTA buttons.
  };

  return (
    <BookingShell currentStep="checkout">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        {/* Header */}
        <div className="mb-9">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)] text-xs font-semibold text-white">
              <Sparkles size={14} />
              Step 5 of 6
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(28,140,130,0.35)] bg-[rgba(28,140,130,0.14)] text-xs font-semibold text-white">
              <Lock size={14} />
              Secure Checkout
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-semibold text-white tracking-tight">
            Review & Pay
          </h1>
          <p className="mt-3 text-[rgba(255,255,255,0.74)] text-base md:text-lg max-w-2xl">
            Same luxury feel as the AI Concierge: clear, bright, glowing borders — and payment is the hero.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-8">
            {/* Snapshot */}
            <GlassCard
              title="Trip Snapshot"
              subtitle="Bubble rows — no long robotic rectangles."
              icon={<Plane className="text-[rgba(28,140,130,0.95)]" size={20} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <BubbleRow
                  label="Route"
                  value={
                    selectedOffer?.type === "flight" || selectedOffer?.type === "transfer"
                      ? `${(selectedOffer as { from?: string }).from ?? "—"} → ${(selectedOffer as { to?: string }).to ?? "—"}`
                      : selectedOffer?.type === "car"
                        ? `${(selectedOffer as { pickup?: string; pickupLocation?: string }).pickup ?? (selectedOffer as { pickupLocation?: string }).pickupLocation ?? "—"} → ${(selectedOffer as { dropoff?: string; returnLocation?: string }).dropoff ?? (selectedOffer as { returnLocation?: string }).returnLocation ?? "—"}`
                        : selectedOffer?.type === "stay"
                          ? (selectedOffer as { city?: string; name?: string }).city ?? (selectedOffer as { name?: string }).name ?? "—"
                          : "—"
                  }
                  icon={<Plane size={18} className="text-[rgba(28,140,130,0.95)]" />}
                />
                <BubbleRow
                  label="Passengers"
                  value={passengers?.length ?? 1}
                  icon={<Sparkles size={18} className="text-[rgba(28,140,130,0.95)]" />}
                />
                <BubbleRow
                  label="Baggage"
                  value={
                    baggage?.checkedBags?.length
                      ? `${baggage.checkedBags.length} checked`
                      : "Carry-on"
                  }
                  icon={<Luggage size={18} className="text-[rgba(28,140,130,0.95)]" />}
                />
                <BubbleRow
                  label="Insurance"
                  value={insurance?.plan && insurance.plan !== "none" ? insurance.plan : "None"}
                  icon={<ShieldCheck size={18} className="text-[rgba(28,140,130,0.95)]" />}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[rgba(255,255,255,0.68)] text-xs uppercase tracking-[0.16em]">
                      Total
                    </div>
                    <div className="text-white text-3xl font-bold mt-1">
                      {currency} {totals.total.toFixed(2)}
                    </div>
                    <div className="text-[rgba(255,255,255,0.65)] text-xs mt-1">
                      Includes fees • Add-ons included
                    </div>
                  </div>
                  <div className="text-right text-xs text-[rgba(255,255,255,0.65)]">
                    Base: {currency} {totals.base.toFixed(2)}
                    <br />
                    Add-ons: {currency} {totals.addons.toFixed(2)}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Passenger Details */}
            <GlassCard
              title="Passenger Details"
              subtitle="Fix the ‘robot’ feel: readable labels, clear spacing."
              icon={<Sparkles className="text-[rgba(255,255,255,0.85)]" size={20} />}
            >
              <CheckoutForm onSubmit={onPassengerSubmit} loading={false} requirePassport={true} />
            </GlassCard>

            {/* Payment – BIG CENTER HERO BUTTONS */}
            <GlassCard
              title="Payment"
              subtitle="These MUST be the main buttons (large, centered, premium)."
              icon={<Lock className="text-[rgba(200,162,77,0.95)]" size={20} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PaymentHeroButton
                  title="Pay by Card (Stripe)"
                  subtitle="Multi-Currency checkout (customer pays in selected currency)"
                  badge="Multi-Currency"
                  icon={<CreditCard className="text-white" size={22} />}
                  tone="teal"
                  onClick={startStripe}
                  loading={loadingCard}
                />

                <PaymentHeroButton
                  title="Pay by Crypto (NOWPayments)"
                  subtitle="USDT / USDC / BTC / ETH • Discount applies at invoice"
                  badge="10% OFF"
                  icon={<Coins className="text-white" size={22} />}
                  tone="gold"
                  onClick={startCrypto}
                  loading={loadingCrypto}
                />
              </div>

              <div className="mt-5 text-xs text-[rgba(255,255,255,0.62)]">
                After payment succeeds, the app continues to ticketing + e-ticket delivery.
              </div>
            </GlassCard>

            <div className="flex items-center justify-between">
              <EcoviraButton
                variant="secondary"
                onClick={() => router.push("/book/insurance")}
                className="rounded-full px-7 py-4"
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowLeft size={18} />
                  Back
                </span>
              </EcoviraButton>
            </div>
          </div>

          {/* Right sticky summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <GlassCard
                title="Breakdown"
                subtitle="No dark unreadable text."
                icon={<Sparkles className="text-[rgba(200,162,77,0.95)]" size={20} />}
              >
                <div className="space-y-3">
                  <BubbleRow
                    label="Base Fare"
                    value={`${currency} ${totals.base.toFixed(2)}`}
                  />
                  <BubbleRow
                    label="Seats"
                    value={`${currency} ${totals.seatsTotal.toFixed(2)}`}
                  />
                  <BubbleRow
                    label="Baggage"
                    value={`${currency} ${totals.bagsTotal.toFixed(2)}`}
                  />
                  <BubbleRow
                    label="Insurance"
                    value={`${currency} ${totals.insuranceTotal.toFixed(2)}`}
                  />

                  <div className="mt-3 rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] p-4">
                    <div className="text-[rgba(255,255,255,0.68)] text-xs uppercase tracking-[0.16em]">
                      Total
                    </div>
                    <div className="text-white text-2xl font-bold mt-1">
                      {currency} {totals.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </BookingShell>
  );
}
