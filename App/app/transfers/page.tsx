"use client";

import { useState } from "react";
import type { TransferResult } from "@/lib/core/types";
import { Input } from '../../components/Input';
import { DatePicker } from '../../components/DatePicker';
import { CurrencySelector } from '../../components/CurrencySelector';
import { SearchPanelShell } from '../../components/search/SearchPanelShell';
import { useCurrency } from '../../contexts/CurrencyContext';
import { ResultsList } from '../../components/results/ResultsList';
import { TransferResultCard } from '../../components/results/TransferResultCard';
import { FloatingAiAssist } from '../../components/ai/FloatingAiAssist';
import { TestModeBanner } from '../../components/ui/TestModeBanner';
import { getCoordinates } from '@/lib/utils/geocoding';

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-5 bg-[rgba(28,140,130,0.1)] rounded-lg w-3/4"></div>
      <div className="h-4 bg-[rgba(28,140,130,0.05)] rounded-lg w-1/2"></div>
    </div>
  );
}

export default function Transfers() {
  const { currency, setCurrency } = useCurrency();
  const [fromLocation, setFromLocation] = useState("Melbourne Airport");
  const [toLocation, setToLocation] = useState("Melbourne CBD");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [passengers, setPassengers] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<TransferResult[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferResult | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const fromCoords = getCoordinates(fromLocation);
      const toCoords = getCoordinates(toLocation);
      
      if (!fromCoords || !toCoords) {
        setError("Please enter valid locations");
        setLoading(false);
        return;
      }

      if (!date) {
        setError("Please select a date");
        setLoading(false);
        return;
      }

      // Format datetime: YYYY-MM-DDTHH:mm
      const dateTime = `${date}T${time}`;

      const params = new URLSearchParams({
        startLat: fromCoords.lat.toString(),
        startLng: fromCoords.lng.toString(),
        endLat: toCoords.lat.toString(),
        endLng: toCoords.lng.toString(),
        dateTime,
        adults: passengers.toString(),
      });
      const url = `/api/transport/transfers/search?${params.toString()}`;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'transfers/page.tsx:handleSearch',message:'Starting transfers search',data:{url,fromLocation,toLocation,date,time,passengers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const res = await fetch(url);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'transfers/page.tsx:handleSearch',message:'Received response',data:{status:res.status,statusText:res.statusText,ok:res.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const data = await res.json();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'transfers/page.tsx:handleSearch',message:'Parsed response data',data:{hasErrors:!!data.errors,errors:data.errors,resultsCount:data.results?.length||0,hasResults:!!data.results},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (data.errors && data.errors.length > 0) {
        setError(data.errors[0]);
        setResults([]);
      } else {
        setResults(data.results || []);
        setError("");
      }
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a3f3cc4d-6349-48a5-b343-1b11936ca0b1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'transfers/page.tsx:handleSearch',message:'Search failed with error',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setError("We encountered a network issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page Title */}
      <div className="mb-16 md:mb-20 lg:mb-24">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-ec-text mb-6">
          Search Transfers
        </h1>
        <p className="text-ec-muted text-xl md:text-2xl mt-4">
          Premium airport and hotel transfers
        </p>
      </div>

      {/* Test Mode Banner */}
      <TestModeBanner />

      {/* Engine Search Card - Structured Layout */}
      <SearchPanelShell
        ctaLabel="Search Transfers →"
        onSearch={handleSearch}
        loading={loading}
      >
        {/* Row 1: From | To */}
        <div className="ec-grid-2 mb-6">
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              From
            </label>
            <Input 
              value={fromLocation} 
              onChange={e => setFromLocation(e.target.value)} 
              placeholder="Airport or Address (e.g., MEL, Melbourne Airport)" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              To
            </label>
            <Input 
              value={toLocation} 
              onChange={e => setToLocation(e.target.value)} 
              placeholder="Hotel or Address (e.g., Melbourne CBD)" 
            />
          </div>
        </div>

        {/* Row 2: Date | Time | Passengers | Currency */}
        <div className="ec-grid-4 mb-6">
          <DatePicker
            value={date}
            onChange={setDate}
            placeholder="Select date"
            label="Date"
          />
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Time
            </label>
            <Input 
              type="time" 
              value={time} 
              onChange={e => setTime(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ec-muted uppercase tracking-[0.12em] mb-3">
              Passengers
            </label>
            <Input 
              type="number" 
              value={passengers} 
              onChange={e => setPassengers(parseInt(e.target.value) || 1)} 
              placeholder="1-8" 
            />
          </div>
          <CurrencySelector
            value={currency}
            onChange={setCurrency}
            showCrypto={true}
          />
        </div>
      </SearchPanelShell>

      {/* Error Message */}
      {error && (
        <div className="mt-8 p-4 bg-[rgba(220,38,38,0.15)] border border-[rgba(220,38,38,0.3)] rounded-ec-md text-ec-text">
          {error}
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="mt-12 space-y-4">
          <SkeletonLoader />
          <SkeletonLoader />
          <SkeletonLoader />
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <ResultsList
            title="Transfer Results"
            count={results.length}
          >
            {results.map((transfer) => (
              <TransferResultCard
                key={transfer.id}
                transfer={transfer}
                onSelect={(t) => {
                  setSelectedTransfer(t);
                }}
              />
            ))}
          </ResultsList>
          <FloatingAiAssist
            type="transfers"
            results={results}
            selectedTransfer={selectedTransfer}
            chatContext={{
              page: 'transfers',
              currency,
              route: { from: fromLocation, to: toLocation },
            }}
          />
        </>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="mt-12 text-center py-16">
          <p className="text-lg text-ec-muted">
            Enter your search criteria above and click "Search Transfers" to find available transfers.
          </p>
        </div>
      )}
    </>
  );
}

