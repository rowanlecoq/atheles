"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useCurrency, type RegionCode } from "components/currency-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const regions = [
  { code: "US" as RegionCode, flag: "🇺🇸", label: "US", language: "EN", currency: "USD" },
  { code: "CA" as RegionCode, flag: "🇨🇦", label: "CA", language: "EN", currency: "CAD" },
  { code: "GB" as RegionCode, flag: "🇬🇧", label: "UK", language: "EN", currency: "GBP" },
  { code: "AU" as RegionCode, flag: "🇦🇺", label: "AU", language: "EN", currency: "AUD" },
  { code: "EU" as RegionCode, flag: "🇪🇺", label: "EU", language: "EN", currency: "EUR" },
];

export function CountrySelector() {
  const { region, setRegion } = useCurrency();
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openDropdown = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(true);
  }, []);

  const closeDropdown = useCallback(() => setOpen(false), []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) closeDropdown();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeDropdown]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeDropdown(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeDropdown]);

  const handleSelect = useCallback(
    (code: RegionCode) => { setRegion(code); closeDropdown(); },
    [setRegion, closeDropdown],
  );

  const current = regions.find((r) => r.code === region) || regions[0]!;

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => open ? closeDropdown() : openDropdown()}
        aria-label="Select region"
        className="flex h-11 items-center gap-1.5 px-1 text-brand-grey transition-colors hover:text-brand-gold"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="text-xs uppercase tracking-wider">{current.language}</span>
        <ChevronDownIcon
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          className="min-w-[200px] rounded-md border border-brand-dark-gold/20 bg-brand-dark shadow-lg shadow-black/30"
        >
          {regions.map((r) => (
            <button
              key={r.code}
              type="button"
              onClick={() => handleSelect(r.code)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-md last:rounded-b-md ${
                region === r.code
                  ? "bg-brand-dark-gold/10 text-brand-gold"
                  : "text-brand-grey hover:bg-brand-dark-gold/5 hover:text-brand-gold"
              }`}
            >
              <span className="text-base leading-none">{r.flag}</span>
              <span className="flex-1 uppercase tracking-wider">{r.label}</span>
              <span className="text-xs tracking-wider text-brand-grey/60">{r.language} / {r.currency}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
