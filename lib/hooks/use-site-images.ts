"use client";

import { useEffect, useState } from "react";

const DEFAULT_IMAGES: Record<string, string> = {
  hero_bg: "/statues/greek-god-hero.png",
  hero_left: "/statues/augustus-primaporta.jpg",
  hero_right: "/statues/trajan-louvre.jpg",
  store_header: "/statues/greek-god-hero.png",
  newsletter: "/statues/roman-emperor-pergamon.jpg",
  brand_story: "/statues/roman-emperor-pergamon.jpg",
  interstitial: "/statues/hadrian-cuirassed.jpg",
};

export type SlotData = {
  media: string[];
  transition: "crossfade" | "slide" | "fade";
  interval: number;
  grayscale: boolean;
  opacity: number; // 0–100
};

let cachedSlots: Record<string, SlotData> | null = null;
let fetchPromise: Promise<void> | null = null;
let fetchDone = false;

/** Normalise legacy string or new SlotData */
function normalizeSlot(val: unknown, key: string): SlotData {
  const base: SlotData = { media: [DEFAULT_IMAGES[key] || ""], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50 };
  if (!val) return base;
  if (typeof val === "string") return { ...base, media: [val] };
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    return {
      media: Array.isArray(obj.media) ? obj.media.filter((m): m is string => typeof m === "string") : [],
      transition: (["crossfade", "slide", "fade"].includes(obj.transition as string) ? obj.transition : "crossfade") as SlotData["transition"],
      interval: typeof obj.interval === "number" ? obj.interval : 6000,
      grayscale: typeof obj.grayscale === "boolean" ? obj.grayscale : true,
      opacity: typeof obj.opacity === "number" ? obj.opacity : 50,
    };
  }
  return base;
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
      fetchDone = true;
    })
    .catch(() => { fetchDone = true; });
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

/**
 * Returns full slideshow data for a slot using a dual-layer A/B crossfade.
 * `ready` is false until the API has responded, preventing flash of defaults.
 */
export function useSiteSlideshow(key: string) {
  const fallback = DEFAULT_IMAGES[key] || "";
  const defaultSlot: SlotData = { media: [fallback], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50 };

  const [slot, setSlot] = useState<SlotData>(cachedSlots?.[key] || defaultSlot);
  const [ready, setReady] = useState(fetchDone || !!cachedSlots);
  const [index, setIndex] = useState(0);
  const [layers, setLayers] = useState<[string, string]>(() => {
    const first = cachedSlots?.[key]?.media[0] || fallback;
    return [first, first];
  });
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);

  useEffect(() => {
    if (cachedSlots) {
      const s = cachedSlots[key] || defaultSlot;
      setSlot(s);
      setLayers([s.media[0] || fallback, s.media[0] || fallback]);
      setReady(true);
      return;
    }
    fetchImages().then(() => {
      const s = cachedSlots?.[key] || defaultSlot;
      setSlot(s);
      setLayers([s.media[0] || fallback, s.media[0] || fallback]);
      setReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Slideshow timer — advances index and swaps active layer
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
    ready,
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
