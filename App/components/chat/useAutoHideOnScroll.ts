"use client";

import { useState, useEffect, useRef } from 'react';

interface UseAutoHideOnScrollOptions {
  threshold?: number;
  enabled?: boolean;
}

export function useAutoHideOnScroll({ 
  threshold = 10, 
  enabled = true 
}: UseAutoHideOnScrollOptions = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      if (ticking.current) return;

      ticking.current = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY || window.pageYOffset;
        const scrollDelta = currentScrollY - lastScrollY.current;

        // Only update if scroll delta exceeds threshold
        if (Math.abs(scrollDelta) >= threshold) {
          if (scrollDelta > 0) {
            // Scrolling down - hide
            setIsVisible(false);
          } else {
            // Scrolling up - show
            setIsVisible(true);
          }
          lastScrollY.current = currentScrollY;
        }

        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, threshold]);

  return { isVisible, setIsVisible };
}

