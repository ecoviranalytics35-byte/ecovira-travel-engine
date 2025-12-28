"use client";

import { useState } from "react";
import Link from "next/link";

export default function Flights() {
  const [from, setFrom] = useState("MEL");
  const [to, setTo] = useState("SYD");
  const [departDate, setDepartDate] = useState("2026-01-15");
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState("economy");
  const [tripType, setTripType] = useState("oneway");
  const [returnDate, setReturnDate] = useState("");
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const params = new URLSearchParams({
        from,
        to,
        departDate,
        adults: adults.toString(),
        cabinClass,
        tripType,
        children: children.toString(),
        infants: infants.toString(),
      });
      if (tripType === "return" && returnDate) {
        params.set("returnDate", returnDate);
      }
      const url = `/api/flights/search?${params.toString()}`;
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
        <input value={from} onChange={e => setFrom(e.target.value)} placeholder="From (IATA)" />
        <input value={to} onChange={e => setTo(e.target.value)} placeholder="To (IATA)" />
        <input type="date" value={departDate} onChange={e => setDepartDate(e.target.value)} />
        <input type="number" value={adults} onChange={e => setAdults(parseInt(e.target.value))} min="1" placeholder="Adults" />
        <select value={cabinClass} onChange={e => setCabinClass(e.target.value)}>
          <option value="economy">Economy</option>
          <option value="premium_economy">Premium Economy</option>
          <option value="business">Business</option>
          <option value="first">First</option>
        </select>
        <select value={tripType} onChange={e => setTripType(e.target.value)}>
          <option value="oneway">One-way</option>
          <option value="return">Return</option>
        </select>
        {tripType === "return" && (
          <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} placeholder="Return date" />
        )}
        <input type="number" value={children} onChange={e => setChildren(parseInt(e.target.value))} min="0" placeholder="Children" />
        <input type="number" value={infants} onChange={e => setInfants(parseInt(e.target.value))} min="0" placeholder="Infants" />
        <button onClick={handleSearch} disabled={loading}>Search</button>
      </div>
      {loading && <p>Searching…</p>}
      {error && <p>Error: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Price</th>
            <th>Currency</th>
            <th>Offer ID</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 && !loading && <tr><td colSpan="4">No flights returned.</td></tr>}
          {results.map((flight, i) => (
            <tr key={i}>
              <td>{flight.provider}</td>
              <td>{flight.price}</td>
              <td>{flight.currency}</td>
              <td>{flight.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link href="/">Back to home</Link>
    </main>
  );
}