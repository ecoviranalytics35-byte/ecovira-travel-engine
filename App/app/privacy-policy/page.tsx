"use client";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 md:py-16 px-4 md:px-6">
      <div className="rounded-ec-lg bg-ec-card border border-[rgba(28,140,130,0.22)] shadow-ec-card p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-ec-text mb-6">
          Privacy Policy
        </h1>
        <p className="text-ec-muted mb-8 text-sm">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8 text-ec-text">
          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">1. Introduction</h2>
            <p className="text-ec-muted leading-relaxed">
              Ecovira Air ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our travel booking engine.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-ec-muted">
              <div>
                <h3 className="text-lg font-medium text-ec-text mb-2">Search Data</h3>
                <p className="leading-relaxed">
                  When you search for flights, stays, cars, or transfers, we collect your search parameters (departure/arrival locations, dates, passenger counts, cabin class preferences). This data is used to provide search results and improve our service.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-ec-text mb-2">Currency Selection</h3>
                <p className="leading-relaxed">
                  Your currency and cryptocurrency preferences are stored locally in your browser (localStorage) to maintain your selection across sessions. This information is not transmitted to our servers unless you make a booking.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-ec-text mb-2">AI Assistant Usage</h3>
                <p className="leading-relaxed">
                  When you interact with our AI assistant chatbot, we may log your questions and responses to improve the service. This data is anonymized and used solely for service enhancement.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-ec-text mb-2">Chat Interactions</h3>
                <p className="leading-relaxed">
                  Chat conversations are processed in real-time and are not permanently stored. We may retain anonymized conversation data for analytics and service improvement.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">3. Cookies & Analytics</h2>
            <p className="text-ec-muted leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">4. Payment Processing</h2>
            <p className="text-ec-muted leading-relaxed">
              Payment processing is handled by third-party providers (e.g., Stripe, cryptocurrency payment processors). We do not store your payment card details or cryptocurrency wallet private keys. All payment data is encrypted and processed securely by our payment partners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">5. Data Security</h2>
            <p className="text-ec-muted leading-relaxed">
              We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">6. Third-Party Services</h2>
            <p className="text-ec-muted leading-relaxed">
              We use third-party services (Amadeus, airlines, hotels, car rental companies) to provide search results and bookings. These services have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">7. Your Rights</h2>
            <p className="text-ec-muted leading-relaxed">
              You have the right to access, correct, or delete your personal information. You can also opt out of certain data collection practices through your browser settings or by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-ec-text mb-4">8. Contact Us</h2>
            <p className="text-ec-muted leading-relaxed">
              If you have questions about this Privacy Policy, please contact us through our AI assistant or support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

