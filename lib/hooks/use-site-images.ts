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
  opacity: number;
  focusX: number;
  focusY: number;
};

function normalizeSlot(val: unknown, key: string): SlotData {
  const base: SlotData = { media: [DEFAULT_IMAGES[key] || ""], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };
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
      focusX: typeof obj.focusX === "number" ? obj.focusX : 50,
      focusY: typeof obj.focusY === "number" ? obj.focusY : 50,
    };
  }
  return base;
}

// Module-level cache — shared across all hook instances, no re-renders
let cachedSlots: Record<string, SlotData> | null = null;
let fetchPromise: Promise<void> | null = null;

// Load from server-injected data (instant, in HTML) or sessionStorage (refresh)
if (typeof window !== "undefined") {
  try {
    // Priority 1: server-injected data (always fresh, in the HTML)
    const injected = (window as unknown as Record<string, unknown>).__SITE_IMAGES__;
    if (injected && typeof injected === "object") {
      const slots: Record<string, SlotData> = {};
      for (const [k, v] of Object.entries(injected as Record<string, unknown>)) {
        slots[k] = normalizeSlot(v, k);
      }
      cachedSlots = slots;
      // Also update sessionStorage for any edge cases
      try { sessionStorage.setItem("atheles-site-images", JSON.stringify(injected)); } catch {}
    }
  } catch {}
  // Priority 2: sessionStorage fallback
  if (!cachedSlots) {
    try {
      const stored = sessionStorage.getItem("atheles-site-images");
      if (stored) {
        const parsed = JSON.parse(stored);
        const slots: Record<string, SlotData> = {};
        for (const [k, v] of Object.entries(parsed)) {
          slots[k] = normalizeSlot(v, k);
        }
        cachedSlots = slots;
      }
    } catch {}
  }
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
        // Cache to sessionStorage for instant load on next refresh
        try { sessionStorage.setItem("atheles-site-images", JSON.stringify(d.images)); } catch {}
      }
    })
    .catch(() => {});
  return fetchPromise;
}

function getSlot(key: string): SlotData {
  if (cachedSlots?.[key]) return cachedSlots[key];
  return { media: [DEFAULT_IMAGES[key] || ""], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };
}

export function useSiteImage(key: string): string {
  const [src, setSrc] = useState(cachedSlots?.[key]?.media[0] || DEFAULT_IMAGES[key] || "");

  useEffect(() => {
    if (cachedSlots) {
      setSrc(cachedSlots[key]?.media[0] || DEFAULT_IMAGES[key] || "");
      return;
    }
    fetchImages().then(() => {
      setSrc(cachedSlots?.[key]?.media[0] || DEFAULT_IMAGES[key] || "");
    });
  }, [key]);

  return src;
}

export function useSiteSlideshow(key: string) {
  const initial = getSlot(key);
  const first = initial.media[0] || DEFAULT_IMAGES[key] || "";

  const [slot, setSlot] = useState<SlotData>(initial);
  const [index, setIndex] = useState(0);
  const [layers, setLayers] = useState<[string, string]>([first, first]);
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);

  useEffect(() => {
    if (cachedSlots) {
      const s = cachedSlots[key] || initial;
      setSlot(s);
      setLayers([s.media[0] || first, s.media[0] || first]);
      return;
    }
    fetchImages().then(() => {
      const s = getSlot(key);
      setSlot(s);
      setLayers([s.media[0] || first, s.media[0] || first]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Slideshow timer
  useEffect(() => {
    if (slot.media.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % slot.media.length;
        const nextSrc = slot.media[next] || first;
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
  }, [slot.media.length, slot.interval, slot.media, first]);

  return {
    layers,
    activeLayer,
    slot,
    index,
    isSlideshow: slot.media.length > 1,
    currentSrc: layers[activeLayer] || first,
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
