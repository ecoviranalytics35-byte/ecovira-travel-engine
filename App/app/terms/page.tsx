"use client";

import { EcoviraCard } from '@/components/EcoviraCard';

export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto py-12 md:py-16 px-4 md:px-6">
      <EcoviraCard variant="glass" className="p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-ec-text mb-6">
          Terms & Conditions
        </h1>
        <p className="text-ec-muted mb-8 text-sm">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8 text-ec-text">
          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">1. Acceptance of Terms</h2>
            <p className="text-ec-muted leading-relaxed">
              By using Ecovira Air's travel booking engine, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">2. Search & Booking Process</h2>
            <p className="text-ec-muted leading-relaxed">
              Our platform provides a search interface for flights, hotels, car rentals, and transfers. Search results are provided by third-party suppliers (airlines, hotels, car rental companies, transfer providers). We act as an intermediary and do not directly provide travel services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">3. Prices Subject to Change</h2>
            <p className="text-ec-muted leading-relaxed">
              All prices displayed are subject to change without notice. Prices may vary based on availability, currency exchange rates, and supplier policies. Final prices will be confirmed at the time of booking.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">4. Service Fees</h2>
            <p className="text-ec-muted leading-relaxed">
              Ecovira Air charges a service fee for bookings. This fee is clearly displayed before you complete your booking. Service fees are non-refundable unless otherwise stated in our refund policy or required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">5. AI Insights Are Advisory Only</h2>
            <p className="text-ec-muted leading-relaxed">
              Our AI assistant provides recommendations, insights, and value scores based on available data. These insights are advisory only and do not constitute guarantees, warranties, or professional advice. You are responsible for making your own travel decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">6. Supplier Rules Apply</h2>
            <p className="text-ec-muted leading-relaxed">
              All bookings are subject to the terms and conditions of the respective suppliers (airlines, hotels, car rental companies, transfer providers). This includes cancellation policies, baggage allowances, check-in requirements, and other rules. We are not responsible for supplier policies or changes to bookings made directly with suppliers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">7. Currency & Cryptocurrency Disclaimers</h2>
            <div className="space-y-4 text-ec-muted">
              <p className="leading-relaxed">
                <strong className="text-ec-text">Currency Conversion:</strong> Currency conversions are estimates based on current exchange rates. Actual prices may vary at the time of booking or payment.
              </p>
              <p className="leading-relaxed">
                <strong className="text-ec-text">Cryptocurrency Payments:</strong> Cryptocurrency payments are subject to market volatility. We do not provide investment advice or guarantee cryptocurrency values. Cryptocurrency transactions are irreversible once confirmed.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">8. Limitation of Liability</h2>
            <p className="text-ec-muted leading-relaxed">
              To the maximum extent permitted by law, Ecovira Air is not liable for any indirect, incidental, special, or consequential damages arising from your use of our service, including but not limited to travel delays, cancellations, lost bookings, or supplier failures. Our total liability is limited to the amount of service fees paid by you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">9. Booking Confirmation</h2>
            <p className="text-ec-muted leading-relaxed">
              Bookings are confirmed only after payment is processed and you receive a confirmation email or ticket. We are not responsible for bookings that fail due to payment processing errors, supplier unavailability, or technical issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">10. Changes & Cancellations</h2>
            <p className="text-ec-muted leading-relaxed">
              Changes and cancellations are subject to supplier policies and may incur fees. We will assist you with changes or cancellations, but final decisions and fees are determined by the supplier.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">11. Contact & Support</h2>
            <p className="text-ec-muted leading-relaxed">
              For questions, support, or disputes, please contact us through our AI assistant or support channels. We will respond to inquiries within a reasonable timeframe.
            </p>
          </section>
        </div>
      </EcoviraCard>
    </div>
  );
}

