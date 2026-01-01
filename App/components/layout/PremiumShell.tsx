"use client";

import { ReactNode, useState, useEffect } from 'react';
import { EcoviraTabs } from '../EcoviraTabs';
import { Plane, Hotel, Car, CarTaxiFront } from 'lucide-react';
import { EcoviraChatWidget } from '../chat/EcoviraChatWidget';
import { Footer } from './Footer';

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
  
  // Listen for chat open events from FloatingActions component
  useEffect(() => {
    const handleChatOpen = () => {
      setIsChatOpen(true);
    };
    window.addEventListener('ecovira:chat:open', handleChatOpen as any);
    return () => window.removeEventListener('ecovira:chat:open', handleChatOpen as any);
  }, []);

  // Removed debug logging to prevent hydration warnings

  return (
    <>
      {/* Premium Background - pointer-events: none to prevent blocking clicks */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10] via-[#0F1114] to-[#07080A]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(28,140,130,0.18),transparent_45%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(200,162,77,0.10),transparent_40%)]"></div>
      </div>

      {/* Fixed Header + Navigation Container - matches floating buttons behavior */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10" 
        style={{ 
          pointerEvents: 'auto'
        }}
      >
        {/* Background with backdrop filter */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: -1
          }}
        />
        
        {/* Header Bar */}
        <header className="relative">
          <div className="ec-container">
            {/* Main Header Row - Logo Only */}
            <div className="flex items-center justify-between h-20 md:h-24 lg:h-28">
              {/* Left: Logo */}
              <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-[#C8A24D] via-[#E3C77A] to-[#C8A24D] font-serif font-bold tracking-tight leading-tight drop-shadow-[0_0_12px_rgba(200,162,77,0.5)]"
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 4rem)',
                    lineHeight: '1.1',
                    fontWeight: '700'
                  }}
                >
                  Ecovira Air
                </div>
              </a>

              {/* Right: Empty space (buttons moved to floating FABs) */}
              <div className="flex items-center gap-4 relative">
                {/* Empty space - buttons are now floating FABs */}
              </div>
            </div>
          </div>
        </header>

        {/* Tabs Bar - Desktop */}
        <div 
          className="hidden md:block relative border-b border-white/10"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <div className="ec-container">
            <div className="flex items-center justify-center py-4">
              <EcoviraTabs tabs={tabs} />
            </div>
          </div>
        </div>

        {/* Tabs Bar - Mobile */}
        <div 
          className="md:hidden relative border-b border-white/10"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <div className="ec-container">
            <div className="flex items-center gap-4 py-3">
              <EcoviraTabs tabs={tabs} className="overflow-x-auto flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Container - with padding-top to account for fixed header (h-20 + tabs on mobile, h-24/28 + tabs on desktop) */}
      <div className="relative z-10 pt-[160px] md:pt-[176px] lg:pt-[192px]">
        <main className={`ec-container ec-page ${rightPanel ? 'grid grid-cols-1 lg:grid-cols-12 gap-12' : ''}`}>
          {rightPanel ? (
            <>
              <div className="lg:col-span-8">
                {children}
              </div>
              <div className="lg:col-span-4">
                <div className="sticky top-32">
                  {rightPanel}
                </div>
              </div>
            </>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Global Footer */}
      <Footer />

      {/* 24/7 AI Chat Widget - Controlled by PremiumShell state */}
      <EcoviraChatWidget context={chatContext} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
