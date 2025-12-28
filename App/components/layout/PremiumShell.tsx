"use client";

import { ReactNode, useState } from 'react';
import { EcoviraTabs } from '../EcoviraTabs';
import { Plane, Hotel, Car, CarTaxiFront, MessageCircle } from 'lucide-react';
import { EcoviraChatWidget } from '../chat/EcoviraChatWidget';

interface PremiumShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  chatContext?: {
    page?: 'flights' | 'stays' | 'cars' | 'transfers';
    route?: { from?: string; to?: string };
    dates?: { depart?: string; return?: string };
    passengers?: number;
    cabin?: string;
    currency?: string;
    topFlights?: Array<{ price: string; duration: string; stops: string; from: string; to: string }>;
  };
}

const tabs = [
  { label: 'Flights', path: '/flights', icon: <Plane size={18} /> },
  { label: 'Stays', path: '/stays', icon: <Hotel size={18} /> },
  { label: 'Cars', path: '/cars', icon: <Car size={18} /> },
  { label: 'Transfers', path: '/transfers', icon: <CarTaxiFront size={18} /> },
];

export function PremiumShell({ children, rightPanel, chatContext }: PremiumShellProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen relative">
      {/* Premium Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10] via-[#0F1114] to-[#07080A]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(28,140,130,0.18),transparent_45%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(200,162,77,0.10),transparent_40%)]"></div>
      </div>

      {/* Header Bar */}
      <header className="relative z-20 border-b border-[rgba(255,255,255,0.08)] bg-ec-card/30 backdrop-blur-sm">
        <div className="ec-container">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left: Logo */}
            <a href="/" className="flex items-center gap-3">
              <div className="text-ec-gold text-xl font-serif font-semibold">
                Ecovira Air
              </div>
            </a>

            {/* Center: Premium Tabs */}
            <div className="hidden md:flex">
              <EcoviraTabs tabs={tabs} />
            </div>

            {/* Right: Chat */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsChatOpen(true)}
                className="w-9 h-9 flex items-center justify-center text-ec-muted hover:text-ec-text hover:bg-ec-card/50 rounded-ec-sm transition-colors relative z-50"
                style={{ pointerEvents: 'auto', zIndex: 50 }}
                aria-label="Open 24/7 AI Assistant"
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden pb-4">
            <EcoviraTabs tabs={tabs} className="overflow-x-auto" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10">
        <div className={`ec-container ec-page ${rightPanel ? 'grid grid-cols-1 lg:grid-cols-12 gap-12' : ''}`}>
          {rightPanel ? (
            <>
              <div className="lg:col-span-8">
                {children}
              </div>
              <div className="lg:col-span-4">
                <div className="sticky top-24">
                  {rightPanel}
                </div>
              </div>
            </>
          ) : (
            children
          )}
        </div>
      </main>

      {/* 24/7 AI Chat Widget - Controlled by PremiumShell state */}
      <EcoviraChatWidget context={chatContext} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
