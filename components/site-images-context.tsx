"use client";

import { createContext, useContext, type ReactNode } from "react";

export type SlotData = {
  media: string[];
  transition: "crossfade" | "slide" | "fade";
  interval: number;
  grayscale: boolean;
  opacity: number;
  focusX: number;
  focusY: number;
};

const SiteImagesContext = createContext<Record<string, SlotData>>({});

/** Static context — no useState, no useEffect, no re-renders */
export function SiteImagesProvider({ data, children }: { data: Record<string, SlotData>; children: ReactNode }) {
  return <SiteImagesContext.Provider value={data}>{children}</SiteImagesContext.Provider>;
}

export function useSiteImagesContext() {
  return useContext(SiteImagesContext);
}
