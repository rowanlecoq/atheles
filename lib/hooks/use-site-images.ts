"use client";

import { useEffect, useState, useCallback } from "react";

const DEFAULT_IMAGES: Record<string, string> = {
  hero_bg: "/statues/greek-god-hero.png",
  hero_left: "/statues/augustus-primaporta.jpg",
  hero_right: "/statues/trajan-louvre.jpg",
  store_header: "/statues/greek-god-hero.png",
  newsletter: "/statues/roman-emperor-pergamon.jpg",
  brand_story: "/statues/roman-emperor-pergamon.jpg",
  interstitial: "/statues/hadrian-cuirassed.jpg",
};

type SlotData = {
  media: string[];
  transition: "crossfade" | "slide" | "fade";
  interval: number;
};

let cachedSlots: Record<string, SlotData> | null = null;
let fetchPromise: Promise<void> | null = null;

/** Normalise legacy string or new SlotData */
function normalizeSlot(val: unknown, key: string): SlotData {
  if (!val) return { media: [DEFAULT_IMAGES[key] || ""], transition: "crossfade", interval: 6000 };
  if (typeof val === "string") return { media: [val], transition: "crossfade", interval: 6000 };
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    return {
      media: Array.isArray(obj.media) ? obj.media.filter((m): m is string => typeof m === "string") : [],
      transition: (["crossfade", "slide", "fade"].includes(obj.transition as string) ? obj.transition : "crossfade") as SlotData["transition"],
      interval: typeof obj.interval === "number" ? obj.interval : 6000,
    };
  }
  return { media: [DEFAULT_IMAGES[key] || ""], transition: "crossfade", interval: 6000 };
}

function fetchImages() {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/admin/images")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.images) {
        const slots: Record<string, SlotData> = {};
        for (const [k, v] of Object.entries(d.images)) {
          slots[k] = normalizeSlot(v, k);
        }
        cachedSlots = slots;
      }
    })
    .catch(() => {});
  return fetchPromise;
}

/** Returns the first media URL for a slot (backwards-compatible) */
export function useSiteImage(key: string): string {
  const fallback = DEFAULT_IMAGES[key] || "";
  const [src, setSrc] = useState(cachedSlots?.[key]?.media[0] || fallback);

  useEffect(() => {
    if (cachedSlots) {
      setSrc(cachedSlots[key]?.media[0] || fallback);
      return;
    }
    fetchImages().then(() => {
      setSrc(cachedSlots?.[key]?.media[0] || fallback);
    });
  }, [key, fallback]);

  return src;
}

/** Returns full slideshow data for a slot: current src, all media, transition config */
export function useSiteSlideshow(key: string) {
  const fallback = DEFAULT_IMAGES[key] || "";
  const defaultSlot: SlotData = { media: [fallback], transition: "crossfade", interval: 6000 };

  const [slot, setSlot] = useState<SlotData>(cachedSlots?.[key] || defaultSlot);
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (cachedSlots) {
      setSlot(cachedSlots[key] || defaultSlot);
      return;
    }
    fetchImages().then(() => {
      setSlot(cachedSlots?.[key] || defaultSlot);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Slideshow timer
  useEffect(() => {
    if (slot.media.length <= 1) return;
    const timer = setInterval(() => {
      setTransitioning(true);
      setPrevIndex((prev) => {
        // prev is old index; we set it to current before advancing
        return index;
      });
      setTimeout(() => {
        setIndex((i) => (i + 1) % slot.media.length);
        setTimeout(() => setTransitioning(false), 50);
      }, 0);
    }, slot.interval);
    return () => clearInterval(timer);
  }, [slot.media.length, slot.interval, index]);

  const currentSrc = slot.media[index] || fallback;
  const prevSrc = slot.media[prevIndex] || currentSrc;

  return {
    currentSrc,
    prevSrc,
    transitioning,
    slot,
    index,
    isSlideshow: slot.media.length > 1,
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
