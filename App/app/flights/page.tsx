"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { FlightResult } from "@/lib/core/types";
import { useEvent } from "@/lib/hooks/useEvent";
import { useBookingStore } from "@/stores/bookingStore";
import { EcoviraButton } from "../../components/Button";
import { Input } from "../../components/Input";
import { AirportInput } from "../../components/search/AirportInput";
import { EcoviraCard } from "../../components/EcoviraCard";
import { FlightResultCard } from "../../components/FlightResultCard";
import { DatePicker } from "../../components/DatePicker";
import { CurrencySelector } from "../../components/CurrencySelector";
import { useCurrency } from "../../contexts/CurrencyContext";
import { ResultsList } from "../../components/results/ResultsList";
import { ResultsLayout } from "../../components/results/ResultsLayout";
import { SegmentedToggle } from "../../components/ui/SegmentedToggle";
import { TripSummary } from "../../components/results/TripSummary";
import { FloatingAiAssist } from "../../components/ai/FloatingAiAssist";
import { SearchPanelSkeleton } from "../../components/search/SearchPanelSkeleton";

// Client-only SearchPanelShell (no SSR to prevent hydration errors from browser extensions)
const SearchPanelShellClient = dynamic(
  () => import("../../components/search/SearchPanelShell.client"),
  { 
    ssr: false,
    loading: () => <SearchPanelSkeleton />
  }
);

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-5 bg-ec-teal-border/20 rounded-lg w-3/4"></div>
      <div className="h-4 bg-ec-teal-border/10 rounded-lg w-1/2"></div>
      <div className="h-4 bg-ec-teal-border/10 rounded-lg w-2/3"></div>
    </div>
  );
}

function getDefaultDepartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function getDefaultReturnDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export default function Flights() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debugMode = searchParams.get("debug") === "1";
  const setSelectedOffer = useBookingStore((state) => state.setSelectedOffer);
  const [tripType, setTripType] = useState("roundtrip");
  const [from, setFrom] = useState("MEL");
  const [to, setTo] = useState("SYD");
  const [lastAutocompleteDebug, setLastAutocompleteDebug] = useState<AutocompleteDebugInfo | null>(null);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState("economy");
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FlightResult[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightResult | null>(null);

  useEffect(() => {
    if (!departDate) setDepartDate(getDefaultDepartDate());
  }, []);
  useEffect(() => {
    if (tripType === "roundtrip" && !returnDate) setReturnDate(getDefaultReturnDate());
  }, [tripType, returnDate]);

  const handleSearch = useCallback(async () => {
    const DEBUG_INGEST = process.env.NEXT_PUBLIC_DEBUG_INGEST_URL;
    console.log("[handleSearch] ENTER", { ts: Date.now(), from, to, departDate, returnDate, adults, cabinClass, currency, tripType });
    // #region agent log
    if (DEBUG_INGEST) {
      fetch(`${DEBUG_INGEST}/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({location:'flights/page.tsx:58',message:'[handleSearch] ENTER',data:{ts:Date.now(),from,to,departDate,returnDate,adults,cabinClass,currency,tripType},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'}),
        keepalive: true,
      }).catch(() => {});
    }
    // #endregion
    try {
      setLoading(true);
      setError("");
      setResults([]);
      
      const dep = departDate || getDefaultDepartDate();
      const ret = tripType === "roundtrip" ? (returnDate || getDefaultReturnDate()) : "";
      const url = `/api/flights/search?from=${from}&to=${to}&departDate=${dep}&adults=${adults}&cabinClass=${cabinClass}&currency=${currency}&tripType=${tripType}${ret ? `&returnDate=${ret}` : ""}`;
      console.log("[handleSearch] Fetching API", { url });
      // #region agent log
      if (DEBUG_INGEST) {
        fetch(`${DEBUG_INGEST}/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({location:'flights/page.tsx:65',message:'[handleSearch] Fetching API',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'}),
          keepalive: true,
        }).catch(() => {});
      }
      // #endregion
      
      const res = await fetch(url);
      const data = await res.json();

      console.log("[handleSearch] API response", { status: res.status, ok: res.ok, hasErrors: !!data.errors, resultsCount: data.results?.length || 0 });
      // #region agent log
      if (DEBUG_INGEST) {
        fetch(`${DEBUG_INGEST}/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({location:'flights/page.tsx:70',message:'[handleSearch] API response',data:{status:res.status,ok:res.ok,hasErrors:!!data.errors,resultsCount:data.results?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'select-fix',hypothesisId:'A'}),
          keepalive: true,
        }).catch(() => {});
      }
      // #endregion

      // Concierge Notice only on HTTP error (5xx / 4xx). Empty results = "No flights found".
      if (!res.ok) {
        const msg = data?.error || (data?.errors && data.errors[0]) || `Request failed (${res.status})`;
        setError(msg);
        setResults([]);
      } else {
        // Normalize results - ensure every result has a valid ID
        const normalizedResults = (data.results || []).map((result: FlightResult, index: number) => {
          if (!result.id) {
            const fallbackId = `normalized-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
            console.warn("[handleSearch] Result missing ID, using fallback", { result, fallbackId, index });
            // #region agent log
            if (DEBUG_INGEST) {
              fetch(`${DEBUG_INGEST}/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({location:'flights/page.tsx:84',message:'[handleSearch] Result missing ID, using fallback',data:{result,fallbackId,index},timestamp:Date.now(),sessionId:'debug-session',runId:'select-fix',hypothesisId:'D'}),
                keepalive: true,
              }).catch(() => {});
            }
            // #endregion
            return { ...result, id: fallbackId };
          }
          return result;
        });
        setResults(normalizedResults);
        setError("");
      }
    } catch (err) {
      console.error("[handleSearch] ERROR", err);
      // #region agent log
      if (DEBUG_INGEST) {
        fetch(`${DEBUG_INGEST}/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({location:'flights/page.tsx:81',message:'[handleSearch] ERROR',data:{error:err instanceof Error?err.message:'Unknown',errorStack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'C'}),
          keepalive: true,
        }).catch(() => {});
      }
      // #endregion
      setError("We encountered a network issue. Please try again.");
      throw err;
    } finally {
      setLoading(false);
      console.log("[handleSearch] EXIT");
      // #region agent log
      if (DEBUG_INGEST) {
        fetch(`${DEBUG_INGEST}/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({location:'flights/page.tsx:88',message:'[handleSearch] EXIT',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'}),
          keepalive: true,
        }).catch(() => {});
      }
      // #endregion
    }
  }, [from, to, departDate, returnDate, adults, cabinClass, currency, tripType]);

  // Use stable event handler for dynamic import compatibility
  const onSearch = useEvent(handleSearch);

  // Handle flight selection with router navigation - route to passengers page
  const handleSelectFlight = useCallback((f: FlightResult) => {
    console.log("🔵 [handleSelectFlight] FUNCTION CALLED", { flightId: f?.id, flight: f });
    console.log("[onSelect] received flight", f?.id);
    
    // Validate offer ID
    if (!f.id) {
      console.error("[onSelect] ERROR - Missing offer ID", { flight: f });
      setError("Cannot select flight: missing offer ID. Please try another option.");
      return;
    }
    
    // Persist selected flight to state
    setSelectedFlight(f);
    
    // Save to booking store (this also persists to sessionStorage)
    setSelectedOffer(f);
    console.log("[onSelect] Flight saved to booking store", { offerId: f.id });
    
    // Navigate to booking flow - start with passengers
    const passengersUrl = `/book/passengers`;
    console.log('[onSelect] Navigating to:', passengersUrl);
    console.log('[onSelect] Current URL:', typeof window !== 'undefined' ? window.location.href : 'server');
    
    // Use router.push for Next.js App Router navigation
    // This must happen synchronously after state persistence
    try {
      router.push(passengersUrl);
      console.log("[onSelect] router.push called successfully");
      
      // Verify navigation after a short delay
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          console.log("[onSelect] Navigation check - Current URL:", window.location.href);
          if (!window.location.href.includes('/book/passengers')) {
            console.warn("[onSelect] Navigation may have failed, using fallback");
            window.location.href = passengersUrl;
          }
        }
      }, 100);
    } catch (err) {
      console.error("[onSelect] router.push failed", err);
      // Fallback: direct navigation if router.push fails
      if (typeof window !== 'undefined') {
        console.log("[onSelect] Using fallback navigation");
        window.location.href = passengersUrl;
      }
    }
  }, [router, setSelectedOffer]);
  
  // Use stable handler - wrap in a function to ensure it's always called
  const onSelectFlight = useCallback((f: FlightResult) => {
    console.log("🔵 [onSelectFlight wrapper] Called", { flightId: f?.id });
    handleSelectFlight(f);
  }, [handleSelectFlight]);

  return (
    <>
      {/* Page Title */}
      <div className="mb-16 md:mb-20 lg:mb-24">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-ec-text mb-6">
          Search Flights
        </h1>
        <p className="text-ec-muted text-xl md:text-2xl mt-4">
          Enter your travel details below
        </p>
      </div>

      {/* Engine Search Card - Structured Layout (Client-only to prevent hydration errors) */}
      <SearchPanelShellClient
        ctaLabel="Search Flights →"
        onSearch={onSearch}
        loading={loading}
      >
        {/* Trip Type Toggle */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
            Trip Type
          </label>
          <SegmentedToggle
            options={[
              { value: "oneway", label: "One-Way" },
              { value: "roundtrip", label: "Round-Trip" },
            ]}
            value={tripType}
            onChange={setTripType}
          />
        </div>

        {/* Row 1: From | To */}
        <div className="ec-grid-2 mb-6">
          <AirportInput
            value={from}
            onChange={setFrom}
            placeholder="MEL"
            label="From"
            onDebugInfo={debugMode ? setLastAutocompleteDebug : undefined}
          />
          <AirportInput
            value={to}
            onChange={setTo}
            placeholder="SYD"
            label="To"
            onDebugInfo={debugMode ? setLastAutocompleteDebug : undefined}
          />
        </div>
        {debugMode && (
          <div className="mb-6">
            <DebugAutocompletePanel info={lastAutocompleteDebug} label="Airport autocomplete" />
          </div>
        )}

        {/* Row 2: Departure | Return */}
        <div className={tripType === "roundtrip" ? "ec-grid-2 mb-6" : "mb-6"}>
          <DatePicker
            value={departDate}
            onChange={setDepartDate}
            placeholder="Select departure date"
            label="Departure"
          />
          {tripType === "roundtrip" && (
            <DatePicker
              value={returnDate}
              onChange={setReturnDate}
              placeholder="Select return date"
              label="Return"
              minDate={departDate || getDefaultDepartDate()}
            />
          )}
        </div>

        {/* Row 3: Passengers | Cabin | Currency */}
        <div className="ec-grid-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Passengers
            </label>
            <Input 
              type="number" 
              value={adults} 
              onChange={e => setAdults(parseInt(e.target.value) || 1)} 
              min="1" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Cabin Class
            </label>
            <select
              value={cabinClass}
              onChange={e => setCabinClass(e.target.value)}
              className="w-full h-[52px] px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
          <CurrencySelector
            value={currency}
            onChange={setCurrency}
            showCrypto={true}
          />
        </div>
      </SearchPanelShellClient>

          {loading && (
            <div className="space-y-6 mt-12">
              {[...Array(3)].map((_, i) => (
                <EcoviraCard key={i} variant="glass" className="p-8 md:p-10">
                  <SkeletonLoader />
                </EcoviraCard>
              ))}
            </div>
          )}

          {error && (
            <EcoviraCard variant="glass" className="mt-12">
              <div className="text-center py-12 md:py-16 px-6">
                <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-4">
                  Concierge Notice
                </h3>
                <p className="text-lg text-ec-muted mb-8 max-w-xl mx-auto leading-relaxed">
                  We can't reach the flight engine right now. Please try again in a moment. If the issue persists, contact concierge support.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <EcoviraButton 
                    variant="primary" 
                    onClick={() => setError("")}
                    size="lg"
                    className="px-8 h-[52px]"
                  >
                    Retry
                  </EcoviraButton>
                  <EcoviraButton 
                    variant="secondary" 
                    onClick={() => router.push('/')}
                    size="lg"
                    className="px-8 h-[52px]"
                  >
                    Back to Home
                  </EcoviraButton>
                </div>
                <details className="mt-6 text-sm text-ec-dim">
                  <summary className="cursor-pointer hover:text-ec-muted transition-colors px-4 py-2">
                    Technical details
                  </summary>
                  <p className="mt-3 text-ec-muted max-w-md mx-auto text-left font-mono text-xs break-all">{error}</p>
                </details>
              </div>
            </EcoviraCard>
          )}

          {!loading && !error && results.length === 0 && (
            <EcoviraCard variant="glass" className="mt-12">
              <div className="text-center py-12 md:py-16 px-6">
                <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-4">
                  No flights found
                </h3>
                <p className="text-lg text-ec-muted mb-8 max-w-md mx-auto">
                  Try adjusting your search criteria or dates.
                </p>
                <EcoviraButton 
                  variant="secondary" 
                  onClick={() => setResults([])}
                  size="lg"
                  className="px-8 h-[52px]"
                >
                  Search Again
                </EcoviraButton>
              </div>
            </EcoviraCard>
          )}

          {results.length > 0 && (
            <ResultsLayout
              sidebar={
                <TripSummary
                  from={from}
                  to={to}
                  departDate={departDate}
                  returnDate={returnDate}
                  adults={adults}
                  cabinClass={cabinClass}
                  tripType={tripType}
                />
              }
            >
              <ResultsList
                title="Results"
                count={results.length}
                countLabel={results.length === 1 ? 'flight' : 'flights'}
                sortOptions={[
                  { value: 'price', label: 'Sort by Price' },
                  { value: 'duration', label: 'Sort by Duration' },
                  { value: 'departure', label: 'Sort by Departure' },
                ]}
                onSortChange={(value) => {
                  // TODO: Implement sorting
                  console.log('Sort by:', value);
                }}
              >
                {results.map((flight, i) => {
                  return (
                    <FlightResultCard 
                      key={flight.id || i} 
                      flight={flight} 
                      onSelect={onSelectFlight}
                    />
                  );
                })}
              </ResultsList>
            </ResultsLayout>
          )}

          {/* AI Assist - Always render when results exist */}
          {results.length > 0 && (
            <FloatingAiAssist
              type="flights"
              results={results}
              selectedFlight={selectedFlight || undefined}
              tripData={{
                from,
                to,
                departDate,
                returnDate,
                adults,
              }}
            />
          )}

    </>
  );
}