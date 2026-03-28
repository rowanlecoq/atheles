"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type RegionCode = "US" | "CA" | "GB" | "AU" | "EU";

type RegionInfo = {
  code: RegionCode;
  currency: string;
  rate: number; // conversion rate from USD
};

const regions: Record<RegionCode, RegionInfo> = {
  US: { code: "US", currency: "USD", rate: 1 },
  CA: { code: "CA", currency: "CAD", rate: 1.36 },
  GB: { code: "GB", currency: "GBP", rate: 0.79 },
  AU: { code: "AU", currency: "AUD", rate: 1.53 },
  EU: { code: "EU", currency: "EUR", rate: 0.92 },
};

type CurrencyContextValue = {
  region: RegionCode;
  currency: string;
  setRegion: (code: RegionCode) => void;
  convert: (amountUsd: string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  region: "US",
  currency: "USD",
  setRegion: () => {},
  convert: (a) => a,
});

const STORAGE_KEY = "atheles-country";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<RegionCode>("US");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as RegionCode | null;
      if (stored && regions[stored]) setRegionState(stored);
    } catch {}
  }, []);

  const setRegion = (code: RegionCode) => {
    setRegionState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
  };

  const info = regions[region];

  const convert = (amountUsd: string): string => {
    const converted = parseFloat(amountUsd) * info.rate;
    return converted.toString();
  };

  return (
    <CurrencyContext.Provider
      value={{ region, currency: info.currency, setRegion, convert }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
