"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plane, ArrowLeft, ArrowRight, UserRound, Loader2, AlertCircle } from "lucide-react";

import { BookingShell } from "@/components/booking/BookingShell";
import { EcoviraButton } from "@/components/Button";
import { useBookingStore } from "@/stores/bookingStore";

import type { NormalizedSeat, NormalizedSeatMap } from "@/lib/flights/seatmap";

type Passenger = {
  id: string;
  firstName: string;
  lastName: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SeatLetter = "A" | "B" | "C" | "D" | "E" | "F" | string;

function seatTypeFromLetter(letter: string) {
  // Handle standard 6-seat configuration
  if (letter === "A" || letter === "F") return "Window";
  if (letter === "C" || letter === "D") return "Aisle";
  return "Middle";
}

function getSeatCharacteristicsLabel(characteristics: string[]): string {
  const labels: Record<string, string> = {
    EXIT_ROW: "Exit Row",
    LEGROOM: "Extra Legroom",
    BULKHEAD: "Bulkhead",
    PAID: "Paid Seat",
    WINDOW: "Window",
    AISLE: "Aisle",
  };
  
  return characteristics
    .map((c) => labels[c] || c)
    .filter(Boolean)
    .join(", ");
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
  const searchParams = useSearchParams();

  const selectedOffer = useBookingStore((s) => s.selectedOffer);
  const stepCompletion = useBookingStore((s) => s.stepCompletion);
  const passengers = useBookingStore((s) => s.passengers) as Passenger[];
  const seats = useBookingStore((s) => s.seats) as Array<{ passengerId: string; seatNumber: string; price: number }>;
  const pricing = useBookingStore((s) => s.pricing) as { currency: string };
  const addSeat = useBookingStore((s) => s.addSeat);
  const completeStep = useBookingStore((s) => s.completeStep);

  // Read flightOfferId from URL params (source of truth)
  const flightOfferIdFromUrl = searchParams.get("flightOfferId");

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

  // Seat map state
  const [seatMap, setSeatMap] = useState<NormalizedSeatMap | null>(null);
  const [loadingSeatMap, setLoadingSeatMap] = useState(true);
  const [seatMapError, setSeatMapError] = useState<string | null>(null);
  const [selectedCabin, setSelectedCabin] = useState<string>("");
  const [activePassengerId, setActivePassengerId] = useState<string>("");

  // Fetch seat map from Amadeus API
  useEffect(() => {
    // HARD GUARD: Do NOT fetch if flightOfferId is missing
    if (!flightOfferIdFromUrl) {
      setLoadingSeatMap(false);
      setSeatMapError("Missing flight offer. Please reselect your flight.");
      console.error("[SeatsPage] Missing flightOfferId in URL");
      return;
    }

    const fetchSeatMap = async (flightOfferId: string) => {
      setLoadingSeatMap(true);
      setSeatMapError(null);

      try {
        // Validate flightOfferId is defined
        if (!flightOfferId || typeof flightOfferId !== "string") {
          throw new Error(`Invalid flightOfferId: ${flightOfferId}`);
        }

        // Get full flight offer from store (required by Amadeus API)
        // CRITICAL: We MUST use selectedOffer.raw - this is the complete Amadeus object
        // selectedOffer itself is normalized and won't work with Seat Map API
        const flightOffer = selectedOffer?.raw;
        
        if (!flightOffer) {
          console.error("[SeatsPage] Missing raw flight offer", {
            hasSelectedOffer: !!selectedOffer,
            hasRaw: !!selectedOffer?.raw,
            selectedOfferKeys: selectedOffer ? Object.keys(selectedOffer) : [],
            flightOfferId,
          });
          throw new Error(`Raw flight offer not found in store. Please reselect your flight.`);
        }

        // Validate flightOffer has required Amadeus fields
        const offerId = flightOffer.id || flightOffer.flightOfferId;
        if (!offerId) {
          console.error("[SeatsPage] Flight offer missing ID", {
            flightOfferKeys: Object.keys(flightOffer),
            flightOfferId,
          });
          throw new Error(`Flight offer object missing ID. flightOfferId from URL: ${flightOfferId}`);
        }

        // Validate required Amadeus structure
        const hasItineraries = !!flightOffer.itineraries && Array.isArray(flightOffer.itineraries);
        const hasPrice = !!flightOffer.price && typeof flightOffer.price === 'object';
        const hasType = !!flightOffer.type;

        if (!hasItineraries || !hasPrice) {
          console.error("[SeatsPage] Flight offer missing required Amadeus fields", {
            hasType,
            hasItineraries,
            hasPrice,
            flightOfferKeys: Object.keys(flightOffer),
            flightOfferId,
          });
          throw new Error(`Flight offer is incomplete. Missing: ${!hasItineraries ? 'itineraries' : ''} ${!hasPrice ? 'price' : ''}. Please reselect your flight.`);
        }

        console.log("[SeatsPage] Flight offer validated", {
          type: flightOffer.type,
          id: flightOffer.id,
          hasItineraries,
          itinerariesCount: flightOffer.itineraries?.length,
          hasPrice,
          priceTotal: flightOffer.price?.total,
        });

        console.log("[SeatsPage] Fetching seat map", {
          flightOfferId,
          offerId,
          hasRaw: !!selectedOffer?.raw,
        });

        const response = await fetch(
          `/api/flights/seat-map?flightOfferId=${encodeURIComponent(flightOfferId)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              flightOffer, // Full offer object required by Amadeus
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `HTTP ${response.status}`;
          
          // Handle rate limiting (429) with user-friendly message
          if (response.status === 429) {
            errorMessage = "Seat map service is temporarily busy. Please wait a moment and try again.";
          } else if (response.status === 400 && errorData.errors) {
            // Handle Amadeus API errors
            const amadeusError = errorData.errors[0];
            if (amadeusError.code === 38194) {
              errorMessage = "Seat map service is temporarily busy. Please wait a moment and try again.";
            } else if (amadeusError.code === 477) {
              errorMessage = "Seat selection is not available for this flight. You can select seats during check-in.";
            } else {
              errorMessage = amadeusError.detail || amadeusError.title || errorMessage;
            }
          }
          
          console.error("[SeatsPage] API error response", {
            status: response.status,
            error: errorMessage,
            errorData,
            flightOfferId,
          });
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.ok) {
          const errorMessage = data.error || "Failed to fetch seat map";
          console.error("[SeatsPage] API returned not ok", {
            error: errorMessage,
            flightOfferId,
          });
          throw new Error(errorMessage);
        }

        if (!data.available || !data.seatMap) {
          // Seat map not available - this is not an error, just unavailable
          setSeatMapError(
            data.seatMap?.error || "Seat selection will be available at check-in"
          );
          setSeatMap(null);
        } else {
          setSeatMap(data.seatMap);
          // Select first cabin by default
          if (data.seatMap.cabins && data.seatMap.cabins.length > 0) {
            setSelectedCabin(data.seatMap.cabins[0].name);
          }
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[SeatsPage] Error fetching seat map:", message);
        setSeatMapError(message);
        setSeatMap(null);
      } finally {
        setLoadingSeatMap(false);
      }
    };

    fetchSeatMap(flightOfferIdFromUrl);
  }, [flightOfferIdFromUrl, selectedOffer]);

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
    addSeat({ passengerId, seatNumber: seatNo, price });
  };

  // Transform normalized seat to UI status
  const seatToUIStatus = (seat: NormalizedSeat, isSelected: boolean): "available" | "selected" | "unavailable" | "premium" => {
    if (isSelected) return "selected";
    if (seat.availability === "occupied" || seat.availability === "blocked") return "unavailable";
    // Premium if has PAID characteristic or is in premium cabin
    if (seat.characteristics.includes("PAID") || seat.price) return "premium";
    return "available";
  };

  // Get seats for current cabin, organized by row
  const seatsByRow = useMemo(() => {
    if (!seatMap || !selectedCabin) return new Map<number, NormalizedSeat[]>();

    const cabin = seatMap.cabins.find((c) => c.name === selectedCabin);
    if (!cabin) return new Map<number, NormalizedSeat[]>();

    const map = new Map<number, NormalizedSeat[]>();
    for (const seat of cabin.seats) {
      if (!map.has(seat.row)) {
        map.set(seat.row, []);
      }
      map.get(seat.row)!.push(seat);
    }

    return map;
  }, [seatMap, selectedCabin]);

  // Get all unique columns (seat letters) from the seat map
  const seatColumns = useMemo(() => {
    const columns = new Set<string>();
    seatsByRow.forEach((seats) => {
      seats.forEach((seat) => columns.add(seat.column));
    });
    return Array.from(columns).sort();
  }, [seatsByRow]);

  // Determine seat layout (left, center, right blocks)
  const getSeatBlocks = () => {
    // Standard 6-seat economy: A-B | aisle | C-D | aisle | E-F
    // Business/First: A-B | aisle | C-D (or similar)
    const allColumns = seatColumns;
    
    // Try to detect layout from columns
    if (allColumns.length === 6 && allColumns.join("") === "ABCDEF") {
      return {
        left: ["A", "B"],
        center: ["C", "D"],
        right: ["E", "F"],
      };
    } else if (allColumns.length === 4 && allColumns.join("") === "ABCD") {
      return {
        left: ["A", "B"],
        right: ["C", "D"],
        center: [],
      };
    } else {
      // Fallback: split columns into thirds
      const third = Math.ceil(allColumns.length / 3);
      return {
        left: allColumns.slice(0, third),
        center: allColumns.slice(third, third * 2),
        right: allColumns.slice(third * 2),
      };
    }
  };

  const seatBlocks = getSeatBlocks();

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

          {/* Loading State */}
          {loadingSeatMap && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-ec-teal animate-spin" />
              <span className="ml-3 text-white/80">Loading seat map...</span>
            </div>
          )}

          {/* Error State - Seat Map Not Available */}
          {!loadingSeatMap && seatMapError && (
            <div className="p-8 rounded-2xl border border-[rgba(200,162,77,0.3)] bg-[rgba(200,162,77,0.08)]">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-[#E3C77A] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {seatMapError.includes("rate limit") || seatMapError.includes("temporarily busy")
                      ? "Service Temporarily Unavailable"
                      : "Seat Selection Not Available"}
                  </h3>
                  <p className="text-white/80 mb-4">{seatMapError}</p>
                  {!seatMapError.includes("rate limit") && !seatMapError.includes("temporarily busy") && (
                    <p className="text-sm text-white/60">
                      You can select your seats during online check-in or at the airport. This will not affect your booking.
                    </p>
                  )}
                  {(seatMapError.includes("rate limit") || seatMapError.includes("temporarily busy")) && (
                    <p className="text-sm text-white/60">
                      The seat map service is experiencing high traffic. Please wait a moment and refresh the page, or continue to the next step and select seats during check-in.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Real Aircraft Cabin from Amadeus API */}
          {!loadingSeatMap && seatMap && seatMap.available && (
            <div className="overflow-x-auto pb-2">
              <div
                className="p-8 rounded-2xl min-w-[860px]"
                style={{
                  background: "rgba(15, 17, 20, 0.50)",
                  border: "2px solid rgba(28, 140, 130, 0.25)",
                  boxShadow: "inset 0 0 50px rgba(0,0,0,0.40), 0 0 30px rgba(28,140,130,0.10)",
                }}
              >
                {/* Cabin Selector (if multiple cabins) */}
                {seatMap.cabins.length > 1 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {seatMap.cabins.map((cabin) => (
                        <button
                          key={cabin.name}
                          type="button"
                          onClick={() => setSelectedCabin(cabin.name)}
                          className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                          style={{
                            background: selectedCabin === cabin.name
                              ? "rgba(28,140,130,0.25)"
                              : "rgba(255,255,255,0.06)",
                            border: selectedCabin === cabin.name
                              ? "1px solid rgba(28,140,130,0.50)"
                              : "1px solid rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.90)",
                          }}
                        >
                          {cabin.name} ({cabin.seats.length} seats)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                    {selectedCabin || seatMap.cabins[0]?.name || "Cabin"}
                    {seatMap.aircraft?.code && ` • ${seatMap.aircraft.code}`}
                  </span>
                </div>

                {/* Seat letters header */}
                {seatColumns.length > 0 && (
                  <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "56px 1fr" }}>
                    <div />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        {seatBlocks.left.map((col) => (
                          <HeaderSeatLetter key={col} letter={col} />
                        ))}
                        {seatBlocks.center.length > 0 && <div className="w-10" />}
                        {seatBlocks.center.map((col) => (
                          <HeaderSeatLetter key={col} letter={col} />
                        ))}
                        {seatBlocks.right.length > 0 && <div className="w-10" />}
                        {seatBlocks.right.map((col) => (
                          <HeaderSeatLetter key={col} letter={col} />
                        ))}
                      </div>
                      <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {activePassenger ? `Assigning for: ${activePassenger.firstName} ${activePassenger.lastName}` : ""}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rows: Row number on left, seats across */}
                <div className="space-y-2">
                  {Array.from(seatsByRow.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([row, seats]) => {
                      const getSeatByColumn = (col: string) =>
                        seats.find((s) => s.column === col);

                      const renderSeat = (col: string) => {
                        const seat = getSeatByColumn(col);
                        if (!seat) {
                          // Seat doesn't exist in this row (e.g., different cabin configuration)
                          return <div key={col} className="w-10 h-10" />;
                        }

                        const selected = activePassengerId
                          ? isSeatSelectedByPassenger(seat.seatNumber, activePassengerId)
                          : false;
                        const takenByOther = activePassengerId
                          ? seatTakenByOtherPassenger(seat.seatNumber, activePassengerId)
                          : false;

                        const ui = seatToUIStatus(seat, selected);
                        const disabled = seat.availability === "occupied" || seat.availability === "blocked" || takenByOther || !activePassengerId;

                        const seatPrice = seat.price?.amount || 0;
                        const seatPriceCurrency = seat.price?.currency || currency;
                        const characteristics = getSeatCharacteristicsLabel(seat.characteristics);

                        return (
                          <button
                            key={seat.seatNumber}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              if (!activePassengerId || disabled) return;
                              assignSeat(activePassengerId, seat.seatNumber, seatPrice);
                            }}
                            className="w-10 h-10 rounded-xl text-[11px] font-extrabold transition-all relative"
                            style={seatStyle(ui)}
                            onMouseEnter={(e) => {
                              if (disabled || selected) return;
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
                            aria-label={`Seat ${seat.seatNumber}`}
                            title={`${seat.seatNumber} • ${seatTypeFromLetter(seat.column)}${characteristics ? ` • ${characteristics}` : ""}${seatPrice > 0 ? ` • ${formatMoney(seatPriceCurrency, seatPrice)}` : " • Free"}`}
                          >
                            {(ui === "premium" || seat.characteristics.length > 0) && !selected && (
                              <span className="absolute -top-1 -right-1 text-[9px]" style={{ color: "#E3C77A" }}>
                                {seat.characteristics.includes("EXIT_ROW") ? "🚪" : "★"}
                              </span>
                            )}
                            {seat.column}
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
                              {seatBlocks.left.map(renderSeat)}
                            </div>

                            {/* Aisle gap */}
                            {seatBlocks.center.length > 0 && <div className="w-10" />}

                            {/* Center block */}
                            {seatBlocks.center.length > 0 && (
                              <div className="flex items-center gap-2">
                                {seatBlocks.center.map(renderSeat)}
                              </div>
                            )}

                            {/* Aisle gap */}
                            {seatBlocks.right.length > 0 && <div className="w-10" />}

                            {/* Right block */}
                            <div className="flex items-center gap-2">
                              {seatBlocks.right.map(renderSeat)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Selected Seats Chips */}
          <div className="mt-8 pt-8" style={{ borderTop: "1px solid rgba(28,140,130,0.20)" }}>
            <h3 className="text-lg font-semibold text-white mb-4">Selected Seats</h3>
            {seats.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.60)" }}>No seats selected yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {seats.map((s) => {
                  const passenger = passengers.find((p) => p.id === s.passengerId);
                  const letter = s.seatNumber.slice(-1);
                  const type = seatTypeFromLetter(letter);
                  
                  // Find seat characteristics from seat map if available
                  const seatData = seatMap?.cabins
                    .flatMap((c) => c.seats)
                    .find((seat) => seat.seatNumber === s.seatNumber);
                  const characteristics = seatData
                    ? getSeatCharacteristicsLabel(seatData.characteristics)
                    : "";

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
                          {type}
                          {characteristics && ` • ${characteristics}`}
                          {` • ${s.price > 0 ? formatMoney(currency, s.price) : "Free"}`}
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
            disabled={loadingSeatMap}
          >
            {loadingSeatMap ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={18} />
              </>
            )}
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
