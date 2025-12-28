"use client";

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-[rgba(255,255,255,0.08)] bg-ec-card/20 backdrop-blur-sm mt-16 md:mt-24">
      <div className="ec-container py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ec-muted">
          <div className="text-center md:text-left">
            © {currentYear} Ecovira. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-center">
            <Link 
              href="/privacy-policy" 
              className="hover:text-ec-text transition-colors duration-200 underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <span className="text-ec-dim">|</span>
            <Link 
              href="/terms" 
              className="hover:text-ec-text transition-colors duration-200 underline-offset-4 hover:underline"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

