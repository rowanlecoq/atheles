"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const defaultAnnouncements = [
  "to ascend.",
  "coming soon. this summer.",
  "authentic superiority.",
  "follow us at @atheles.co to share your aesthetic.",
];

export function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState(defaultAnnouncements);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch announcements from Shopify metafield
  useEffect(() => {
    fetch("/api/admin/announcements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.announcements?.length > 0) {
          setAnnouncements(d.announcements);
        }
      })
      .catch(() => {});
  }, []);

  const advance = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
      setTransitioning(false);
    }, 400);
  }, [announcements.length]);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(advance, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, advance]);

  return (
    <div className="relative flex h-8 items-center justify-center overflow-hidden border-b border-brand-dark-gold/20 bg-brand-dark">
      {/* Pure CSS transition — no framer-motion, no hydration flash */}
      <p
        className="px-8 text-xs uppercase tracking-[0.18em] text-brand-dark-gold transition-all duration-[400ms] ease-in-out sm:text-[11px] sm:tracking-[0.25em]"
        style={{
          opacity: transitioning ? 0 : 1,
          filter: transitioning ? "blur(4px)" : "blur(0px)",
        }}
      >
        {announcements[index]}
      </p>

      {/* Pause / Play */}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play announcements" : "Pause announcements"}
        className="absolute right-3 flex h-5 w-5 items-center justify-center text-brand-dark-gold/40 transition-colors hover:text-brand-dark-gold sm:right-4"
      >
        {paused ? (
          <svg viewBox="0 0 10 12" fill="currentColor" className="h-2.5 w-2.5">
            <path d="M0 0l10 6-10 6z" />
          </svg>
        ) : (
          <svg viewBox="0 0 10 12" fill="currentColor" className="h-2.5 w-2.5">
            <rect x="0" y="0" width="3" height="12" />
            <rect x="7" y="0" width="3" height="12" />
          </svg>
        )}
      </button>
    </div>
  );
}
