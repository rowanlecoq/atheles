"use client";

import { useSiteSlideshow, isVideoSrc, isYouTubeSrc, getYouTubeEmbedUrl } from "lib/hooks/use-site-images";

/**
 * Uses plain <img> instead of Next.js Image to avoid hydration layout shifts.
 * These are background/decorative images served from CDN — they don't need
 * Next.js image optimization, and <img> renders identically on server and client.
 */
function MediaElement({
  src,
  className = "",
  iframeClass = "",
  objectPosition,
}: {
  src: string;
  className?: string;
  iframeClass?: string;
  objectPosition?: string;
}) {
  if (isYouTubeSrc(src)) {
    return (
      <iframe
        src={getYouTubeEmbedUrl(src) || ""}
        className={iframeClass || className}
        allow="autoplay"
        style={{ border: 0 }}
      />
    );
  }
  if (isVideoSrc(src)) {
    return (
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 h-full w-full ${className}`}
        style={objectPosition ? { objectPosition } : undefined}
      />
    );
  }
  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src={src}
      alt=""
      className={`absolute inset-0 h-full w-full ${className}`}
      style={objectPosition ? { objectPosition } : undefined}
    />
  );
}

/**
 * Strip opacity-* and grayscale from Tailwind classes — we apply them
 * via inline style using the admin-configured values instead.
 */
function stripDisplayClasses(cls: string, stripPosition = false): string {
  let result = cls
    .replace(/\bgrayscale\b/g, "")
    .replace(/\bopacity-\d+\b/g, "");
  if (stripPosition) {
    result = result.replace(/\bobject-(top|bottom|center|left|right|left-top|left-bottom|right-top|right-bottom)\b/g, "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

export function SlideshowMedia({
  slotKey,
  className = "",
  iframeClass = "",
}: {
  slotKey: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  iframeClass?: string;
}) {
  const { currentSrc, layers, activeLayer, isSlideshow, slot } = useSiteSlideshow(slotKey);

  const hasCustomFocus = slot.focusX !== 50 || slot.focusY !== 50;
  const objPos = hasCustomFocus ? `${slot.focusX}% ${slot.focusY}%` : undefined;
  const cleanClass = stripDisplayClasses(className, hasCustomFocus);
  const cleanIframeClass = stripDisplayClasses(iframeClass, hasCustomFocus);

  const mediaStyle: React.CSSProperties = {
    opacity: slot.opacity / 100,
    filter: slot.grayscale ? "grayscale(1)" : "none",
  };

  if (!isSlideshow) {
    return (
      <div className="absolute inset-0 overflow-hidden" style={mediaStyle}>
        <MediaElement src={currentSrc} className={cleanClass} iframeClass={cleanIframeClass} objectPosition={objPos} />
      </div>
    );
  }

  const durationMs = slot.transition === "fade" ? 1800 : 2000;

  return (
    <div className="absolute inset-0 overflow-hidden" style={mediaStyle}>
      {[0, 1].map((layerIdx) => {
        const isActive = activeLayer === layerIdx;
        return (
          <div
            key={layerIdx}
            className="absolute inset-0"
            style={{
              opacity: isActive ? 1 : 0,
              zIndex: isActive ? 1 : 0,
              transition: `opacity ${durationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
            aria-hidden={!isActive}
          >
            <MediaElement
              src={layers[layerIdx as 0 | 1]!}
              className={cleanClass}
              iframeClass={cleanIframeClass}
              objectPosition={objPos}
            />
          </div>
        );
      })}
    </div>
  );
}
