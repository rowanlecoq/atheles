"use client";

import { AuthProvider } from "components/auth-context";
import { CurrencyProvider } from "components/currency-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        {children}
      </CurrencyProvider>
    </AuthProvider>
  );
}
