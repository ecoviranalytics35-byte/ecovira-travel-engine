"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { StayResult } from "@/lib/core/types";
import { useEvent } from "@/lib/hooks/useEvent";
import { EcoviraButton } from "../../components/Button";
import { Input } from "../../components/Input";
import { EcoviraCard } from "../../components/EcoviraCard";
import { DatePicker } from "../../components/DatePicker";
import { CurrencySelector } from "../../components/CurrencySelector";
import { useCurrency } from "../../contexts/CurrencyContext";
import { ResultsList } from "../../components/results/ResultsList";
import { ResultsLayout } from "../../components/results/ResultsLayout";
import { StayResultCard } from "../../components/results/StayResultCard";
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
      <div className="h-5 bg-[rgba(28,140,130,0.1)] rounded-lg w-3/4"></div>
      <div className="h-4 bg-[rgba(28,140,130,0.05)] rounded-lg w-1/2"></div>
    </div>
  );
}

export default function Stays() {
  const router = useRouter();
  const [city, setCity] = useState("Melbourne");
  const [checkIn, setCheckIn] = useState("2025-12-28");
  const [nights, setNights] = useState(2);
  const [checkOut, setCheckOut] = useState<string>("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomType, setRoomType] = useState("double");
  const [classType, setClassType] = useState("standard");
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<StayResult[]>([]);
  const [selectedStay, setSelectedStay] = useState<StayResult | null>(null);

  // Helper function to add days to an ISO date string (client-side safe)
  const addDays = useCallback((iso: string, days: number): string => {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }, []);

  // Calculate checkOut from checkIn + nights
  useEffect(() => {
    if (checkIn && nights > 0) {
      try {
        const checkOutStr = addDays(checkIn, nights);
        setCheckOut(checkOutStr);
      } catch (error) {
        console.error('Error calculating check-out date:', error);
        setCheckOut("");
      }
    } else {
      setCheckOut("");
    }
  }, [checkIn, nights, addDays]);

  const handleSearch = useCallback(async () => {
    console.log("[handleSearch] ENTER", { ts: Date.now(), city, checkIn, nights, adults, children, roomType, classType });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stays/page.tsx:52',message:'[handleSearch] ENTER',data:{ts:Date.now(),city,checkIn,nights,adults,children,roomType,classType},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
    // #endregion
    try {
      setLoading(true);
      setError("");
      setResults([]);
      
      const params = new URLSearchParams({
        city,
        checkIn,
        nights: nights.toString(),
        adults: adults.toString(),
        children: children.toString(),
        roomType,
        classType,
      });
      const url = `/api/stays/search?${params.toString()}`;
      console.log("[handleSearch] Fetching API", { url });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stays/page.tsx:66',message:'[handleSearch] Fetching API',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      
      const res = await fetch(url);
      const data = await res.json();
      
      console.log("[handleSearch] API response", { status: res.status, ok: res.ok, hasErrors: !!data.errors, resultsCount: data.results?.length || 0 });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stays/page.tsx:74',message:'[handleSearch] API response',data:{status:res.status,ok:res.ok,hasErrors:!!data.errors,resultsCount:data.results?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      
      if (data.errors && data.errors.length > 0) {
        setError(data.errors[0]);
        setResults([]);
      } else {
        setResults(data.results || []);
        setError("");
      }
    } catch (err) {
      console.error("[handleSearch] ERROR", err);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stays/page.tsx:85',message:'[handleSearch] ERROR',data:{error:err instanceof Error?err.message:'Unknown',errorStack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'C'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      setError("We encountered a network issue. Please try again.");
      throw err;
    } finally {
      setLoading(false);
      console.log("[handleSearch] EXIT");
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stays/page.tsx:93',message:'[handleSearch] EXIT',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'useEvent-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
    }
  }, [city, checkIn, nights, adults, children, roomType, classType]);

  // Use stable event handler for dynamic import compatibility
  const onSearch = useEvent(handleSearch);

  // Handle stay selection with router navigation
  const handleSelectStay = useCallback((s: StayResult) => {
    // Always compute checkOut from checkIn + nights if not already set
    const computedCheckOut = checkOut || (checkIn && nights > 0 ? addDays(checkIn, nights) : "");
    
    console.log("[onSelectStay] ENTER", { stayId: s.id, checkIn, checkOut: computedCheckOut, nights, adults, currency, ts: Date.now() });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stays/page.tsx:147',message:'[onSelectStay] ENTER',data:{stayId:s.id,checkIn,checkOut:computedCheckOut,nights,adults,currency,ts:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'checkout-compute-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
    // #endregion
    try {
      setSelectedStay(s);
      const params = new URLSearchParams({
        stayId: s.id,
        ...(checkIn && { checkIn }),
        ...(computedCheckOut && { checkOut: computedCheckOut }),
        ...(adults && { adults: adults.toString() }),
        ...(nights && { rooms: "1" }), // Default to 1 room
        ...(currency && { currency }),
      });
      const checkoutUrl = `/checkout/stay?${params.toString()}`;
      console.log("[onSelectStay] Navigating to checkout", { checkoutUrl, stayId: s.id, checkIn, checkOut: computedCheckOut, adults, currency });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stays/page.tsx:161',message:'[onSelectStay] Navigating to checkout',data:{checkoutUrl,stayId:s.id,checkIn,checkOut:computedCheckOut,adults,currency},timestamp:Date.now(),sessionId:'debug-session',runId:'checkout-compute-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      router.push(checkoutUrl);
      console.log("[onSelectStay] EXIT - navigated to checkout");
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stays/page.tsx:166',message:'[onSelectStay] EXIT - navigated',data:{stayId:s.id,checkIn,checkOut:computedCheckOut},timestamp:Date.now(),sessionId:'debug-session',runId:'checkout-compute-fix',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
    } catch (err) {
      console.error("[onSelectStay] ERROR", err);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'stays/page.tsx:171',message:'[onSelectStay] ERROR',data:{error:err instanceof Error?err.message:'Unknown',errorStack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'checkout-compute-fix',hypothesisId:'C'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
      // #endregion
      throw err;
    }
  }, [router, checkIn, checkOut, nights, adults, currency, addDays]);
  
  const onSelectStay = useEvent(handleSelectStay);

  return (
    <>
      {/* Page Title */}
      <div className="mb-16 md:mb-20 lg:mb-24">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-ec-text mb-6">
          Search Stays
        </h1>
        <p className="text-ec-muted text-xl md:text-2xl mt-4">
          Enter your accommodation details below
        </p>
      </div>

      {/* Engine Search Card - Structured Layout (Client-only to prevent hydration errors) */}
      <SearchPanelShellClient
        ctaLabel="Search Stays →"
        onSearch={onSearch}
        loading={loading}
      >
        {/* Row 1: City | Check-in | Check-out */}
        <div className="ec-grid-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              City
            </label>
            <Input 
              value={city} 
              onChange={e => setCity(e.target.value)} 
              placeholder="Melbourne" 
            />
          </div>
          <DatePicker
            value={checkIn}
            onChange={setCheckIn}
            placeholder="Select check-in date"
            label="Check-in"
          />
          <DatePicker
            value={checkOut}
            onChange={setCheckOut}
            placeholder="Select check-out date"
            label="Check-out"
          />
        </div>

        {/* Row 2: Nights | Adults | Children */}
        <div className="ec-grid-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Nights
            </label>
            <Input 
              type="number" 
              value={nights} 
              onChange={e => setNights(parseInt(e.target.value) || 1)} 
              min="1" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Adults
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
              Children
            </label>
            <Input 
              type="number" 
              value={children} 
              onChange={e => setChildren(parseInt(e.target.value) || 0)} 
              min="0" 
            />
          </div>
        </div>

        {/* Row 3: Room Type | Class | Currency */}
        <div className="ec-grid-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={e => setRoomType(e.target.value)}
              className="w-full h-[52px] px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all"
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="suite">Suite</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Class
            </label>
            <select
              value={classType}
              onChange={e => setClassType(e.target.value)}
              className="w-full h-[52px] px-4 bg-[rgba(15,17,20,0.55)] border border-[rgba(28,140,130,0.22)] rounded-ec-md text-ec-text focus:outline-none focus:border-[rgba(28,140,130,0.55)] focus:shadow-[0_0_0_4px_rgba(28,140,130,0.18)] transition-all"
            >
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="luxury">Luxury</option>
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
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <EcoviraCard key={i} variant="glass" className="p-6 md:p-8">
              <SkeletonLoader />
            </EcoviraCard>
          ))}
        </div>
      )}

      {error && (
        <EcoviraCard variant="glass" className="mb-8">
          <div className="text-center py-12 md:py-16 px-6">
            <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-4">
              Concierge Notice
            </h3>
            <p className="text-lg text-ec-muted mb-8 max-w-xl mx-auto leading-relaxed">
              We can't reach the stays engine right now. Please try again in a moment. If the issue persists, contact concierge support.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <EcoviraButton 
                variant="primary" 
                onClick={() => setError("")}
                size="lg"
                className="px-8"
              >
                Retry
              </EcoviraButton>
              <EcoviraButton 
                variant="secondary" 
                onClick={() => router.push('/')}
                size="lg"
                className="px-8"
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
        <EcoviraCard variant="glass" className="text-center py-12 md:py-16 px-6">
          <h3 className="text-2xl md:text-3xl font-serif font-semibold text-ec-text mb-4">
            No stays found
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
        </EcoviraCard>
      )}

      {results.length > 0 && (
        <>
          <ResultsLayout sidebar={null}>
            <ResultsList
              title="Results"
              count={results.length}
              countLabel={results.length === 1 ? 'stay' : 'stays'}
              sortOptions={[
                { value: 'price', label: 'Sort by Price' },
                { value: 'rating', label: 'Sort by Rating' },
              ]}
              onSortChange={(value) => {
                // TODO: Implement sorting
                console.log('Sort by:', value);
              }}
            >
              {results.map((stay, i) => (
                <StayResultCard 
                  key={i} 
                  stay={stay} 
                  onSelect={onSelectStay}
                />
              ))}
            </ResultsList>
          </ResultsLayout>
          <FloatingAiAssist
            type="stays"
            results={results}
            selectedStay={selectedStay || undefined}
            tripData={{
              nights,
              adults,
            }}
          />
        </>
      )}
    </>
  );
}
