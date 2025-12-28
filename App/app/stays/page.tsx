"use client";

import { useState } from "react";
import Link from "next/link";
import type { StayResult } from "@/lib/core/types";

export default function Stays() {
  const [city, setCity] = useState("Melbourne");
  const [checkIn, setCheckIn] = useState("2025-12-28");
  const [nights, setNights] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomType, setRoomType] = useState("double");
  const [classType, setClassType] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<StayResult[]>([]);

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
        roomType,
        classType,
      });
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
        <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
        <input type="number" value={nights} onChange={e => setNights(parseInt(e.target.value))} min="1" placeholder="Nights" />
        <input type="number" value={adults} onChange={e => setAdults(parseInt(e.target.value))} min="1" placeholder="Adults" />
        <input type="number" value={children} onChange={e => setChildren(parseInt(e.target.value))} min="0" placeholder="Children" />
        <select value={roomType} onChange={e => setRoomType(e.target.value)}>
          <option value="single">Single</option>
          <option value="double">Double</option>
          <option value="suite">Suite</option>
        </select>
        <select value={classType} onChange={e => setClassType(e.target.value)}>
          <option value="standard">Standard</option>
          <option value="deluxe">Deluxe</option>
          <option value="luxury">Luxury</option>
        </select>
        <button onClick={handleSearch} disabled={loading}>Search</button>
      </div>
      {loading && <p>Searching…</p>}
      {error && <p>Error: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>City</th>
            <th>Check-in</th>
            <th>Nights</th>
            <th>Room Type</th>
            <th>Class</th>
            <th>Total</th>
            <th>Currency</th>
            <th>Provider</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 && !loading && <tr><td colSpan={9}>No stays returned.</td></tr>}
          {results.map((stay, i) => (
            <tr key={i}>
              <td>{stay.name}</td>
              <td>{stay.city}</td>
              <td>{stay.checkIn}</td>
              <td>{stay.nights}</td>
              <td>{stay.roomType}</td>
              <td>{stay.classType}</td>
              <td>{stay.total}</td>
              <td>{stay.currency}</td>
              <td>{stay.provider}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link href="/">Back to home</Link>
    </main>
  );
}