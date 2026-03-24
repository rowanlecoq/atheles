"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";

const countries = [
  { code: "US", flag: "🇺🇸", name: "United States" },
  { code: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "EU", flag: "🇪🇺", name: "Europe" },
];

const STORAGE_KEY = "atheles-country";

function getStoredCountry(): string {
  if (typeof window === "undefined") return "US";
  try {
    return localStorage.getItem(STORAGE_KEY) || "US";
  } catch {
    return "US";
  }
}

export function CountrySelector() {
  const [selected, setSelected] = useState("US");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(getStoredCountry());
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = useCallback((code: string) => {
    setSelected(code);
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // storage unavailable
    }
  }, []);

  const current = countries.find((c) => c.code === selected) || countries[0]!;

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select country"
        className="flex h-11 items-center gap-1.5 px-1 text-brand-grey transition-colors hover:text-brand-gold"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="text-xs uppercase tracking-wider">{current.code}</span>
        <ChevronDownIcon
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      <div
        className={`absolute left-0 top-full z-50 mt-2 min-w-[180px] rounded-md border border-brand-dark-gold/20 bg-brand-dark shadow-lg shadow-black/30 transition-all duration-200 ${
          open
            ? "pointer-events-auto visible translate-y-0 opacity-100"
            : "pointer-events-none invisible -translate-y-1 opacity-0"
        }`}
      >
        {countries.map((country) => (
          <button
            key={country.code}
            type="button"
            onClick={() => handleSelect(country.code)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-md last:rounded-b-md ${
              selected === country.code
                ? "bg-brand-dark-gold/10 text-brand-gold"
                : "text-brand-grey hover:bg-brand-dark-gold/5 hover:text-brand-gold"
            }`}
          >
            <span className="text-base leading-none">{country.flag}</span>
            <span className="uppercase tracking-wider">{country.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
