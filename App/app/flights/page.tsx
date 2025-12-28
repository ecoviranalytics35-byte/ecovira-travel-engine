"use client";

import { useState } from "react";
import Link from "next/link";
import type { FlightResult } from "@/lib/core/types";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";

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
    <main className="min-h-screen bg-ec-bg p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-semibold text-ec-ink mb-8">Find Your Flight</h1>

        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-ec-ink-2 mb-2">From</label>
              <Input value={from} onChange={e => setFrom(e.target.value)} placeholder="MEL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ec-ink-2 mb-2">To</label>
              <Input value={to} onChange={e => setTo(e.target.value)} placeholder="SYD" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ec-ink-2 mb-2">Departure</label>
              <Input type="date" value={departDate} onChange={e => setDepartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ec-ink-2 mb-2">Adults</label>
              <Input type="number" value={adults} onChange={e => setAdults(parseInt(e.target.value))} min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ec-ink-2 mb-2">Class</label>
              <select
                value={cabinClass}
                onChange={e => setCabinClass(e.target.value)}
                className="w-full px-4 py-3 bg-ec-surface border border-ec-border rounded-ec-md text-ec-ink focus:outline-none focus:ring-2 focus:ring-ec-teal/20"
              >
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
              {loading ? 'Searching...' : 'Search Flights'}
            </Button>
          </div>
        </Card>

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <SkeletonLoader />
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="border-ec-error/20 bg-ec-error/5">
            <p className="text-ec-error">{error}</p>
          </Card>
        )}

        {!loading && !error && results.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✈️</div>
              <h3 className="text-xl font-serif font-medium text-ec-ink mb-2">No flights found</h3>
              <p className="text-ec-muted mb-4">Try adjusting your search criteria or dates.</p>
              <Button variant="secondary" onClick={() => setResults([])}>Search Again</Button>
            </div>
          </Card>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((flight, i) => (
              <Card key={i} className="hover:shadow-ec-2 transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-lg font-medium">{flight.from} → {flight.to}</span>
                      <Badge>{flight.provider}</Badge>
                    </div>
                    <p className="text-ec-ink-2">{flight.departDate}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-serif font-semibold text-ec-gold">
                      {flight.currency} {flight.price}
                    </div>
                    <p className="text-sm text-ec-muted">per person</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-ec-teal hover:underline">← Back to home</Link>
        </div>
      </div>
    </main>
  );
}