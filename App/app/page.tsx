import Link from 'next/link';
import { EcoviraButton } from '../components/Button';
import { Card } from '../components/Card';

export default function Home() {
  return (
    <main className="min-h-screen bg-ec-bg">
      {/* Hero Section */}
      <section className="bg-ec-night text-ec-bg py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h1 className="text-5xl font-serif font-semibold mb-6">
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
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-serif font-semibold text-ec-ink text-center mb-12">
            Our Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="text-center">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="text-xl font-serif font-medium text-ec-ink mb-3">Premium Flights</h3>
              <p className="text-ec-ink-2 mb-6">
                Access to global airlines with real-time pricing and exclusive deals.
              </p>
              <Button variant="tertiary" asChild>
                <Link href="/flights">Search Flights</Link>
              </Button>
            </Card>

            <Card className="text-center">
              <div className="text-4xl mb-4">🏨</div>
              <h3 className="text-xl font-serif font-medium text-ec-ink mb-3">Luxury Stays</h3>
              <p className="text-ec-ink-2 mb-6">
                Curated selection of premium hotels and resorts worldwide.
              </p>
              <Button variant="tertiary" asChild>
                <Link href="/stays">Find Stays</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ec-night text-ec-bg py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ec-muted">
            © 2025 Ecovira. Luxury travel planning for the modern explorer.
          </p>
        </div>
      </footer>
    </main>
  );
}