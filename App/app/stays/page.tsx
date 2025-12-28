"use client";

import { useState } from "react";
import Link from "next/link";

export default function Stays() {
  const [city, setCity] = useState("Melbourne");
  const [checkIn, setCheckIn] = useState("2026-01-15");
  const [nights, setNights] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [currency, setCurrency] = useState("AUD");
  const [budgetPerNight, setBudgetPerNight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const params = new URLSearchParams({
        city,
        checkIn,
        nights: nights.toString(),
        adults: adults.toString(),
        children: children.toString(),
        rooms: rooms.toString(),
        currency,
      });
      if (budgetPerNight) {
        params.set("budgetPerNight", budgetPerNight);
      }
      const url = `/api/stays/search?${params.toString()}`;
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
        <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
        <input type="number" value={nights} onChange={e => setNights(parseInt(e.target.value))} min="1" placeholder="Nights" />
        <input type="number" value={adults} onChange={e => setAdults(parseInt(e.target.value))} min="1" placeholder="Adults" />
        <input type="number" value={children} onChange={e => setChildren(parseInt(e.target.value))} min="0" placeholder="Children" />
        <input type="number" value={rooms} onChange={e => setRooms(parseInt(e.target.value))} min="1" placeholder="Rooms" />
        <select value={currency} onChange={e => setCurrency(e.target.value)}>
          <option value="AUD">AUD</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
        <input type="number" value={budgetPerNight} onChange={e => setBudgetPerNight(e.target.value)} placeholder="Budget per night (optional)" />
        <button onClick={handleSearch} disabled={loading}>Search</button>
      </div>
      {loading && <p>Searching…</p>}
      {error && <p>Error: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>City</th>
            <th>Name</th>
            <th>Nights</th>
            <th>Total</th>
            <th>Currency</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 && !loading && <tr><td colSpan="6">No stays returned.</td></tr>}
          {results.map((stay, i) => (
            <tr key={i}>
              <td>{stay.provider}</td>
              <td>{stay.city}</td>
              <td>{stay.name}</td>
              <td>{stay.nights}</td>
              <td>{stay.total}</td>
              <td>{stay.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link href="/">Back to home</Link>
    </main>
  );
}