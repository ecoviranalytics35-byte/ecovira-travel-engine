"use client";
import { useLayoutEffect, useRef, useCallback } from "react";

/**
 * Stable event handler hook for use with dynamically imported components.
 * Ensures the handler always calls the latest version of the function,
 * avoiding closure issues with dynamic imports.
 */
export function useEvent<T extends (...args: any[]) => any>(handler: T): T {
  const ref = useRef<T>(handler);
  
  useLayoutEffect(() => {
    ref.current = handler;
  }, [handler]);

  return useCallback(((...args: any[]) => ref.current(...args)) as T, []);
}

