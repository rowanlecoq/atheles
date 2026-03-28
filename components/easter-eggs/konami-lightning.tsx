"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function KonamiLightning() {
  const [triggered, setTriggered] = useState(false);

  const handleSequence = useCallback(() => {
    setTriggered(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([50, 30, 80]);
    }
    setTimeout(() => setTriggered(false), 2200);
  }, []);

  useEffect(() => {
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === KONAMI[index]) {
        index++;
        clearTimeout(timer);
        timer = setTimeout(() => {
          index = 0;
        }, 2000);
        if (index === KONAMI.length) {
          index = 0;
          handleSequence();
        }
      } else {
        index = 0;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      clearTimeout(timer);
    };
  }, [handleSequence]);

  return (
    <AnimatePresence>
      {triggered && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[99999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Lightning flash */}
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0.1, 0.6, 0] }}
            transition={{ duration: 0.5, times: [0, 0.08, 0.2, 0.25, 0.5] }}
          />

          {/* Text reveal */}
          <motion.p
            className="relative z-10 font-heading text-3xl uppercase tracking-[0.4em] text-brand-gold sm:text-5xl"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1, 1, 1.05],
              filter: ["blur(10px)", "blur(0px)", "blur(0px)", "blur(4px)"],
            }}
            transition={{ duration: 2, times: [0, 0.2, 0.7, 1] }}
          >
            Olympus Awaits
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
