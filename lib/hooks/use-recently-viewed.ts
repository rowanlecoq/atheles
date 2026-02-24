"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "atheles-recently-viewed";
const MAX_ITEMS = 10;

export type RecentlyViewedItem = {
  handle: string;
  title: string;
  featuredImageUrl: string;
  price: string;
  currencyCode: string;
};

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const addItem = useCallback((item: RecentlyViewedItem) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.handle !== item.handle);
      const next = [item, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { items, addItem };
}
