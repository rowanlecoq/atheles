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

function storeLocal(favorites: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // storage full or unavailable
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const favoritesRef = useRef(favorites);
  const loggedInRef = useRef(false);
  const syncedRef = useRef(false);
  const savingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  // On mount: load from localStorage immediately, then fetch from server
  useEffect(() => {
    const local = getStoredFavorites();
    setFavorites(local);
    favoritesRef.current = local;

    // Check if logged in and fetch server favorites
    const loggedIn = document.cookie.includes("atheles-logged-in=1");
    loggedInRef.current = loggedIn;

    if (loggedIn) {
      fetch("/api/auth/favorites")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || data.favorites === null) return;
          const server: string[] = data.favorites;
          const local = favoritesRef.current;

          // Merge: union of local + server (keeps items from both devices)
          const merged = Array.from(new Set([...server, ...local]));
          favoritesRef.current = merged;
          setFavorites(merged);
          storeLocal(merged);
          syncedRef.current = true;

          // If merged differs from server, push merged back
          if (merged.length !== server.length || !merged.every((h) => server.includes(h))) {
            fetch("/api/auth/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ favorites: merged }),
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, []);

  // Debounced save to server (for adds)
  const saveToServer = useCallback((next: string[]) => {
    if (!loggedInRef.current) return;
    if (savingRef.current) clearTimeout(savingRef.current);
    savingRef.current = setTimeout(() => {
      fetch("/api/auth/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorites: next }),
      }).catch(() => {});
    }, 500);
  }, []);

  const saveToServerNow = useCallback((next: string[]) => {
    if (!loggedInRef.current) return;
    if (savingRef.current) clearTimeout(savingRef.current);
    fetch("/api/auth/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorites: next }),
    }).catch(() => {});
  }, []);

  const persist = useCallback(
    (next: string[], immediate = false) => {
      favoritesRef.current = next;
      setFavorites(next);
      storeLocal(next);
      if (immediate) saveToServerNow(next); else saveToServer(next);
      window.dispatchEvent(new Event("favorites-changed"));
    },
    [saveToServer, saveToServerNow],
  );

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
      persist(favoritesRef.current.filter((h) => h !== handle), true);
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
