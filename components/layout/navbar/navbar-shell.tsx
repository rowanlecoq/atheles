"use client";

import type { ReactNode } from "react";

export function NavbarShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-header-root sticky top-0 z-50">
      <div className="animate-header-enter">
        {children}
      </div>
    </div>
  );
}
