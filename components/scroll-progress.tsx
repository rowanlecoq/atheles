"use client";

import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const progress = el.scrollTop / (el.scrollHeight - el.clientHeight) || 0;
      if (barRef.current) {
        barRef.current.style.transform = `translateX(${(progress - 1) * 100}%)`;
      }
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      ref={barRef}
      className="pointer-events-none fixed left-0 top-0 z-40 h-[2px] w-full bg-brand-gold/60"
      style={{ transform: "translateX(-100%)" }}
    />
  );
}
