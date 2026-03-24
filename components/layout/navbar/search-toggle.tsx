"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function SearchToggle() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

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
      const t = setTimeout(() => inputRef.current?.focus(), 50);
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

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Desktop: inline expanding search */}
      <div
        className={`absolute right-0 hidden items-center overflow-hidden transition-all duration-300 ease-out md:flex ${
          open
            ? "w-[320px] opacity-100"
            : "w-0 opacity-0"
        }`}
      >
        <form onSubmit={handleSubmit} className="flex w-full items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-9 w-full border-b border-brand-dark-gold/40 bg-transparent px-2 text-sm text-brand-pale-gold placeholder-brand-dark-gold/60 outline-none transition-colors duration-200 focus:border-brand-gold"
          />
        </form>
      </div>

      {/* Mobile: full-width overlay bar */}
      {open && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center gap-2 bg-brand-dark px-4 py-3 md:hidden">
          <form onSubmit={handleSubmit} className="flex flex-1 items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
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
