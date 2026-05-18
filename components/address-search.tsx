"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type AddressResult = {
  address1: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  display: string;
};

function parseNominatim(item: Record<string, unknown>): AddressResult {
  const a = (item.address ?? {}) as Record<string, string>;
  const houseNumber = a.house_number ?? "";
  const road = a.road ?? a.street ?? a.pedestrian ?? a.path ?? "";
  const address1 = [houseNumber, road].filter(Boolean).join(" ");
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? "";
  const province = a.state ?? a.province ?? a.region ?? "";
  const zip = a.postcode ?? "";
  const country = a.country ?? "";
  const display = (item.display_name as string) ?? address1;
  return { address1, city, province, zip, country, display };
}

export function AddressSearch({
  onSelect,
  className,
}: {
  onSelect: (result: AddressResult) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 4) { setResults([]); setOpen(false); return; }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=jsonv2&addressdetails=1&limit=5`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        const parsed: AddressResult[] = (data as Record<string, unknown>[])
          .filter((item) => (item.address as Record<string, string>)?.road || (item.address as Record<string, string>)?.street)
          .map(parseNominatim);
        setResults(parsed);
        setOpen(parsed.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (result: AddressResult) => {
    onSelect(result);
    setQuery("");
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-grey/40" />
        <input
          className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark py-2 pl-8 pr-3 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
          placeholder="search your address…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-brand-grey/40">
            searching…
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-brand-dark-gold/30 bg-[#1a1a16] shadow-xl">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="w-full px-3 py-2.5 text-left text-xs text-brand-grey transition-colors hover:bg-brand-gold/10 hover:text-white"
              >
                <span className="font-medium text-white">{r.address1}</span>
                {" "}
                <span className="text-brand-grey/60">{[r.city, r.province, r.zip, r.country].filter(Boolean).join(", ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
