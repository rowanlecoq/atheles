"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select, label";

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const hoverRef = useRef(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const cursorX = useSpring(mouseX, { stiffness: 600, damping: 30, mass: 0.35 });
  const cursorY = useSpring(mouseY, { stiffness: 600, damping: 30, mass: 0.35 });

  const trailX = useSpring(mouseX, { stiffness: 180, damping: 28, mass: 0.7 });
  const trailY = useSpring(mouseY, { stiffness: 180, damping: 28, mass: 0.7 });

  const size = useMotionValue(16);
  const springSize = useSpring(size, { stiffness: 400, damping: 22, mass: 0.4 });
  const borderW = useTransform(springSize, [16, 40], [1, 1.5]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    setMounted(true);
    document.documentElement.setAttribute("data-custom-cursor", "");

    let lastCheck = 0;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const now = performance.now();
      if (now - lastCheck < 60) return;
      lastCheck = now;

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const isInteractive = el?.closest(INTERACTIVE_SELECTOR) != null;

      if (isInteractive !== hoverRef.current) {
        hoverRef.current = isInteractive;
        size.set(isInteractive ? 40 : 16);
      }
    };

    const onLeave = () => {
      mouseX.set(-100);
      mouseY.set(-100);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeAttribute("data-custom-cursor");
    };
  }, [mouseX, mouseY, size]);

  if (!mounted) return null;

  return (
    <>
      {/* Trail */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-gold/15 will-change-transform"
        style={{ x: trailX, y: trailY, width: 10, height: 10 }}
      />
      {/* Main ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-gold/50 will-change-transform"
        style={{
          x: cursorX,
          y: cursorY,
          width: springSize,
          height: springSize,
          borderWidth: borderW,
        }}
      />
    </>
  );
}
