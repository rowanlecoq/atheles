"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

export function useThunderShake() {
  const clickCount = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [active, setActive] = useState(false);

  const handleClick = useCallback(() => {
    clickCount.current++;
    clearTimeout(timer.current);

    if (clickCount.current >= 3) {
      clickCount.current = 0;
      setActive(true);
      document.documentElement.classList.add("thunder-shake");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(100);
      }
      setTimeout(() => {
        document.documentElement.classList.remove("thunder-shake");
        setActive(false);
      }, 400);
    } else {
      timer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 600);
    }
  }, []);

  return { handleClick, active };
}

export function ThunderOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[99998]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(204, 177, 115, 0.3) 0%, transparent 70%)",
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 0.4 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
