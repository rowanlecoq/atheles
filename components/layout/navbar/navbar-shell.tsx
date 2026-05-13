"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function NavbarShell({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(true);
  }, []);

  return (
    <div
      className={`site-header-root sticky top-0 z-50 ${entered ? "animate-navbar-enter" : "navbar-pre-enter"}`}
    >
      {children}
    </div>
  );
}
