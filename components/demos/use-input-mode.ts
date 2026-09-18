"use client";

import { useSyncExternalStore } from "react";

/** How the visitor points: a fine pointer (mouse, trackpad), a phone, or a tablet. */
export type InputMode = "pointer" | "phone" | "tablet";

const COARSE = "(hover: none) and (pointer: coarse)";
const WIDE = "(min-width: 768px)";

function read(): InputMode {
  if (typeof window === "undefined") return "pointer";
  if (!window.matchMedia(COARSE).matches) return "pointer";
  return window.matchMedia(WIDE).matches ? "tablet" : "phone";
}

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(COARSE), window.matchMedia(WIDE)];
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () => queries.forEach((q) => q.removeEventListener("change", onChange));
}

export function useInputMode(): InputMode {
  return useSyncExternalStore(subscribe, read, () => "pointer");
}
