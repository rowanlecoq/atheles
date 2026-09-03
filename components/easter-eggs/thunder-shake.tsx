"use client";

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
      const shakeRoot = document.getElementById("thunder-shake-root");
      shakeRoot?.classList.add("thunder-shake");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(100);
      }
      setTimeout(() => {
        shakeRoot?.classList.remove("thunder-shake");
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
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[99998] animate-thunder-flash">
      <div
        className="absolute inset-0 animate-thunder-radial"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(204, 177, 115, 0.3) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
