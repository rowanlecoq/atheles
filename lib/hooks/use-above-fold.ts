"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Returns true if the element was visible in the viewport on initial mount.
 * Used to skip entrance animations for above-the-fold content.
 * Uses a ref (not state) to avoid triggering re-renders.
 */
export function useAboveFold(ref: RefObject<HTMLElement | null>): { wasAboveFold: React.MutableRefObject<boolean> } {
  const wasAboveFold = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (el && !wasAboveFold.current) {
      const rect = el.getBoundingClientRect();
      wasAboveFold.current = rect.top < window.innerHeight && rect.bottom > 0;
    }
  }, [ref]);

  return { wasAboveFold };
}
