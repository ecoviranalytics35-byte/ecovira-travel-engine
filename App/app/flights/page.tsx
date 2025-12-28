"use client";

import { useState } from "react";
import Link from "next/link";
import type { FlightResult } from "@/lib/core/types";

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
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Flights</h1>
      <div>
        <input value={from} onChange={e => setFrom(e.target.value)} placeholder="From" />
        <input value={to} onChange={e => setTo(e.target.value)} placeholder="To" />
        <input type="date" value={departDate} onChange={e => setDepartDate(e.target.value)} />
        <input type="number" value={adults} onChange={e => setAdults(parseInt(e.target.value))} min="1" placeholder="Adults" />
        <select value={cabinClass} onChange={e => setCabinClass(e.target.value)}>
          <option value="economy">Economy</option>
          <option value="premium_economy">Premium Economy</option>
          <option value="business">Business</option>
          <option value="first">First</option>
        </select>
        <button onClick={handleSearch} disabled={loading}>Search</button>
      </div>
      {loading && <p>Searching…</p>}
      {error && <p>Error: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Date</th>
            <th>Price</th>
            <th>Currency</th>
            <th>Provider</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 && !loading && <tr><td colSpan={6}>No live flights found for this route/date.</td></tr>}
          {results.map((flight, i) => (
            <tr key={i}>
              <td>{flight.from}</td>
              <td>{flight.to}</td>
              <td>{flight.departDate}</td>
              <td>{flight.price}</td>
              <td>{flight.currency}</td>
              <td>{flight.provider}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link href="/">Back to home</Link>
    </main>
  );
}