"use client";

import { useRef, useEffect } from 'react';
import { SearchPanelShell } from './SearchPanelShell';
import type { SearchPanelShellProps } from './SearchPanelShell';

// Client-only wrapper that shows skeleton while mounting
export default function SearchPanelShellClient(props: SearchPanelShellProps) {
  // Use ref to track if this is the first mount to prevent remount loop
  const hasMountedRef = useRef(false);
  
  // Only log on actual mount (first render), not on every prop change
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      console.log('[SearchPanelShellClient] Mounted (first time only)');
    }
  }, []); // Empty deps - only run on mount

  return <SearchPanelShell {...props} />;
}

