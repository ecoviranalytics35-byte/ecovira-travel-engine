import "./globals.css";
import type { Metadata } from "next";
import { PremiumShell } from "../components/layout/PremiumShell";
import { CurrencyProvider } from "../contexts/CurrencyContext";
import { TripProvider } from "../contexts/TripContext";
import FloatingActions from "../components/FloatingActions";

export const metadata: Metadata = {
  title: "Ecovira - Luxury Travel Planning",
  description: "Premium travel booking platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <CurrencyProvider>
          <TripProvider>
            <PremiumShell>
              {children}
            </PremiumShell>
            <FloatingActions />
          </TripProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}