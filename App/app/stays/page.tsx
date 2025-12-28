import Link from "next/link";

export default function Stays() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Stays</h1>
      <p>Stays search coming next</p>

      <p style={{ marginTop: 16 }}>
        <a href="/api/stays/search?city=Melbourne&nights=3&adults=2&debug=1">
          Test stays API (debug)
        </a>
      </p>

      <Link href="/">Back to home</Link>
    </main>
  );
}