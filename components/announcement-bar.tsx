"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const announcements = [
  "to ascend.",
  "coming soon. this summer.",
  "use code ROWAN for 10% off your order.",
  "authentic superiority.",
  "follow us at @atheles.co to share your aesthetic.",
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-8 items-center justify-center overflow-hidden border-b border-brand-dark-gold/20 bg-brand-dark">
      {/* Subtle decorative lines */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-24 items-center justify-end pr-4 sm:w-40">
        <div className="h-px w-full bg-gradient-to-r from-transparent to-brand-dark-gold/30" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-start pl-4 sm:w-40">
        <div className="h-px w-full bg-gradient-to-l from-transparent to-brand-dark-gold/30" />
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="px-8 text-[10px] uppercase tracking-[0.18em] text-brand-dark-gold sm:text-[11px] sm:tracking-[0.25em]"
        >
          {announcements[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
