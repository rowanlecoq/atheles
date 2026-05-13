"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type SearchProduct = {
  handle: string;
  title: string;
  featuredImage?: { url: string; altText?: string };
  priceRange?: { minVariantPrice?: { amount: string; currencyCode: string } };
};

function ResultItem({ product, onClose }: { product: SearchProduct; onClose: () => void }) {
  const price = product.priceRange?.minVariantPrice;
  return (
    <Link
      href={`/product/${product.handle}`}
      onClick={onClose}
      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-brand-dark-gold/10"
    >
      <div className="relative h-10 w-10 flex-none overflow-hidden rounded bg-brand-medium-grey/20">
        {product.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText || product.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-white">{product.title}</p>
        {price && (
          <p className="text-[11px] text-brand-dark-gold">
            {parseFloat(price.amount).toFixed(2)} {price.currencyCode}
          </p>
        )}
      </div>
    </Link>
  );
}

export function SearchToggle() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchLockRef = useRef<((e: TouchEvent) => void) | null>(null);
  const router = useRouter();

  const unlockScroll = useCallback(() => {
    if (touchLockRef.current) {
      document.removeEventListener("touchmove", touchLockRef.current);
      touchLockRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      setQuery("");
      setResults([]);
      unlockScroll();
    }, 120);
  }, [unlockScroll]);

  const openSearch = useCallback(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) {
      // Prevent touches outside the overlay from scrolling the page
      const touchHandler = (e: TouchEvent) => {
        if (
          mobileOverlayRef.current &&
          mobileOverlayRef.current.contains(e.target as Node)
        )
          return;
        e.preventDefault();
      };
      touchLockRef.current = touchHandler;
      document.addEventListener("touchmove", touchHandler, { passive: false });
    }
    setOpen(true);
  }, []);

  // Desktop: the navbar is position:sticky, so the browser tracks the input's
  // natural layout position near y=0 and scrolls toward it on every keystroke.
  // Intercept any scroll that fires while a key is held and snap back to the
  // saved position — this stops the creeping-upward drift without touching the
  // body style (which would break the sticky navbar).
  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;

    let keyActive = false;
    let savedY = window.scrollY;

    const onKeydown = () => {
      keyActive = true;
      savedY = window.scrollY;
    };
    const onKeyup = () => {
      keyActive = false;
    };
    const onScroll = () => {
      if (keyActive) window.scrollTo(0, savedY);
    };

    document.addEventListener("keydown", onKeydown, true);
    document.addEventListener("keyup", onKeyup, true);
    window.addEventListener("scroll", onScroll);

    return () => {
      document.removeEventListener("keydown", onKeydown, true);
      document.removeEventListener("keyup", onKeyup, true);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);


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
          `/api/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || []);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Focus the appropriate input when search opens, without scrolling the page.
  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) {
      setTimeout(() => mobileInputRef.current?.focus({ preventScroll: true }), 50);
    } else {
      setTimeout(() => desktopInputRef.current?.focus({ preventScroll: true }), 50);
    }
  }, [open]);

  // Close on click outside (desktop)
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

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unlockScroll();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [unlockScroll]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      close();
    }
  };

  const showDropdown = open && (loading || results.length > 0) && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      {/* Mobile: compact bar pinned to top + results dropdown + dim backdrop */}
      {(open || closing) && (
        <>
          {/* Backdrop dims the page without covering it entirely */}
          <div
            className={`fixed inset-0 z-[59] bg-black/40 transition-opacity duration-200 md:hidden ${
              closing ? "opacity-0" : "opacity-100"
            }`}
            onClick={close}
          />
          <div
            ref={mobileOverlayRef}
            className={`fixed left-0 right-0 top-0 z-[60] flex flex-col bg-brand-dark transition-opacity duration-200 md:hidden ${
              closing ? "opacity-0" : "opacity-100"
            }`}
          >
            {/* Search bar row */}
            <div className="flex items-center gap-3 border-b border-brand-dark-gold/20 px-4 py-1.5">
              <MagnifyingGlassIcon className="h-4 w-4 flex-none text-brand-dark-gold" />
              <form onSubmit={handleSubmit} className="flex-1">
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="find items"
                  className="w-full bg-transparent text-sm text-brand-pale-gold placeholder-brand-dark-gold/60 outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              </form>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 flex-none items-center justify-center text-brand-grey hover:text-brand-gold"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            {/* Results dropdown */}
            {query.trim().length >= 2 && (
              <div className="max-h-[55vh] overflow-y-auto">
                {loading && results.length === 0 && (
                  <div className="px-4 py-3 text-xs text-brand-grey">searching...</div>
                )}
                {results.slice(0, 8).map((product) => (
                  <ResultItem key={product.handle} product={product} onClose={close} />
                ))}
                {!loading && results.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                      close();
                    }}
                    className="w-full border-t border-brand-dark-gold/20 px-4 py-3 text-left text-xs uppercase tracking-wider text-brand-dark-gold hover:text-brand-gold"
                  >
                    view all results
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Desktop: inline expanding search with dropdown */}
      <div className="hidden md:block">
        <div
          className={`absolute right-0 top-1/2 -translate-y-1/2 overflow-visible transition-all duration-300 ease-out ${
            open ? "w-[320px] opacity-100" : "w-0 opacity-0"
          }`}
        >
          <form onSubmit={handleSubmit}>
            <input
              ref={desktopInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search..."
              className="h-9 w-full border-0 border-b border-brand-dark-gold/40 bg-transparent px-2 text-sm text-brand-pale-gold placeholder-brand-dark-gold/60 outline-none ring-0 transition-colors duration-200 focus:border-brand-pale-gold/60 focus:outline-none focus:ring-0"
            />
          </form>
          {/* Desktop dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-[70] mt-1 overflow-hidden rounded-md border border-brand-dark-gold/20 bg-brand-dark shadow-xl shadow-black/40">
              {loading && results.length === 0 ? (
                <div className="px-4 py-3 text-xs text-brand-grey">
                  searching...
                </div>
              ) : (
                <>
                  {results.slice(0, 5).map((product) => (
                    <ResultItem
                      key={product.handle}
                      product={product}
                      onClose={close}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      router.push(
                        `/search?q=${encodeURIComponent(query.trim())}`,
                      );
                      close();
                    }}
                    className="w-full border-t border-brand-dark-gold/20 px-4 py-2.5 text-left text-[11px] uppercase tracking-wider text-brand-dark-gold transition-colors hover:bg-brand-dark-gold/5 hover:text-brand-gold"
                  >
                    view all results
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => (open ? close() : openSearch())}
        aria-label={open ? "Close search" : "Open search"}
        className="relative z-10 flex h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold"
      >
        <div className="relative h-5 w-5">
          <MagnifyingGlassIcon
            className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
              open
                ? "rotate-90 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <XMarkIcon
            className={`absolute inset-0 hidden h-5 w-5 transition-all duration-300 md:block ${
              open
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0"
            }`}
          />
        </div>
      </button>
    </div>
  );
}
