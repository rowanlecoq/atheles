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
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const scrollRef = useRef<HTMLDivElement>(null);

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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextImage, prevImage]);

  // Sync scroll to current image on mobile
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const child = el.children[imageIndex] as HTMLElement;
      if (child) {
        el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
      }
    }
  }, [imageIndex]);

  // Handle scroll snap on mobile to update index
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const scrollLeft = el.scrollLeft;
    const childWidth = el.children[0]?.clientWidth || 1;
    const newIndex = Math.round(scrollLeft / childWidth);
    if (newIndex !== imageIndex && newIndex >= 0 && newIndex < images.length) {
      setImageIndex(newIndex);
    }
  };

  // Desktop zoom on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div>
      {/* Mobile: horizontal scroll gallery */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
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

      {/* Desktop: single image with zoom on click */}
      <div className="hidden lg:block">
        <div
          className={`relative aspect-square h-full max-h-[600px] w-full overflow-hidden rounded-lg ${
            zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
          }`}
          onClick={() => setZoomed(!zoomed)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoomed(false)}
        >
          {images[imageIndex] && (
            <Image
              className="h-full w-full object-contain transition-transform duration-200"
              fill
              sizes="66vw"
              alt={images[imageIndex]?.altText as string}
              src={images[imageIndex]?.src as string}
              priority={imageIndex === 0}
              style={
                zoomed
                  ? {
                      transform: "scale(2.5)",
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    }
                  : undefined
              }
            />
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
              onClick={() => setImageIndex(index)}
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
                  onClick={() => setImageIndex(index)}
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
