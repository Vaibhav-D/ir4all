"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether a CSS media query matches. False on the server and during
 * hydration, so callers must not derive markup from it that CSS could
 * decide instead; use it for values that only matter after mount.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia(query);
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
