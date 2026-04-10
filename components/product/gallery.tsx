"use client";

import { GridTileImage } from "components/grid/tile";
import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";

export function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgScrollRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextImage = useCallback(() => {
    setImageIndex((prev) => (prev + 1 < images.length ? prev + 1 : 0));
  }, [images.length]);

  const prevImage = useCallback(() => {
    setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") setIsZoomed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextImage, prevImage]);

  // Reset zoom when the displayed image changes
  useEffect(() => { setIsZoomed(false); }, [imageIndex]);

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const child = el.children[index] as HTMLElement;
    if (child) {
      isProgScrollRef.current = true;
      el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        isProgScrollRef.current = false;
      }, 400);
    }
  }, []);

  const goToImage = useCallback(
    (index: number) => {
      setImageIndex(index);
      scrollToIndex(index);
    },
    [scrollToIndex],
  );

  // Track swipe index on mobile scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (isProgScrollRef.current) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (!scrollRef.current || isProgScrollRef.current) return;
        const scrollEl = scrollRef.current;
        const childWidth = (scrollEl.children[0] as HTMLElement)?.offsetWidth || 1;
        const newIndex = Math.round(scrollEl.scrollLeft / childWidth);
        if (newIndex >= 0 && newIndex < images.length) {
          setImageIndex(newIndex);
        }
      }, 60);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (debounce) clearTimeout(debounce);
    };
  }, [images.length]);

  return (
    <div>
      {/* Mobile: horizontal scroll gallery — swipe to navigate */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide lg:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {images.map((image, index) => (
          <div
            key={image.src}
            className="aspect-square w-full flex-none snap-center"
          >
            <div className="relative h-full w-full">
              <Image
                className="h-full w-full object-contain"
                fill
                sizes="100vw"
                alt={image.altText}
                src={image.src}
                priority={index === 0}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: inline zoom on click — no lightbox */}
      <div className="hidden lg:block">
        <div
          className={`relative aspect-square h-full max-h-[600px] w-full overflow-hidden rounded-lg ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          onPointerDown={(e) => {
            if (e.pointerType === "touch") return;
            if (!isZoomed) {
              const rect = e.currentTarget.getBoundingClientRect();
              setZoomOrigin({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              });
              setIsZoomed(true);
            } else {
              setIsZoomed(false);
            }
          }}
          onPointerMove={(e) => {
            if (e.pointerType === "touch" || !isZoomed) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setZoomOrigin({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            });
          }}
          onPointerLeave={(e) => {
            if (e.pointerType !== "touch") setIsZoomed(false);
          }}
        >
          {images[imageIndex] && (
            <div
              className="absolute inset-0 transition-transform duration-200"
              style={
                isZoomed
                  ? { transform: "scale(2.5)", transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }
                  : undefined
              }
            >
              <Image
                className="h-full w-full object-contain"
                fill
                sizes="66vw"
                alt={images[imageIndex]?.altText as string}
                src={images[imageIndex]?.src as string}
                priority={imageIndex === 0}
              />
            </div>
          )}
          {/* Click to zoom badge — always visible on desktop, disappears while zoomed */}
          {!isZoomed && (
            <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
                <path d="M11 8v6M8 11h6" />
              </svg>
              click to zoom
            </div>
          )}
        </div>
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToImage(index)}
              aria-label={`View image ${index + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === imageIndex
                  ? "w-6 bg-brand-gold"
                  : "w-2 bg-brand-dark-gold/40 hover:bg-brand-dark-gold/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <ul className="mt-4 flex w-full flex-nowrap items-center justify-start gap-2 overflow-x-auto py-1 sm:flex-wrap sm:justify-center lg:mb-0">
          {images.map((image, index) => {
            const isActive = index === imageIndex;
            return (
              <li
                key={image.src}
                className="h-16 w-16 flex-none sm:h-20 sm:w-20"
              >
                <button
                  type="button"
                  onClick={() => goToImage(index)}
                  aria-label={`Select image ${index + 1}`}
                  className="h-full w-full"
                >
                  <GridTileImage
                    alt={image.altText}
                    src={image.src}
                    width={80}
                    height={80}
                    active={isActive}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
