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

let cachedImages: Record<string, string> | null = null;
let fetchPromise: Promise<void> | null = null;

function fetchImages() {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/admin/images")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.images) cachedImages = d.images;
    })
    .catch(() => {});
  return fetchPromise;
}

export function useSiteImage(key: string): string {
  const [src, setSrc] = useState(cachedImages?.[key] || DEFAULT_IMAGES[key] || "");

  useEffect(() => {
    if (cachedImages) {
      setSrc(cachedImages[key] || DEFAULT_IMAGES[key] || "");
      return;
    }
    fetchImages().then(() => {
      setSrc(cachedImages?.[key] || DEFAULT_IMAGES[key] || "");
    });
  }, [key]);

  return src;
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
