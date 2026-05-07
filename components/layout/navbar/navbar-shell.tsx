"use client";

import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

// Persists across soft navigations, resets on hard reload
let entranceDone = false;

export function NavbarShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (entranceDone) {
      // Suppress before browser paints — no visible flash
      el.style.animation = "none";
      return;
    }

    const onEnd = () => {
      entranceDone = true;
      if (ref.current) ref.current.style.animation = "none";
    };
    el.addEventListener("animationend", onEnd, { once: true });
    return () => el.removeEventListener("animationend", onEnd);
  }, []);

  return (
    <div className="site-header-root sticky top-0 z-50">
      <div ref={ref} className="animate-header-enter">
        {children}
      </div>
    </div>
  );
}
