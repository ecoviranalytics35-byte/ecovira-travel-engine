"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plane, ArrowLeft, ArrowRight, UserRound } from "lucide-react";

import { BookingShell } from "@/components/booking/BookingShell";
import { EcoviraButton } from "@/components/Button";
import { useBookingStore } from "@/stores/bookingStore";

import { buildMockSeatMap, type SeatLetter, type SeatStatus } from "@/lib/seatmap/mockSeatMap";

type Passenger = {
  id: string;
  firstName: string;
  lastName: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function seatNumber(row: number, letter: SeatLetter) {
  return `${row}${letter}`;
}

function seatTypeFromLetter(letter: SeatLetter) {
  if (letter === "A" || letter === "F") return "Window";
  if (letter === "C" || letter === "D") return "Aisle";
  return "Middle";
}

function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toFixed(2)}`;
}

// Visual tokens (chatbot-style)
const glassPanelStyle: React.CSSProperties = {
  background: "rgba(10, 12, 14, 0.78)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
};

export default function SeatsPage() {
  const router = useRouter();

  const selectedOffer = useBookingStore((s) => s.selectedOffer);
  const stepCompletion = useBookingStore((s) => s.stepCompletion);
  const passengers = useBookingStore((s) => s.passengers) as Passenger[];
  const seats = useBookingStore((s) => s.seats) as Array<{ passengerId: string; seatNumber: string; price: number }>;
  const pricing = useBookingStore((s) => s.pricing) as { currency: string };
  const addSeat = useBookingStore((s) => s.addSeat);
  const completeStep = useBookingStore((s) => s.completeStep);

  // Route guard
  useEffect(() => {
    if (!selectedOffer) {
      router.push("/flights");
      return;
    }
    if (!stepCompletion?.baggage) {
      router.push("/book/baggage");
    }
  }, [selectedOffer, stepCompletion?.baggage, router]);

  const currency = pricing?.currency || "AUD";

  const map = useMemo(() => buildMockSeatMap(30), []);
  const [activePassengerId, setActivePassengerId] = useState<string>("");

  useEffect(() => {
    if (!activePassengerId && passengers?.length) {
      setActivePassengerId(passengers[0].id);
    }
  }, [activePassengerId, passengers]);

  if (!selectedOffer || !stepCompletion?.baggage) return null;

  const activePassenger = passengers.find((p) => p.id === activePassengerId);

  const handleContinue = () => {
    completeStep("seats");
    router.push("/book/insurance");
  };

  const handleBack = () => {
    router.push("/book/baggage");
  };

  // Helpers for current selection state
  const seatAssignedToPassenger = (passengerId: string) =>
    seats.find((s) => s.passengerId === passengerId)?.seatNumber;

  const seatTakenByOtherPassenger = (seatNo: string, passengerId: string) =>
    seats.some((s) => s.seatNumber === seatNo && s.passengerId !== passengerId);

  const isSeatSelectedByPassenger = (seatNo: string, passengerId: string) =>
    seats.some((s) => s.seatNumber === seatNo && s.passengerId === passengerId);

  const assignSeat = (passengerId: string, seatNo: string, price: number) => {
    // If your store supports "replace seat for passenger", addSeat should overwrite or you should implement replace logic in store.
    // Here we assume addSeat overwrites passenger seat (common pattern).
    addSeat({ passengerId, seatNumber: seatNo, price });
  };

  const statusToUI = (status: SeatStatus, isSelected: boolean) => {
    if (isSelected) return "selected";
    if (status === "unavailable") return "unavailable";
    if (status === "premium") return "premium";
    return "available";
  };

  const seatStyle = (ui: "available" | "selected" | "unavailable" | "premium") => {
    switch (ui) {
      case "selected":
        return {
          background: "#1C8C82",
          border: "2px solid #1C8C82",
          color: "white",
          boxShadow: "0 0 20px rgba(28,140,130,0.65), inset 0 0 10px rgba(255,255,255,0.12)",
          transform: "scale(1.06)",
        } as React.CSSProperties;
      case "unavailable":
        return {
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          color: "rgba(237, 237, 237, 0.20)",
          cursor: "not-allowed",
          opacity: 0.35,
        } as React.CSSProperties;
      case "premium":
        return {
          background: "rgba(200, 162, 77, 0.22)",
          border: "2px solid rgba(200, 162, 77, 0.55)",
          color: "#E3C77A",
          boxShadow: "0 0 14px rgba(200,162,77,0.28)",
        } as React.CSSProperties;
      default:
        return {
          background: "rgba(28, 140, 130, 0.18)",
          border: "2px solid rgba(28, 140, 130, 0.40)",
          color: "rgba(255,255,255,0.92)",
        } as React.CSSProperties;
    }
  };

  return (
    <BookingShell currentStep="seats">
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-white">Seat Selection</h1>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.70)" }}>
            Step 3 of 6 — Choose your seats
          </p>
        </header>

        {/* Glass Seat Map Panel */}
        <section className="p-8 rounded-2xl" style={glassPanelStyle}>
          <div className="flex items-center gap-3 mb-2">
            <Plane size={22} className="text-ec-teal" />
            <h2 className="text-2xl font-serif font-semibold text-white">Select Your Seats</h2>
          </div>
          <p className="font-medium mb-6" style={{ color: "rgba(255,255,255,0.86)" }}>
            Choose seats per passenger. Premium seats may include an additional fee.
          </p>

          {/* Passenger Selector (required for multi-pax) */}
          <div className="flex flex-wrap gap-3 mb-8">
            {passengers.map((p) => {
              const active = p.id === activePassengerId;
              const assigned = seatAssignedToPassenger(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePassengerId(p.id)}
                  className={cn("px-4 py-2 rounded-full flex items-center gap-2 transition-all")}
                  style={{
                    background: active ? "rgba(28,140,130,0.20)" : "rgba(255,255,255,0.04)",
                    border: active ? "1px solid rgba(28,140,130,0.45)" : "1px solid rgba(255,255,255,0.10)",
                    boxShadow: active ? "0 0 18px rgba(28,140,130,0.18)" : "none",
                  }}
                >
                  <UserRound size={14} className={active ? "text-ec-teal" : "text-ec-muted"} />
                  <span className="text-sm font-semibold text-white">
                    {p.firstName} {p.lastName}
                  </span>
                  {assigned ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(28,140,130,0.18)",
                        border: "1px solid rgba(28,140,130,0.30)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      {assigned}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                      No seat
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend Chips */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <LegendChip label="Available" variant="available" />
            <LegendChip label="Selected" variant="selected" />
            <LegendChip label="Unavailable" variant="unavailable" />
            <LegendChip label="Premium" variant="premium" />
          </div>

          {/* REAL AIRCRAFT CABIN */}
          <div className="overflow-x-auto pb-2">
            <div
              className="p-8 rounded-2xl min-w-[860px]"
              style={{
                background: "rgba(15, 17, 20, 0.50)",
                border: "2px solid rgba(28, 140, 130, 0.25)",
                boxShadow: "inset 0 0 50px rgba(0,0,0,0.40), 0 0 30px rgba(28,140,130,0.10)",
              }}
            >
              {/* Cabin badge */}
              <div className="text-center mb-6">
                <span
                  className="inline-block px-6 py-2 rounded-full text-sm font-semibold text-white"
                  style={{
                    background: "rgba(28, 140, 130, 0.20)",
                    border: "1px solid rgba(28, 140, 130, 0.40)",
                    boxShadow: "0 0 15px rgba(28,140,130,0.18)",
                  }}
                >
                  Economy Cabin
                </span>
              </div>

              {/* Seat letters header */}
              <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "56px 1fr" }}>
                <div />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <HeaderSeatLetter letter="A" />
                    <HeaderSeatLetter letter="B" />
                    <div className="w-10" />
                    <HeaderSeatLetter letter="C" />
                    <HeaderSeatLetter letter="D" />
                    <div className="w-10" />
                    <HeaderSeatLetter letter="E" />
                    <HeaderSeatLetter letter="F" />
                  </div>
                  <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {activePassenger ? `Assigning for: ${activePassenger.firstName} ${activePassenger.lastName}` : ""}
                  </div>
                </div>
              </div>

              {/* Rows: Row number on left, seats across */}
              <div className="space-y-2">
                {map.map((r) => {
                  const row = r.row;
                  const left: SeatLetter[] = ["A", "B"];
                  const center: SeatLetter[] = ["C", "D"];
                  const right: SeatLetter[] = ["E", "F"];

                  const renderSeat = (letter: SeatLetter) => {
                    const cell = r.seats[letter];
                    const seatNo = seatNumber(row, letter);

                    const selected = activePassengerId ? isSeatSelectedByPassenger(seatNo, activePassengerId) : false;
                    const takenByOther = activePassengerId ? seatTakenByOtherPassenger(seatNo, activePassengerId) : false;

                    const effectiveStatus: SeatStatus =
                      takenByOther ? "unavailable" : cell.status;

                    const ui = statusToUI(effectiveStatus, selected);

                    const disabled = ui === "unavailable" || !activePassengerId;

                    return (
                      <button
                        key={seatNo}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (!activePassengerId) return;
                          if (disabled) return;
                          assignSeat(activePassengerId, seatNo, cell.price);
                        }}
                        className="w-10 h-10 rounded-xl text-[11px] font-extrabold transition-all relative"
                        style={seatStyle(ui)}
                        onMouseEnter={(e) => {
                          if (disabled) return;
                          if (selected) return;
                          e.currentTarget.style.transform = "scale(1.10)";
                          e.currentTarget.style.boxShadow =
                            ui === "premium"
                              ? "0 0 22px rgba(200,162,77,0.35)"
                              : "0 0 22px rgba(28,140,130,0.45)";
                        }}
                        onMouseLeave={(e) => {
                          if (selected) return;
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        aria-label={`Seat ${seatNo}`}
                        title={`${seatNo} • ${seatTypeFromLetter(letter)} • ${cell.price ? formatMoney(currency, cell.price) : "Free"}`}
                      >
                        {ui === "premium" && !selected ? (
                          <span className="absolute -top-1 -right-1 text-[9px]" style={{ color: "#E3C77A" }}>
                            ★
                          </span>
                        ) : null}
                        {letter}
                      </button>
                    );
                  };

                  return (
                    <div key={row} className="grid gap-2 items-center" style={{ gridTemplateColumns: "56px 1fr" }}>
                      {/* Row number */}
                      <div
                        className="text-center text-xs font-bold rounded-lg py-2"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "rgba(255,255,255,0.78)",
                        }}
                      >
                        {row}
                      </div>

                      {/* Seats line */}
                      <div className="flex items-center gap-2">
                        {/* Left block */}
                        <div className="flex items-center gap-2">
                          {left.map(renderSeat)}
                        </div>

                        {/* Aisle gap */}
                        <div className="w-10" />

                        {/* Center block */}
                        <div className="flex items-center gap-2">
                          {center.map(renderSeat)}
                        </div>

                        {/* Aisle gap */}
                        <div className="w-10" />

                        {/* Right block */}
                        <div className="flex items-center gap-2">
                          {right.map(renderSeat)}
                        </div>

                        {/* Row price hint (optional, subtle) */}
                        <div className="ml-auto text-xs font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {row <= 3 ? "Premium zone" : row === 14 || row === 15 ? "Extra legroom" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Seats Chips */}
          <div className="mt-8 pt-8" style={{ borderTop: "1px solid rgba(28,140,130,0.20)" }}>
            <h3 className="text-lg font-semibold text-white mb-4">Selected Seats</h3>
            {seats.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.60)" }}>No seats selected yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {seats.map((s) => {
                  const passenger = passengers.find((p) => p.id === s.passengerId);
                  const letter = s.seatNumber.slice(-1) as SeatLetter;
                  const type = seatTypeFromLetter(letter);
                  return (
                    <div
                      key={`${s.passengerId}-${s.seatNumber}`}
                      className="px-4 py-2.5 rounded-xl flex items-center gap-3"
                      style={{
                        background: "rgba(28, 140, 130, 0.15)",
                        border: "1px solid rgba(28, 140, 130, 0.30)",
                        boxShadow: "0 0 15px rgba(28,140,130,0.18)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white"
                        style={{
                          background: "rgba(28,140,130,0.30)",
                          border: "1px solid rgba(28,140,130,0.45)",
                        }}
                      >
                        {s.seatNumber}
                      </div>
                      <div className="min-w-[160px]">
                        <div className="text-white font-semibold text-sm">
                          {passenger ? `${passenger.firstName} ${passenger.lastName}` : "Passenger"}
                        </div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                          {type} • {s.price > 0 ? formatMoney(currency, s.price) : "Free"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-2">
          <EcoviraButton
            variant="secondary"
            onClick={handleBack}
            className="flex items-center gap-2 rounded-full px-8 py-4"
            style={{ boxShadow: "0 0 20px rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft size={18} />
            Back
          </EcoviraButton>

          <EcoviraButton
            variant="primary"
            onClick={handleContinue}
            className="flex items-center gap-2 rounded-full px-8 py-4"
            style={{ boxShadow: "0 0 25px rgba(28,140,130,0.28), 0 0 0 1px rgba(200,162,77,0.18)" }}
          >
            Continue
            <ArrowRight size={18} />
          </EcoviraButton>
        </div>
      </div>
    </BookingShell>
  );
}

/** Small components */

function HeaderSeatLetter({ letter }: { letter: string }) {
  return (
    <div
      className="w-10 text-center text-xs font-extrabold rounded-lg py-2"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "rgba(255,255,255,0.75)",
      }}
    >
      {letter}
    </div>
  );
}

function LegendChip({
  label,
  variant,
}: {
  label: string;
  variant: "available" | "selected" | "unavailable" | "premium";
}) {
  const styles: Record<string, React.CSSProperties> = {
    available: {
      background: "rgba(28,140,130,0.12)",
      border: "1px solid rgba(28,140,130,0.30)",
      color: "rgba(255,255,255,0.90)",
    },
    selected: {
      background: "rgba(28,140,130,0.22)",
      border: "1px solid rgba(28,140,130,0.42)",
      color: "rgba(255,255,255,0.92)",
      boxShadow: "0 0 14px rgba(28,140,130,0.18)",
    },
    unavailable: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.10)",
      color: "rgba(255,255,255,0.55)",
      opacity: 0.8,
    },
    premium: {
      background: "rgba(200,162,77,0.12)",
      border: "1px solid rgba(200,162,77,0.32)",
      color: "rgba(255,255,255,0.90)",
    },
  };

  const iconStyles: Record<string, React.CSSProperties> = {
    available: {
      background: "rgba(28,140,130,0.15)",
      border: "2px solid rgba(28,140,130,0.50)",
      color: "rgba(255,255,255,0.85)",
    },
    selected: {
      background: "#1C8C82",
      border: "2px solid #1C8C82",
      color: "white",
      boxShadow: "0 0 10px rgba(28,140,130,0.40)",
    },
    unavailable: {
      background: "rgba(255,255,255,0.05)",
      border: "2px solid rgba(255,255,255,0.12)",
      color: "rgba(255,255,255,0.45)",
    },
    premium: {
      background: "rgba(200,162,77,0.15)",
      border: "2px solid rgba(200,162,77,0.50)",
      color: "#E3C77A",
    },
  };

  const iconText = variant === "selected" ? "✓" : variant === "premium" ? "★" : variant === "unavailable" ? "✕" : "•";

  return (
    <div className="px-4 py-2 rounded-full flex items-center gap-2" style={styles[variant]}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold" style={iconStyles[variant]}>
        {iconText}
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
