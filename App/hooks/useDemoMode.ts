"use client";

import { useState, useEffect, useCallback } from 'react';

const DEMO_MODE_KEY = 'ecovira_demo_mode';
const DEMO_MODE_COOKIE = 'ecovira_demo_mode';

/**
 * Hook to manage demo mode state across the application
 * Persists via localStorage and cookie for session continuity
 */
export function useDemoMode() {
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(false);

  // Initialize from URL param, cookie, or localStorage
  useEffect(() => {
    // Check URL param first
    const urlParams = new URLSearchParams(window.location.search);
    const urlDemo = urlParams.get('demo');
    if (urlDemo === 'true' || urlDemo === '1') {
      setIsDemoModeState(true);
      persistDemoMode(true);
      return;
    }

    // Check localStorage
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    if (stored === 'true') {
      setIsDemoModeState(true);
      return;
    }

    // Check cookie
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${DEMO_MODE_COOKIE}=`));
    if (cookieValue?.split('=')[1] === 'true') {
      setIsDemoModeState(true);
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      return;
    }

    setIsDemoModeState(false);
  }, []);

  const persistDemoMode = useCallback((value: boolean) => {
    localStorage.setItem(DEMO_MODE_KEY, value ? 'true' : 'false');
    // Set cookie (expires in 24 hours)
    const expires = new Date();
    expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000);
    document.cookie = `${DEMO_MODE_COOKIE}=${value}; expires=${expires.toUTCString()}; path=/`;
  }, []);

  const setIsDemoMode = useCallback((value: boolean) => {
    setIsDemoModeState(value);
    persistDemoMode(value);
  }, [persistDemoMode]);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(!isDemoMode);
  }, [isDemoMode, setIsDemoMode]);

  return {
    isDemoMode,
    setIsDemoMode,
    toggleDemoMode,
  };
}

