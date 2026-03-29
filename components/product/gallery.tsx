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
  const touchStartX = useRef<number | null>(null);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) nextImage();
      else prevImage();
    }
    touchStartX.current = null;
  };

  return (
    <div>
      {/* Main image with swipe support */}
      <div
        className="relative aspect-square h-full max-h-[500px] w-full overflow-hidden rounded-lg sm:max-h-[600px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images[imageIndex] && (
          <Image
            className="h-full w-full object-contain"
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            alt={images[imageIndex]?.altText as string}
            src={images[imageIndex]?.src as string}
            priority={imageIndex === 0}
          />
        )}

        {/* Left/Right click zones (invisible, large tap targets) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-0 top-0 h-full w-1/3 cursor-w-resize opacity-0"
              aria-label="Previous image"
            />
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-0 top-0 h-full w-1/3 cursor-e-resize opacity-0"
              aria-label="Next image"
            />
          </>
        )}
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
