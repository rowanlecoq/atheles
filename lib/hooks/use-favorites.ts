"use client";

import { useCallback, useEffect, useState, useRef } from "react";

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
  const favoritesRef = useRef(favorites);

  useEffect(() => {
    const stored = getStoredFavorites();
    setFavorites(stored);
    favoritesRef.current = stored;
  }, []);

  // Keep ref in sync
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  const persist = useCallback((next: string[]) => {
    favoritesRef.current = next;
    setFavorites(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("favorites-changed"));
    } catch {
      // storage full or unavailable
    }
  }, []);

  const addFavorite = useCallback(
    (handle: string) => {
      const current = favoritesRef.current;
      if (current.includes(handle)) return;
      persist([...current, handle]);
    },
    [persist],
  );

  const removeFavorite = useCallback(
    (handle: string) => {
      persist(favoritesRef.current.filter((h) => h !== handle));
    },
    [persist],
  );

  const toggleFavorite = useCallback(
    (handle: string) => {
      if (favoritesRef.current.includes(handle)) {
        removeFavorite(handle);
      } else {
        addFavorite(handle);
      }
    },
    [addFavorite, removeFavorite],
  );

  const isFavorite = useCallback(
    (handle: string) => favorites.includes(handle),
    [favorites],
  );

  // Listen for changes from other components
  useEffect(() => {
    const handleChange = () => {
      const stored = getStoredFavorites();
      setFavorites(stored);
      favoritesRef.current = stored;
    };
    window.addEventListener("favorites-changed", handleChange);
    return () => window.removeEventListener("favorites-changed", handleChange);
  }, []);

  return {
    favorites,
    count: favorites.length,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
