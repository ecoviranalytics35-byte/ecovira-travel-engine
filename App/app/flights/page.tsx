"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FlightResult } from "@/lib/core/types";
import { EcoviraButton } from "../../components/Button";
import { Input } from "../../components/Input";
import { EcoviraCard } from "../../components/EcoviraCard";
import { FlightResultCard } from "../../components/FlightResultCard";
import { DatePicker } from "../../components/DatePicker";
import { CurrencySelector } from "../../components/CurrencySelector";
import { useCurrency } from "../../contexts/CurrencyContext";
import { SearchPanelShell } from "../../components/search/SearchPanelShell";
import { ResultsList } from "../../components/results/ResultsList";
import { ResultsLayout } from "../../components/results/ResultsLayout";
import { SegmentedToggle } from "../../components/ui/SegmentedToggle";
import { FlightCalculator } from "../../components/calculators/FlightCalculator";
import { TripSummary } from "../../components/results/TripSummary";

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

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const url = `/api/flights/search?from=${from}&to=${to}&departDate=${departDate}&adults=${adults}&cabinClass=${cabinClass}&currency=${currency}&tripType=${tripType}${tripType === "roundtrip" && returnDate ? `&returnDate=${returnDate}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.errors && data.errors.length > 0) {
        setError(data.errors[0]);
        setResults([]);
      } else {
        setResults(data.results);
        setError("");
      }
    } catch (err) {
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
          Search Flights
        </h1>
        <p className="text-ec-muted text-xl md:text-2xl mt-4">
          Enter your travel details below
        </p>
      </div>

      {/* Engine Search Card - Structured Layout */}
      <SearchPanelShell
        ctaLabel="Search Flights →"
        onSearch={handleSearch}
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
      </SearchPanelShell>

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
                <>
                  <TripSummary
                    from={from}
                    to={to}
                    departDate={departDate}
                    returnDate={returnDate}
                    adults={adults}
                    cabinClass={cabinClass}
                    tripType={tripType}
                  />
                  <FlightCalculator results={results} />
                </>
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
                  <FlightResultCard key={i} flight={flight} />
                ))}
              </ResultsList>
            </ResultsLayout>
          )}

    </>
  );
}