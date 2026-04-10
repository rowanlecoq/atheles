"use client";

import { GridTileImage } from "components/grid/tile";
import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
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

  // Keyboard navigation for the gallery strip (lightbox closed)
  useEffect(() => {
    if (lightboxIndex !== null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextImage, prevImage, lightboxIndex]);

  // Keyboard navigation inside lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightboxIndex(null); setZoom(false); }
      if (e.key === "ArrowLeft" && images.length > 1) {
        setZoom(false);
        setLightboxIndex((l) => l !== null ? (l - 1 + images.length) % images.length : null);
      }
      if (e.key === "ArrowRight" && images.length > 1) {
        setZoom(false);
        setLightboxIndex((l) => l !== null ? (l + 1) % images.length : null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, images.length]);

  // Reset zoom whenever the lightbox image changes
  useEffect(() => { setZoom(false); }, [lightboxIndex]);

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

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoom(false);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setZoom(false);
  };

  return (
    <div>
      {/* Mobile: horizontal scroll gallery — tap to open lightbox */}
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
            <div
              className="relative h-full w-full cursor-zoom-in"
              onClick={() => openLightbox(index)}
            >
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

      {/* Desktop: single image — click to open lightbox */}
      <div className="hidden lg:block">
        <div
          className="group relative aspect-square h-full max-h-[600px] w-full cursor-zoom-in overflow-hidden rounded-lg"
          onClick={() => openLightbox(imageIndex)}
        >
          {images[imageIndex] && (
            <Image
              className="h-full w-full object-contain"
              fill
              sizes="66vw"
              alt={images[imageIndex]?.altText as string}
              src={images[imageIndex]?.src as string}
              priority={imageIndex === 0}
            />
          )}
          {/* Click to zoom hint — appears on hover */}
          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
            click to zoom
          </div>
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

      {/* Lightbox — portaled to body so it covers the navbar */}
      {lightboxIndex !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 text-white/70 transition-colors hover:text-white"
              aria-label="close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Prev button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(false);
                  setLightboxIndex((l) => l !== null ? (l - 1 + images.length) % images.length : null);
                }}
                className="absolute left-3 top-1/2 z-10 flex h-16 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white sm:h-24 sm:w-14"
                aria-label="previous"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6 sm:h-8 sm:w-8">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}

            {/* Image content — stops propagation, handles swipe on mobile */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex items-center justify-center"
              onTouchStart={(e) => {
                if (e.touches.length > 1) {
                  delete (e.currentTarget as HTMLElement).dataset.touchX;
                  return;
                }
                const touch = e.touches[0];
                if (touch) (e.currentTarget as HTMLElement).dataset.touchX = String(touch.clientX);
              }}
              onTouchEnd={(e) => {
                const stored = (e.currentTarget as HTMLElement).dataset.touchX;
                if (!stored) return;
                const startX = Number(stored);
                const endX = e.changedTouches[0]?.clientX || 0;
                const diff = startX - endX;
                if (Math.abs(diff) > 50 && images.length > 1) {
                  setZoom(false);
                  if (diff > 0) {
                    setLightboxIndex((l) => l !== null ? (l + 1) % images.length : null);
                  } else {
                    setLightboxIndex((l) => l !== null ? (l - 1 + images.length) % images.length : null);
                  }
                }
              }}
            >
              {/* Zoom wrapper — desktop click-to-zoom, mouse-tracking origin */}
              <div
                className={`relative inline-block overflow-hidden rounded-lg ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                onPointerDown={(e) => {
                  if (e.pointerType === "touch") return;
                  if (!zoom) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setZoomOrigin({
                      x: ((e.clientX - rect.left) / rect.width) * 100,
                      y: ((e.clientY - rect.top) / rect.height) * 100,
                    });
                  }
                  setZoom((z) => !z);
                }}
                onPointerMove={(e) => {
                  if (e.pointerType === "touch" || !zoom) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  setZoomOrigin({
                    x: ((e.clientX - rect.left) / rect.width) * 100,
                    y: ((e.clientY - rect.top) / rect.height) * 100,
                  });
                }}
                onPointerLeave={(e) => { if (e.pointerType !== "touch" && zoom) setZoom(false); }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[lightboxIndex]?.src || ""}
                  alt={images[lightboxIndex]?.altText || ""}
                  className="block max-h-[80vh] max-w-[88vw] object-contain transition-transform duration-200"
                  style={
                    zoom
                      ? { transform: "scale(2.5)", transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }
                      : undefined
                  }
                />
                {/* Zoom hint — desktop only */}
                {!zoom && (
                  <div className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur-sm sm:flex">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                      <path d="M11 8v6M8 11h6" />
                    </svg>
                    click to zoom
                  </div>
                )}
              </div>
            </div>

            {/* Next button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(false);
                  setLightboxIndex((l) => l !== null ? (l + 1) % images.length : null);
                }}
                className="absolute right-3 top-1/2 z-10 flex h-16 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white sm:h-24 sm:w-14"
                aria-label="next"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6 sm:h-8 sm:w-8">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}

            {/* Counter */}
            {images.length > 1 && (
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/60 backdrop-blur-sm">
                {lightboxIndex + 1} / {images.length}
              </p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
