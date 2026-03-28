"use client";

import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return;
    }

    const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
    const updatePreference = () =>
      setPrefersReducedMotion(mediaQueryList.matches);

    updatePreference();
    mediaQueryList.addEventListener("change", updatePreference);
    return () => mediaQueryList.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}
