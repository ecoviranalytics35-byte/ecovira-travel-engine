import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Ecovira Air & Stays (v2)</h1>
      <p>✅ Base setup is working.</p>
      <ul>
        <li><Link href="/flights">Flights</Link></li>
        <li><Link href="/stays">Stays</Link></li>
      </ul>
    </main>
  );
}