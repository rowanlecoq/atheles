"use client";

import { useEffect, useState } from "react";
import { useSiteImagesContext, type SlotData } from "components/site-images-context";

export type { SlotData } from "components/site-images-context";

const DEFAULT_IMAGES: Record<string, string> = {
  hero_bg: "/statues/greek-god-hero.png",
  hero_left: "/statues/augustus-primaporta.jpg",
  hero_right: "/statues/trajan-louvre.jpg",
  store_header: "/statues/greek-god-hero.png",
  newsletter: "/statues/roman-emperor-pergamon.jpg",
  brand_story: "/statues/roman-emperor-pergamon.jpg",
  interstitial: "/statues/hadrian-cuirassed.jpg",
};

const DEFAULT_SLOT: SlotData = { media: [], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };

/** Returns the first media URL for a slot (backwards-compatible) */
export function useSiteImage(key: string): string {
  const ctx = useSiteImagesContext();
  return ctx[key]?.media[0] || DEFAULT_IMAGES[key] || "";
}

/**
 * Returns full slideshow data for a slot using a dual-layer A/B crossfade.
 * Reads from server-provided context — same data on SSR and client, no flash.
 */
export function useSiteSlideshow(key: string) {
  const ctx = useSiteImagesContext();
  const slot = ctx[key] || { ...DEFAULT_SLOT, media: [DEFAULT_IMAGES[key] || ""] };
  const fallback = slot.media[0] || DEFAULT_IMAGES[key] || "";

  const [index, setIndex] = useState(0);
  const [layers, setLayers] = useState<[string, string]>([fallback, fallback]);
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);

  // Sync layers when context data changes (e.g. after admin save)
  useEffect(() => {
    const src = slot.media[0] || fallback;
    setLayers([src, src]);
    setIndex(0);
    setActiveLayer(0);
  }, [slot.media[0], fallback]);

  // Slideshow timer
  useEffect(() => {
    if (slot.media.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % slot.media.length;
        const nextSrc = slot.media[next] || fallback;
        setActiveLayer((al) => {
          const newActive: 0 | 1 = al === 0 ? 1 : 0;
          setLayers((ls) => {
            const copy: [string, string] = [...ls];
            copy[newActive] = nextSrc;
            return copy;
          });
          return newActive;
        });
        return next;
      });
    }, slot.interval);
    return () => clearInterval(timer);
  }, [slot.media.length, slot.interval, slot.media, fallback]);

  return {
    layers,
    activeLayer,
    slot,
    index,
    isSlideshow: slot.media.length > 1,
    currentSrc: layers[activeLayer] || fallback,
  };
}

export function isVideoSrc(src: string): boolean {
  return src.endsWith(".mp4") || src.endsWith(".webm");
}

export function isYouTubeSrc(src: string): boolean {
  return src.includes("youtube.com") || src.includes("youtu.be");
}

export function getYouTubeEmbedUrl(src: string): string | null {
  const match = src.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playlist=${match[1]}` : null;
}
