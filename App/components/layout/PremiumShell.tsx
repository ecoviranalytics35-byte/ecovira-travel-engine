"use client";

import { ReactNode, useState, useEffect, useRef } from 'react';
import { EcoviraTabs } from '../EcoviraTabs';
import { Plane, Hotel, Car, CarTaxiFront, MessageCircle, Briefcase } from 'lucide-react';
import { EcoviraChatWidget } from '../chat/EcoviraChatWidget';
import { Footer } from './Footer';
import Link from 'next/link';

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
  const chatButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleChatButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChatOpen(true);
  };

  // Removed debug logging to prevent hydration warnings

  return (
    <div className="min-h-screen relative" style={{ overflow: 'visible' }}>
      {/* Premium Background - pointer-events: none to prevent blocking clicks */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10] via-[#0F1114] to-[#07080A]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(28,140,130,0.18),transparent_45%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(200,162,77,0.10),transparent_40%)]"></div>
      </div>

      {/* Header Bar */}
      <header className="relative z-20 border-b border-[rgba(255,255,255,0.08)] bg-ec-card/30 backdrop-blur-sm" style={{ pointerEvents: 'auto' }}>
        <div className="ec-container">
          <div className="flex items-center justify-between h-24 md:h-28 lg:h-32 xl:h-36">
            {/* Left: Logo */}
            <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div 
                className="text-transparent bg-clip-text bg-gradient-to-r from-[#C8A24D] via-[#E3C77A] to-[#C8A24D] font-serif font-bold tracking-tight leading-tight drop-shadow-[0_0_12px_rgba(200,162,77,0.5)]"
                style={{
                  fontSize: 'clamp(2.25rem, 6vw, 5rem)',
                  lineHeight: '1.1',
                  fontWeight: '700'
                }}
              >
                Ecovira Air
              </div>
            </a>

            {/* Center: Premium Tabs */}
            <div className="hidden md:flex items-center gap-6">
              <EcoviraTabs tabs={tabs} />
              <Link
                href="/my-trips"
                className="px-4 py-2 text-sm font-medium text-ec-muted hover:text-ec-text hover:bg-[rgba(28,140,130,0.1)] rounded-ec-sm transition-colors flex items-center gap-2"
              >
                <Briefcase size={16} />
                <span>My Trips</span>
              </Link>
            </div>

            {/* Right: Chat */}
            <div className="flex items-center gap-4 relative" style={{ zIndex: 99999, pointerEvents: 'auto' }}>
              <button
                ref={chatButtonRef}
                onClick={handleChatButtonClick}
                className="ec-chat-launcher w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 flex items-center justify-center text-ec-text rounded-full transition-all duration-300 relative bg-gradient-to-br from-[rgba(28,140,130,0.35)] to-[rgba(28,140,130,0.25)] border-2 border-[rgba(28,140,130,0.5)] shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.25),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_18px_rgba(28,140,130,0.6),0_0_32px_rgba(28,140,130,0.4),0_6px_24px_rgba(0,0,0,0.4)] hover:border-[rgba(28,140,130,0.7)] hover:from-[rgba(28,140,130,0.45)] hover:to-[rgba(28,140,130,0.35)] hover:scale-105 active:scale-95"
                style={{ 
                  pointerEvents: 'auto !important', 
                  zIndex: '99999 !important',
                  position: 'relative',
                  cursor: 'pointer',
                  width: 'clamp(4rem, 5vw, 5.5rem)',
                  height: 'clamp(4rem, 5vw, 5.5rem)'
                }}
                aria-label="Open 24/7 AI Assistant"
                type="button"
                tabIndex={0}
              >
                <MessageCircle size={28} className="md:w-8 md:h-8 lg:w-9 lg:h-9" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden pb-4">
            <div className="flex items-center gap-4">
              <EcoviraTabs tabs={tabs} className="overflow-x-auto flex-1" />
              <Link
                href="/my-trips"
                className="px-3 py-2 text-xs font-medium text-ec-muted hover:text-ec-text hover:bg-[rgba(28,140,130,0.1)] rounded-ec-sm transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                <Briefcase size={14} />
                <span>Trips</span>
              </Link>
            </div>
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

      {/* Global Footer */}
      <Footer />

      {/* 24/7 AI Chat Widget - Controlled by PremiumShell state */}
      <EcoviraChatWidget context={chatContext} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
