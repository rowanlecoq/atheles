"use client";

import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { WavyDivider } from "components/wavy-divider";

const DEFAULT_ANNOUNCEMENTS = [
  "to ascend.",
  "coming soon. this summer.",
  "authentic superiority.",
  "follow us at @atheles.co to share your aesthetic.",
];

export function AnnouncementBar({ initialAnnouncements }: { initialAnnouncements?: string[] }) {
  const [announcements, setAnnouncements] = useState(
    initialAnnouncements?.length ? initialAnnouncements : DEFAULT_ANNOUNCEMENTS,
  );
  const [index, setIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcementsLenRef = useRef(announcements.length);

  // Keep ref in sync so the interval closure always sees the current length
  // without needing to be recreated when announcements change.
  useEffect(() => {
    announcementsLenRef.current = announcements.length;
  }, [announcements.length]);

  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      const len = announcementsLenRef.current;
      if (len > 1) setIndex((prev) => (prev + 1) % len);
    }, 5000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!paused) startTimer();
    return () => stopTimer();
  }, [paused, startTimer, stopTimer]);

  useEffect(() => {
    setEntered(true);
  }, []);

  const togglePause = () => {
    setPaused((p) => !p);
  };

  return (
    <div className={`announcement-bar-root relative flex h-8 items-center overflow-visible bg-transparent ${entered ? "animate-announcement-bar-enter" : "navbar-pre-enter"}`}>
      {/* Spacer balances the pause button on the right */}
      <div className="min-w-[44px] flex-none" />

      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: "easeInOut" }}
          className="flex-1 text-center text-xs uppercase tracking-[0.18em] text-brand-dark-gold sm:text-[11px] sm:tracking-[0.25em]"
        >
          {announcements[index]}
        </motion.p>
      </AnimatePresence>

      {/* Pause / Play */}
      <button
        type="button"
        onClick={togglePause}
        aria-label={paused ? "Play announcements" : "Pause announcements"}
        className="flex h-full min-w-[44px] flex-none items-center justify-center text-brand-dark-gold/70 transition-colors hover:text-brand-dark-gold"
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
      <WavyDivider className="absolute inset-x-0 bottom-0" />
    </div>
  );
}
