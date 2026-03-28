"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type SearchResult = {
  handle: string;
  title: string;
  featuredImage?: { url: string };
  priceRange: {
    maxVariantPrice: { amount: string; currencyCode: string };
  };
};

export function SearchToggle() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  // Fetch search results
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || []);
        }
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        inputRef.current?.focus();
        mobileInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      close();
    }
  };

  const showResults = query.trim().length >= 2 && (results.length > 0 || loading);

  const resultsDropdown = (
    <div className="border-t border-brand-dark-gold/20 bg-brand-dark">
      {loading && results.length === 0 ? (
        <div className="px-4 py-3 text-xs text-brand-grey">searching...</div>
      ) : (
        <>
          {results.slice(0, 5).map((product) => (
            <Link
              key={product.handle}
              href={`/product/${product.handle}`}
              onClick={close}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-brand-dark-gold/10"
            >
              {product.featuredImage?.url ? (
                <div className="relative h-10 w-10 flex-none overflow-hidden rounded bg-[#222]">
                  <Image
                    src={product.featuredImage.url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded bg-[#222]">
                  <span className="text-[8px] text-brand-grey">ATHELES</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{product.title}</p>
                <p className="text-xs text-brand-grey">
                  ${parseFloat(product.priceRange.maxVariantPrice.amount).toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
          {results.length > 0 && (
            <button
              type="button"
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                close();
              }}
              className="block w-full border-t border-brand-dark-gold/10 px-4 py-2.5 text-left text-xs uppercase tracking-wider text-brand-dark-gold transition-colors hover:text-brand-gold"
            >
              view all results
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Desktop: inline expanding search */}
      <div
        className={`absolute right-0 hidden overflow-hidden transition-all duration-300 ease-out md:block ${
          open ? "w-[320px] opacity-100" : "w-0 opacity-0"
        }`}
      >
        <form onSubmit={handleSubmit} className="flex w-full items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search..."
            className="h-9 w-full border-b border-brand-dark-gold/40 bg-transparent px-2 text-sm text-brand-pale-gold placeholder-brand-dark-gold/60 outline-none transition-colors duration-200 focus:border-brand-gold"
          />
        </form>
        {/* Desktop results dropdown */}
        {showResults && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-brand-dark-gold/20 shadow-lg shadow-black/30">
            {resultsDropdown}
          </div>
        )}
      </div>

      {/* Mobile: full-width overlay bar */}
      {open && (
        <div className="fixed inset-x-0 top-0 z-[60] bg-brand-dark md:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <form onSubmit={handleSubmit} className="flex flex-1 items-center">
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search..."
                autoFocus
                className="h-10 w-full border-b border-brand-dark-gold/40 bg-transparent px-2 text-sm text-brand-pale-gold placeholder-brand-dark-gold/60 outline-none transition-colors duration-200 focus:border-brand-gold"
              />
            </form>
            <button
              type="button"
              onClick={close}
              aria-label="Close search"
              className="flex h-11 w-11 shrink-0 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          {/* Mobile results */}
          {showResults && resultsDropdown}
        </div>
      )}

      {/* Mobile: backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? "Close search" : "Open search"}
        className="relative z-10 flex h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold"
      >
        <div className="relative h-5 w-5">
          <MagnifyingGlassIcon
            className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
              open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <XMarkIcon
            className={`absolute inset-0 hidden h-5 w-5 transition-all duration-300 md:block ${
              open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
            }`}
          />
        </div>
      </button>
    </div>
  );
}
