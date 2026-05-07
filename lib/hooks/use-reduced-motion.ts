"use client";

import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return false;
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
    const updatePreference = () => setPrefersReducedMotion(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", updatePreference);
    return () => mediaQueryList.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}
