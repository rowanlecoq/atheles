"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "atheles-favorites";

function getStoredFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getStoredFavorites());
  }, []);

  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full or unavailable
    }
  }, []);

  const addFavorite = useCallback(
    (handle: string) => {
      persist([...new Set([...favorites, handle])]);
    },
    [favorites, persist],
  );

  const removeFavorite = useCallback(
    (handle: string) => {
      persist(favorites.filter((h) => h !== handle));
    },
    [favorites, persist],
  );

  const toggleFavorite = useCallback(
    (handle: string) => {
      if (favorites.includes(handle)) {
        removeFavorite(handle);
      } else {
        addFavorite(handle);
      }
    },
    [favorites, addFavorite, removeFavorite],
  );

  const isFavorite = useCallback(
    (handle: string) => favorites.includes(handle),
    [favorites],
  );

  return {
    favorites,
    count: favorites.length,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
