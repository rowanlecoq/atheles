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
 * Renders a slideshow with crossfade transitions for a given site image slot.
 * When only one image exists, renders it directly with no transition overhead.
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
  const { currentSrc, prevSrc, transitioning, isSlideshow, slot } = useSiteSlideshow(slotKey);

  if (!isSlideshow) {
    return <MediaElement src={currentSrc} className={className} sizes={sizes} priority={priority} iframeClass={iframeClass} />;
  }

  // Determine transition duration based on type
  const duration = slot.transition === "fade" ? "duration-1000" : "duration-[1200ms]";

  return (
    <>
      {/* Layer 1: previous/outgoing */}
      <div
        className={`absolute inset-0 transition-opacity ${duration} ease-in-out ${transitioning ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      >
        <MediaElement src={prevSrc} className={className} sizes={sizes} iframeClass={iframeClass} />
      </div>
      {/* Layer 2: current/incoming */}
      <div
        className={`absolute inset-0 transition-opacity ${duration} ease-in-out ${transitioning ? "opacity-0" : "opacity-100"}`}
      >
        <MediaElement src={currentSrc} className={className} sizes={sizes} priority={priority} iframeClass={iframeClass} />
      </div>
    </>
  );
}
