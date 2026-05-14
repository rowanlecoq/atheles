"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type SearchProduct = {
  handle: string;
  title: string;
  featuredImage?: { url: string; altText?: string };
  priceRange?: { minVariantPrice?: { amount: string; currencyCode: string } };
};

function ResultItem({ product, onCloseImmediate }: { product: SearchProduct; onCloseImmediate: (handle: string) => void }) {
  const price = product.priceRange?.minVariantPrice;

  return (
    <button
      type="button"
      onClick={() => onCloseImmediate(product.handle)}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-dark-gold/10"
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
        <p className="truncate text-xs lowercase text-white">{product.title}</p>
        {price && (
          <p className="text-[11px] text-brand-dark-gold">
            {parseFloat(price.amount).toFixed(2)} {price.currencyCode}
          </p>
        )}
      </div>
    </button>
  );
}

export function SearchToggle() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backdropPointerStart = useRef({ x: 0, y: 0 });
  const router = useRouter();
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => { setMounted(true); }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  // When pathname changes (navigation complete), close the overlay.
  // This keeps the dark backdrop up as a loading screen during navigation,
  // eliminating the flash of old page content underneath.
  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      if (open) close();
    }
  }, [pathname, open, close]);

  const handleResultTap = useCallback((handle: string) => {
    const href = `/product/${handle}`;
    if (window.location.pathname === href) {
      close();
    } else {
      router.push(href);
    }
  }, [close, router]);

  const openSearch = useCallback(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) {
      setOpen(true);
      mobileInputRef.current?.focus({ preventScroll: true });
      return;
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const isMobile = window.matchMedia("(pointer: coarse)").matches;

    if (isMobile) {
      // Prevent scroll by blocking touchmove on anything outside the search
      // panel. Safer than position:fixed body — no layout changes, no scroll
      // restoration, cleanup is a single removeEventListener.
      const preventScroll = (e: TouchEvent) => {
        if (!mobileOverlayRef.current?.contains(e.target as Node)) {
          e.preventDefault();
        }
      };
      document.addEventListener("touchmove", preventScroll, { passive: false });
      return () => document.removeEventListener("touchmove", preventScroll);
    }

    // Desktop: sticky navbar drifts scroll toward y=0 on every keystroke.
    // Intercept and snap back.
    let active = false;
    let savedY = window.scrollY;

    const onStart = () => { active = true; savedY = window.scrollY; };
    const onEnd = () => { active = false; };
    const onScroll = () => { if (active) window.scrollTo(0, savedY); };

    document.addEventListener("keydown", onStart, true);
    document.addEventListener("keyup", onEnd, true);
    document.addEventListener("mousedown", onStart, true);
    document.addEventListener("mouseup", onEnd, true);
    window.addEventListener("scroll", onScroll);

    return () => {
      document.removeEventListener("keydown", onStart, true);
      document.removeEventListener("keyup", onEnd, true);
      document.removeEventListener("mousedown", onStart, true);
      document.removeEventListener("mouseup", onEnd, true);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  // Fetch search results
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setLoading(false); return; }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
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

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Desktop: focus input after expand animation
  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile) {
      setTimeout(() => desktopInputRef.current?.focus({ preventScroll: true }), 50);
    }
  }, [open]);

  // Close on click outside (desktop)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const inContainer = containerRef.current?.contains(e.target as Node);
      const inOverlay = mobileOverlayRef.current?.contains(e.target as Node);
      if (!inContainer && !inOverlay) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      close();
    }
  };

  const showDropdown = open && (loading || results.length > 0) && query.trim().length >= 2;

  const overlayClass = open ? "opacity-100" : "opacity-0 pointer-events-none";

  return (
    <div ref={containerRef} className="relative">
      {/* Mobile overlay — portalled to document.body (root stacking context)
          so z-200/201 genuinely sits above the NavbarShell stacking context.
          Always in the DOM; hidden via opacity when closed so the input can
          be focused in the same gesture tick without flushSync. The backdrop's
          touch-action:none locks page scroll while search is open. */}
      {mounted && createPortal(
        <>
          <div
            className={`fixed inset-0 z-[200] bg-black/70 md:hidden ${overlayClass}`}
            style={{ touchAction: open ? "none" : "auto" }}
            onPointerDown={(e) => {
              backdropPointerStart.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const dx = Math.abs(e.clientX - backdropPointerStart.current.x);
              const dy = Math.abs(e.clientY - backdropPointerStart.current.y);
              if (dx < 10 && dy < 10) close();
            }}
          />
          <div
            ref={mobileOverlayRef}
            className={`fixed left-0 right-0 top-0 z-[201] flex flex-col bg-brand-dark md:hidden ${overlayClass}`}
            style={{ maxHeight: "100dvh" }}
          >
            <div className="flex flex-none items-center gap-3 border-b border-brand-dark-gold/20 px-4 py-2">
              <MagnifyingGlassIcon className="h-4 w-4 flex-none text-brand-dark-gold" />
              <form onSubmit={handleSubmit} className="flex-1">
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="find items"
                  className="w-full bg-transparent text-sm text-brand-pale-gold placeholder-brand-dark-gold/60 outline-none"
                  tabIndex={open ? 0 : -1}
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
            {query.trim().length >= 2 && (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {loading && results.length === 0 && (
                  <div className="px-4 py-3 text-xs text-brand-grey">searching...</div>
                )}
                {results.slice(0, 8).map((product) => (
                  <ResultItem key={product.handle} product={product} onCloseImmediate={handleResultTap} />
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
        </>,
        document.body,
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
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-[70] mt-1 overflow-hidden rounded-md border border-brand-dark-gold/20 bg-brand-dark shadow-xl shadow-black/40">
              {loading && results.length === 0 ? (
                <div className="px-4 py-3 text-xs text-brand-grey">searching...</div>
              ) : (
                <>
                  {results.slice(0, 5).map((product) => (
                    <ResultItem key={product.handle} product={product} onCloseImmediate={handleResultTap} />
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
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
