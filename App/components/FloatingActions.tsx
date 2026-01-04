"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Sparkles } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

export default function FloatingActions() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const openChat = useUIStore((s) => s.openChat);

  return (
    <>
      {/* Chat Launcher Button - Fixed independently for maximum clickability */}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-[999999] pointer-events-auto rounded-full text-white transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none w-12 h-12 flex items-center justify-center"
        style={{
          backgroundColor: '#14b8a6',
          boxShadow: "0 0 18px rgba(255,255,255,0.55)",
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999999,
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0d9488';
          e.currentTarget.style.boxShadow = "0 0 26px rgba(255,255,255,0.75)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#14b8a6';
          e.currentTarget.style.boxShadow = "0 0 18px rgba(255,255,255,0.55)";
        }}
        aria-label="24/7 AI Assistant"
        onClick={() => {
          console.log("CHAT LAUNCHER CLICKED");
          openChat();
        }}
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* My Trips Button - In container above chat widget */}
      <div 
        ref={containerRef}
        className="fixed bottom-40 right-6 z-[999998] flex flex-col gap-3 pointer-events-auto"
        style={{
          position: 'fixed',
          bottom: '160px',
          right: '24px',
          zIndex: 999998,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <button
        type="button"
        className="rounded-full text-white font-semibold transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none px-4 py-3"
        style={{
          backgroundColor: '#14b8a6',
          boxShadow: "0 0 18px rgba(255,255,255,0.55)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0d9488';
          e.currentTarget.style.boxShadow = "0 0 26px rgba(255,255,255,0.75)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#14b8a6';
          e.currentTarget.style.boxShadow = "0 0 18px rgba(255,255,255,0.55)";
        }}
        onClick={() => {
          router.push("/my-trips");
        }}
      >
        My Trips
      </button>
      </div>
    </>
  );
}

