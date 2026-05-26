"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

export function useAnimateInView<T extends HTMLElement>(margin = "0px") {
  const ref = useRef<T>(null);
  const triggered = useRef(false);

  // Before first paint on client-side navigation: start animation for above-fold elements.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { top, bottom } = el.getBoundingClientRect();
    if (top < window.innerHeight && bottom > 0) {
      el.style.animationPlayState = "running";
      triggered.current = true;
    }
  }, []); // mount-only

  useEffect(() => {
    if (triggered.current) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !triggered.current) {
          triggered.current = true;
          el.style.animationPlayState = "running";
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);

  return ref;
}
