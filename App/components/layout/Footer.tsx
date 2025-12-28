"use client";

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-[rgba(255,255,255,0.08)] bg-ec-card/20 backdrop-blur-sm mt-16 md:mt-24">
      <div className="ec-container py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left text-xs text-ec-muted">
            © {currentYear} Ecovira. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-center">
            <Link 
              href="/privacy-policy" 
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.25)] to-[rgba(28,140,130,0.15)] border border-[rgba(28,140,130,0.4)] text-white shadow-[0_0_8px_rgba(28,140,130,0.3),0_0_16px_rgba(28,140,130,0.2)] hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.6)] hover:from-[rgba(28,140,130,0.35)] hover:to-[rgba(28,140,130,0.25)] transition-all duration-300"
              style={{ color: '#FFFFFF' }}
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-br from-[rgba(28,140,130,0.25)] to-[rgba(28,140,130,0.15)] border border-[rgba(28,140,130,0.4)] text-white shadow-[0_0_8px_rgba(28,140,130,0.3),0_0_16px_rgba(28,140,130,0.2)] hover:shadow-[0_0_12px_rgba(28,140,130,0.4),0_0_24px_rgba(28,140,130,0.3)] hover:border-[rgba(28,140,130,0.6)] hover:from-[rgba(28,140,130,0.35)] hover:to-[rgba(28,140,130,0.25)] transition-all duration-300"
              style={{ color: '#FFFFFF' }}
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

