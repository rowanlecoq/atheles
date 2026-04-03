"use client";

import { useSiteSlideshow, isVideoSrc, isYouTubeSrc, getYouTubeEmbedUrl } from "lib/hooks/use-site-images";
import Image from "next/image";

function MediaElement({
  src,
  className = "",
  sizes = "100vw",
  priority = false,
  iframeClass = "",
}: {
  src: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  iframeClass?: string;
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
      <video src={src} autoPlay muted loop playsInline className={className} />
    );
  }
  return (
    <Image
      src={src}
      alt=""
      fill
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );
}

/**
 * When grayscale is off, strip the grayscale class and boost opacity
 * so full-color images are actually visible (the grayscale defaults
 * used very low opacity like 10-15% which looks washed out in color).
 */
function resolveColorClasses(cls: string): string {
  return cls
    .replace(/\bgrayscale\b/g, "")
    .replace(/\bopacity-(\d+)\b/g, (_match, val) => {
      const n = parseInt(val, 10);
      // Boost low opacities: 10→30, 15→35, 25→45, 50→60, 70→80
      if (n <= 15) return `opacity-30`;
      if (n <= 25) return `opacity-45`;
      if (n <= 50) return `opacity-60`;
      if (n <= 70) return `opacity-80`;
      return `opacity-${val}`;
    })
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Renders a slideshow with smooth cinematic crossfade transitions.
 * Uses a dual A/B layer approach: the active layer fades in over the
 * outgoing layer with a long, eased transition for a premium feel.
 * Respects per-slot grayscale setting from admin.
 */
export function SlideshowMedia({
  slotKey,
  className = "",
  sizes = "100vw",
  priority = false,
  iframeClass = "",
}: {
  slotKey: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  iframeClass?: string;
}) {
  const { currentSrc, layers, activeLayer, isSlideshow, slot } = useSiteSlideshow(slotKey);

  const resolvedClass = slot.grayscale ? className : resolveColorClasses(className);
  const resolvedIframeClass = slot.grayscale ? iframeClass : resolveColorClasses(iframeClass);

  if (!isSlideshow) {
    return <MediaElement src={currentSrc} className={resolvedClass} sizes={sizes} priority={priority} iframeClass={resolvedIframeClass} />;
  }

  // Transition duration: longer = smoother
  const durationMs = slot.transition === "fade" ? 1800 : 2000;

  return (
    <>
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
              className={resolvedClass}
              sizes={sizes}
              priority={priority && layerIdx === 0}
              iframeClass={resolvedIframeClass}
            />
          </div>
        );
      })}
    </>
  );
}
