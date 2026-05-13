"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function NavbarShell({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    setEntered(true);
  }, []);

  return (
    <div
      className={`site-header-root sticky top-0 z-50 ${
        animDone ? "" : entered ? "animate-navbar-enter" : "navbar-pre-enter"
      }`}
      // Once the entrance animation finishes, explicitly clear the transform so
      // the navbar no longer creates a containing block for position:fixed
      // children (any CSS transform — even translateY(0) — creates one).
      style={animDone ? { transform: "none" } : undefined}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setAnimDone(true);
      }}
    >
      {children}
    </div>
  );
}
