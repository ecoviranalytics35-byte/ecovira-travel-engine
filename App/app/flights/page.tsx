"use client";

import { useState } from "react";
import Link from "next/link";

export default function Flights() {
  const [from, setFrom] = useState("MEL");
  const [to, setTo] = useState("SYD");
  const [departDate, setDepartDate] = useState("2026-01-15");
  const [adults, setAdults] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const url = `/api/flights/search?from=${from}&to=${to}&departDate=${departDate}&adults=${adults}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setResults(data.results);
      } else {
        setError(data.error);
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
        <input type="number" value={adults} onChange={e => setAdults(parseInt(e.target.value))} min="1" />
        <button onClick={handleSearch} disabled={loading}>Search</button>
      </div>
      {loading && <p>Searching…</p>}
      {error && <p>Error: {error}</p>}
      {results.length === 0 && !loading && !error && <p>No flights returned.</p>}
      {results.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
              <th>Price</th>
              <th>Currency</th>
              <th>Provider</th>
            </tr>
          </thead>
          <tbody>
            {results.map((flight, i) => (
              <tr key={i}>
                <td>{flight.id}</td>
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
      )}
      <Link href="/">Back to home</Link>
    </main>
  );
}