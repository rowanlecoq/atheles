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
    <div className="relative flex h-8 items-center justify-center overflow-hidden bg-brand-gold">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand-dark sm:text-xs sm:tracking-[0.2em]"
        >
          {announcements[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
