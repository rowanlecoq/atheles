"use client";

import { useEffect } from "react";

// On iOS, background-attachment:fixed doesn't render correctly so we paint
// the gradient on a fixed <div> instead. The div always renders (no useState)
// to avoid a dark flash between SSR and hydration.
//
// z-index:0 (not -1) avoids an iOS compositing bug where negative-z-index
// fixed elements can flash or disappear during scroll/zoom.
//
// We track visualViewport resize (zoom level changes) so the overlay scales
// with pinch-zoom, but we intentionally skip the scroll listener — it fired
// during normal pan and caused the gradient layer to visibly stutter.

export function ThemeGradientOverlay() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const el = document.getElementById("theme-gradient-overlay");
    if (!el) return;

    const update = () => {
      const vvp = window.visualViewport;
      if (!vvp) return;
      el.style.top = `${vvp.offsetTop}px`;
      el.style.left = `${vvp.offsetLeft}px`;
      el.style.width = `${vvp.width}px`;
      el.style.height = `${vvp.height}px`;
    };

    update();
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      id="theme-gradient-overlay"
      aria-hidden="true"
      className="theme-gradient-overlay pointer-events-none"
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
    />
  );
}
