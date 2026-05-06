"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcementsLenRef = useRef(defaultAnnouncements.length);

  // Keep ref in sync so the interval closure always sees the current length
  // without needing to be recreated when announcements change.
  useEffect(() => {
    announcementsLenRef.current = announcements.length;
  }, [announcements.length]);

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

  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcementsLenRef.current);
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

  const togglePause = () => {
    setPaused((p) => !p);
  };

  return (
    <div className="announcement-bar-root relative flex h-8 items-center justify-center overflow-hidden border-b border-brand-dark-gold/20 bg-brand-dark">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="px-8 text-xs uppercase tracking-[0.18em] text-brand-dark-gold sm:text-[11px] sm:tracking-[0.25em]"
        >
          {announcements[index]}
        </motion.p>
      </AnimatePresence>

      {/* Pause / Play */}
      <button
        type="button"
        onClick={togglePause}
        aria-label={paused ? "Play announcements" : "Pause announcements"}
        className="absolute right-1 flex h-full min-w-[44px] items-center justify-center text-brand-dark-gold/70 transition-colors hover:text-brand-dark-gold sm:right-2"
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
