"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { FlightResult } from "@/lib/core/types";
import { useEvent } from "@/lib/hooks/useEvent";
import { EcoviraButton } from "../../components/Button";
import { Input } from "../../components/Input";
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

export default function Flights() {
  const router = useRouter();
  const [tripType, setTripType] = useState("roundtrip");
  const [from, setFrom] = useState("MEL");
  const [to, setTo] = useState("SYD");
  const [departDate, setDepartDate] = useState("2026-01-15");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState("economy");
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FlightResult[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightResult | null>(null);

  const handleSearch = useCallback(async () => {
    console.log("[handleSearch] ENTER", { ts: Date.now(), from, to, departDate, returnDate, adults, cabinClass, currency, tripType });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:58',message:'[handleSearch] ENTER',data:{ts:Date.now(),from,to,departDate,returnDate,adults,cabinClass,currency,tripType},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
    // #endregion
    try {
      setLoading(true);
      setError("");
      setResults([]);
      
      const url = `/api/flights/search?from=${from}&to=${to}&departDate=${departDate}&adults=${adults}&cabinClass=${cabinClass}&currency=${currency}&tripType=${tripType}${tripType === "roundtrip" && returnDate ? `&returnDate=${returnDate}` : ''}`;
      console.log("[handleSearch] Fetching API", { url });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:65',message:'[handleSearch] Fetching API',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      
      const res = await fetch(url);
      const data = await res.json();
      
      console.log("[handleSearch] API response", { status: res.status, ok: res.ok, hasErrors: !!data.errors, resultsCount: data.results?.length || 0 });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:70',message:'[handleSearch] API response',data:{status:res.status,ok:res.ok,hasErrors:!!data.errors,resultsCount:data.results?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'select-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      
      if (data.errors && data.errors.length > 0) {
        setError(data.errors[0]);
        setResults([]);
      } else {
        // Normalize results - ensure every result has a valid ID
        const normalizedResults = (data.results || []).map((result: FlightResult, index: number) => {
          if (!result.id) {
            const fallbackId = `normalized-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
            console.warn("[handleSearch] Result missing ID, using fallback", { result, fallbackId, index });
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:84',message:'[handleSearch] Result missing ID, using fallback',data:{result,fallbackId,index},timestamp:Date.now(),sessionId:'debug-session',runId:'select-fix',hypothesisId:'D'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
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
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:81',message:'[handleSearch] ERROR',data:{error:err instanceof Error?err.message:'Unknown',errorStack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'C'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      setError("We encountered a network issue. Please try again.");
      throw err;
    } finally {
      setLoading(false);
      console.log("[handleSearch] EXIT");
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:88',message:'[handleSearch] EXIT',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
    }
  }, [from, to, departDate, returnDate, adults, cabinClass, currency, tripType]);

  // Use stable event handler for dynamic import compatibility
  const onSearch = useEvent(handleSearch);

  // Handle flight selection with router navigation
  const handleSelectFlight = useCallback((f: FlightResult) => {
    console.log("[handleSelectFlight] ENTER", { flightId: f.id, offerId: f.id, fullOffer: f, ts: Date.now() });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:107',message:'[handleSelectFlight] ENTER',data:{flightId:f.id,offerId:f.id,fullOffer:f,ts:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'select-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
    // #endregion
    
    // Validate offer ID
    if (!f.id) {
      console.error("[handleSelectFlight] ERROR - Missing offer ID", { flight: f });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:112',message:'[handleSelectFlight] ERROR - Missing offer ID',data:{flight:f},timestamp:Date.now(),sessionId:'debug-session',runId:'select-fix',hypothesisId:'D'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      setError("Cannot select flight: missing offer ID. Please try another option.");
      return;
    }
    
    try {
      setSelectedFlight(f);
      const checkoutUrl = `/checkout/flight?offerId=${encodeURIComponent(f.id)}`;
      console.log("[handleSelectFlight] Navigating to checkout", { checkoutUrl, offerId: f.id });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:120',message:'[handleSelectFlight] Navigating to checkout',data:{checkoutUrl,offerId:f.id},timestamp:Date.now(),sessionId:'debug-session',runId:'select-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      router.push(checkoutUrl);
      console.log("[handleSelectFlight] EXIT - navigated to checkout");
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:123',message:'[handleSelectFlight] EXIT - navigated',data:{offerId:f.id},timestamp:Date.now(),sessionId:'debug-session',runId:'select-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
    } catch (err) {
      console.error("[handleSelectFlight] ERROR", err);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flights/page.tsx:127',message:'[handleSelectFlight] ERROR',data:{error:err instanceof Error?err.message:'Unknown',errorStack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'select-fix',hypothesisId:'C'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      setError(`Failed to select flight: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  }, [router]);
  
  const onSelectFlight = useEvent(handleSelectFlight);

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
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              From
            </label>
            <Input 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
              placeholder="MEL" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              To
            </label>
            <Input 
              value={to} 
              onChange={e => setTo(e.target.value)} 
              placeholder="SYD" 
            />
          </div>
        </div>

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
                {results.map((flight, i) => (
                  <FlightResultCard 
                    key={i} 
                    flight={flight} 
                    onSelect={onSelectFlight}
                  />
                ))}
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