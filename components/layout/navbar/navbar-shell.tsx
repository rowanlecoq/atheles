import type { ReactNode } from "react";

export function NavbarShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-header-root sticky top-0 z-50 animate-navbar-enter">
      {children}
    </div>
  );
}
