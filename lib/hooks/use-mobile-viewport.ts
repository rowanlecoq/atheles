"use client";

import { mobileUiBaseline } from "lib/animation-config";
import { useEffect, useState } from "react";

export function useMobileViewport(breakpoint = mobileUiBaseline.breakpointMd) {
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return;
    }

    const mediaQueryList = window.matchMedia(
      `(max-width: ${breakpoint - 1}px)`,
    );
    const updateViewport = () => setIsMobileViewport(mediaQueryList.matches);

    updateViewport();
    mediaQueryList.addEventListener("change", updateViewport);
    return () => mediaQueryList.removeEventListener("change", updateViewport);
  }, [breakpoint]);

  return isMobileViewport;
}
