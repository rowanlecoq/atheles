"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

export function useAnimateInView<T extends HTMLElement>(animString: string, margin = "0px") {
  const ref = useRef<T>(null);
  const triggered = useRef(false);
  // Capture animString once — never re-read from props to avoid stale closure issues
  const animRef = useRef(animString);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { top, bottom } = el.getBoundingClientRect();
    if (top < window.innerHeight && bottom > 0) {
      el.style.animation = animRef.current;
      triggered.current = true;
    }
  }, []); // mount-only — fires before paint on client-side navigation

  useEffect(() => {
    if (triggered.current) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !triggered.current) {
          triggered.current = true;
          el.style.animation = animRef.current;
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
