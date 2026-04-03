"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type SlotData = {
  media: string[];
  transition: "crossfade" | "slide" | "fade";
  interval: number;
  grayscale: boolean;
  opacity: number;
  focusX: number;
  focusY: number;
};

const DEFAULT_IMAGES: Record<string, string> = {
  hero_bg: "/statues/greek-god-hero.png",
  hero_left: "/statues/augustus-primaporta.jpg",
  hero_right: "/statues/trajan-louvre.jpg",
  store_header: "/statues/greek-god-hero.png",
  newsletter: "/statues/roman-emperor-pergamon.jpg",
  brand_story: "/statues/roman-emperor-pergamon.jpg",
  interstitial: "/statues/hadrian-cuirassed.jpg",
};

function makeDefault(key: string): SlotData {
  return { media: [DEFAULT_IMAGES[key] || ""], transition: "crossfade", interval: 6000, grayscale: true, opacity: 50, focusX: 50, focusY: 50 };
}

const defaultCtx: Record<string, SlotData> = {};
for (const key of Object.keys(DEFAULT_IMAGES)) {
  defaultCtx[key] = makeDefault(key);
}

const SiteImagesContext = createContext<Record<string, SlotData>>(defaultCtx);

export function SiteImagesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Record<string, SlotData>>(defaultCtx);

  useEffect(() => {
    fetch("/api/admin/images")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.images) setData(d.images);
      })
      .catch(() => {});
  }, []);

  return <SiteImagesContext.Provider value={data}>{children}</SiteImagesContext.Provider>;
}

export function useSiteImagesContext() {
  return useContext(SiteImagesContext);
}
