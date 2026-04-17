"use client";

import { useEffect, useState } from "react";

// On iOS, overflow-x:hidden on body causes position:fixed elements to be
// positioned relative to the body rather than the viewport — so CSS
// background-attachment:fixed and ::before{position:fixed} both fail on zoom.
// A React-rendered fixed <div> has the same iOS quirk, BUT we can work around
// it by reading window.visualViewport and setting explicit top/left/width/height
// so the overlay always tracks the actual visible area regardless of zoom/scroll.

export function ThemeGradientOverlay() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (!isTouch) return;

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
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [isTouch]);

  if (!isTouch) return null;

  return (
    <div
      id="theme-gradient-overlay"
      aria-hidden="true"
      className="theme-gradient-overlay pointer-events-none"
      style={{ position: "fixed", inset: 0, zIndex: -1 }}
    />
  );
}
