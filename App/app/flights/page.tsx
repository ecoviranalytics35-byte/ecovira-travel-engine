"use client";

import { useState } from "react";
import Link from "next/link";
import type { FlightResult } from "@/lib/core/types";
import { EcoviraButton } from "../../components/Button";
import { Input } from "../../components/Input";
import { EcoviraCard } from "../../components/EcoviraCard";
import { FlightResultCard } from "../../components/FlightResultCard";

function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-ec-border rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-ec-border rounded w-1/2"></div>
    </div>
  );
}

export default function Flights() {
  const [from, setFrom] = useState("MEL");
  const [to, setTo] = useState("SYD");
  const [departDate, setDepartDate] = useState("2026-01-15");
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState("economy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FlightResult[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const url = `/api/flights/search?from=${from}&to=${to}&departDate=${departDate}&adults=${adults}&cabinClass=${cabinClass}`;
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
    <main className="min-h-screen bg-ec-bg-secondary">
      {/* Hero Section */}
      <section className="bg-ec-bg-primary text-ec-text-primary py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="text-ec-gold-primary text-sm font-medium uppercase tracking-wider mb-4">
            Ecovira Air
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-6">
            Luxury flights, curated in seconds.
          </h1>
          <p className="text-lg text-ec-text-secondary mb-8 max-w-2xl mx-auto">
            Discover premium airlines with live pricing and concierge support.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-ec-text-muted">
            <span>Live pricing</span>
            <span>Secure checkout</span>
            <span>Concierge support</span>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 md:py-16 relative">
        <div className="max-w-4xl mx-auto px-6 md:px-10 relative">
          <EcoviraCard className="mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="md:col-span-2 lg:col-span-1">
              <EcoviraCard variant="glass-hover" className="p-4">
                <label className="block text-xs font-medium text-ec-teal-primary uppercase tracking-wider mb-3">From</label>
                <Input value={from} onChange={e => setFrom(e.target.value)} placeholder="MEL" className="bg-transparent border-0 text-ec-text-primary placeholder-ec-text-muted" />
              </EcoviraCard>
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <EcoviraCard variant="glass-hover" className="p-4">
                <label className="block text-xs font-medium text-ec-teal-primary uppercase tracking-wider mb-3">To</label>
                <Input value={to} onChange={e => setTo(e.target.value)} placeholder="SYD" className="bg-transparent border-0 text-ec-text-primary placeholder-ec-text-muted" />
              </EcoviraCard>
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <EcoviraCard variant="glass-hover" className="p-4">
                <label className="block text-xs font-medium text-ec-teal-primary uppercase tracking-wider mb-3">Departure</label>
                <Input type="date" value={departDate} onChange={e => setDepartDate(e.target.value)} className="bg-transparent border-0 text-ec-text-primary" />
              </EcoviraCard>
            </div>
            <div className="md:col-span-1 lg:col-span-1">
              <EcoviraCard variant="glass-hover" className="p-4">
                <label className="block text-xs font-medium text-ec-teal-primary uppercase tracking-wider mb-3">Adults</label>
                <Input type="number" value={adults} onChange={e => setAdults(parseInt(e.target.value))} min="1" className="bg-transparent border-0 text-ec-text-primary" />
              </EcoviraCard>
            </div>
            <div className="md:col-span-1 lg:col-span-1">
              <EcoviraCard variant="glass-hover" className="p-4">
                <label className="block text-xs font-medium text-ec-teal-primary uppercase tracking-wider mb-3">Class</label>
                <select
                  value={cabinClass}
                  onChange={e => setCabinClass(e.target.value)}
                  className="w-full bg-transparent border-0 text-ec-text-primary focus:outline-none"
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First</option>
                </select>
              </EcoviraCard>
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <EcoviraButton onClick={handleSearch} disabled={loading} size="lg" className="px-12 py-4 text-lg">
              {loading ? 'Searching...' : 'Search Flights'} →
            </EcoviraButton>
          </div>
        </EcoviraCard>

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <EcoviraCard key={i} className="p-6">
                <SkeletonLoader />
              </EcoviraCard>
            ))}
          </div>
        )}

        {error && (
          <EcoviraCard className="border-ec-teal-border-hover bg-ec-bg-glass-hover">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-serif font-medium text-ec-text-primary mb-2">
                Concierge Notice
              </h3>
              <p className="text-ec-text-secondary mb-6">
                We can't reach the flight engine right now. Please try again in a moment.
              </p>
              <div className="flex justify-center gap-4">
                <EcoviraButton variant="secondary" onClick={() => setError("")}>
                  Retry
                </EcoviraButton>
                <details className="text-sm text-ec-text-muted">
                  <summary className="cursor-pointer hover:text-ec-text-primary">Technical details</summary>
                  <p className="mt-2">{error}</p>
                </details>
              </div>
            </div>
          </EcoviraCard>
        )}

        {!loading && !error && results.length === 0 && (
          <EcoviraCard>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✈️</div>
              <h3 className="text-xl font-serif font-medium text-ec-text-primary mb-2">No flights found</h3>
              <p className="text-ec-text-secondary mb-4">Try adjusting your search criteria or dates.</p>
              <EcoviraButton variant="secondary" onClick={() => setResults([])}>Search Again</EcoviraButton>
            </div>
          </EcoviraCard>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((flight, i) => (
              <FlightResultCard key={i} flight={flight} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-ec-teal-primary hover:text-ec-teal-hover">Back to home</Link>
        </div>
      </div>
    </section>
    </main>
  );
}