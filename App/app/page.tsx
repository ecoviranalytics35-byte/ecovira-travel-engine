import Link from 'next/link';
import { EcoviraButton } from '../components/Button';
import { EcoviraCard } from '../components/EcoviraCard';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      {/* Premium Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10] via-[#0F1114] to-[#07080A]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(28,140,130,0.18),transparent_45%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(200,162,77,0.10),transparent_40%)]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h1 className="text-5xl md:text-6xl font-serif font-semibold text-ec-text mb-6">
            Ecovira
          </h1>
          <p className="text-xl text-ec-muted mb-8 max-w-2xl mx-auto">
            Luxury travel planning with intelligent concierge services.
            Discover flights, stays, and experiences curated for the discerning traveler.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <EcoviraButton asChild>
              <Link href="/flights">Plan Your Journey</Link>
            </EcoviraButton>
            <EcoviraButton variant="secondary" asChild>
              <Link href="/stays">Find Accommodation</Link>
            </EcoviraButton>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-serif font-semibold text-ec-text text-center mb-12">
            Our Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <EcoviraCard variant="glass" className="text-center p-8">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="text-xl font-serif font-medium text-ec-text mb-3">Premium Flights</h3>
              <p className="text-ec-muted mb-6">
                Access to global airlines with real-time pricing and exclusive deals.
              </p>
              <EcoviraButton variant="ghost" asChild>
                <Link href="/flights">Search Flights</Link>
              </EcoviraButton>
            </EcoviraCard>

            <EcoviraCard variant="glass" className="text-center p-8">
              <div className="text-4xl mb-4">🏨</div>
              <h3 className="text-xl font-serif font-medium text-ec-text mb-3">Luxury Stays</h3>
              <p className="text-ec-muted mb-6">
                Curated selection of premium hotels and resorts worldwide.
              </p>
              <EcoviraButton variant="ghost" asChild>
                <Link href="/stays">Find Hotels</Link>
              </EcoviraButton>
            </EcoviraCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ec-muted">
            © 2025 Ecovira. Luxury travel planning for the modern explorer.
          </p>
        </div>
      </footer>
    </main>
  );
}