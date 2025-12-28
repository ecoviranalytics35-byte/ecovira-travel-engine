"use client";

import { useState } from "react";
import Link from "next/link";

export default function Stays() {
  const [city, setCity] = useState("Melbourne");
  const [nights, setNights] = useState(2);
  const [adults, setAdults] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const url = `/api/stays/search?city=${city}&nights=${nights}&adults=${adults}`;
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
      <h1>Stays</h1>
      <div>
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
        <input type="number" value={nights} onChange={e => setNights(parseInt(e.target.value))} min="1" placeholder="Nights" />
        <input type="number" value={adults} onChange={e => setAdults(parseInt(e.target.value))} min="1" placeholder="Adults" />
        <button onClick={handleSearch} disabled={loading}>Search</button>
      </div>
      {loading && <p>Searching…</p>}
      {error && <p>Error: {error}</p>}
      {results.length === 0 && !loading && !error && <p>No stays returned.</p>}
      {results.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Nights</th>
              <th>Total</th>
              <th>Currency</th>
              <th>Provider</th>
            </tr>
          </thead>
          <tbody>
            {results.map((stay, i) => (
              <tr key={i}>
                <td>{stay.name}</td>
                <td>{stay.city}</td>
                <td>{stay.nights}</td>
                <td>{stay.total}</td>
                <td>{stay.currency}</td>
                <td>{stay.provider}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link href="/">Back to home</Link>
    </main>
  );
}