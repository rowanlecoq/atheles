"use client";

import { useSiteSlideshow, isVideoSrc, isYouTubeSrc, getYouTubeEmbedUrl } from "lib/hooks/use-site-images";

/**
 * Uses plain <img> instead of Next.js Image to avoid hydration layout shifts.
 * These are background/decorative images served from CDN — they don't need
 * Next.js image optimization, and <img> renders identically on server and client.
 *
 * Critical layout properties (position, objectFit) are applied via inline style
 * so they are guaranteed to be present even before the Tailwind CSS bundle loads
 * (Turbopack injects CSS via JS, creating a brief window where classes don't apply).
 */
function MediaElement({
  src,
  className = "",
  iframeClass = "",
  objectPosition,
  priority = false,
}: {
  src: string;
  className?: string;
  iframeClass?: string;
  objectPosition?: string;
  priority?: boolean;
}) {
  const layoutStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    ...(objectPosition ? { objectPosition } : {}),
  };

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
        className={className}
        style={layoutStyle}
      />
    );
  }
  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src={src}
      alt=""
      className={className}
      style={layoutStyle}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
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
  priority = false,
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

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    ...mediaStyle,
  };

  if (!currentSrc) return null;

  if (!isSlideshow) {
    return (
      <div style={wrapperStyle}>
        <MediaElement src={currentSrc} className={cleanClass} iframeClass={cleanIframeClass} objectPosition={objPos} priority={priority} />
      </div>
    );
  }

  const durationMs = slot.transition === "fade" ? 1800 : 2000;

  return (
    <div style={wrapperStyle}>
      {[0, 1].map((layerIdx) => {
        const isActive = activeLayer === layerIdx;
        return (
          <div
            key={layerIdx}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
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
