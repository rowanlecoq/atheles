"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "lib/hooks/use-favorites";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export function FavoriteButton({ handle }: { handle: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const hookLiked = isFavorite(handle);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const liked = optimistic ?? hookLiked;
  const [popped, setPopped] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const showPreview = hovered && optimistic === null;

  const handleClick = () => {
    const wasLiked = liked;
    setOptimistic(!wasLiked);
    setHovered(false);
    toggleFavorite(handle);
    setPopped(true);
    setTimeout(() => setPopped(false), 180);
    setToast(wasLiked ? "removed!" : "saved!");
    setTimeout(() => { setToast(null); setOptimistic(null); }, 1300);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{ scale: popped ? 1.2 : 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-dark-gold/30 bg-brand-dark/50 backdrop-blur-sm transition-all duration-200 hover:border-brand-gold/50 hover:bg-brand-dark/80"
        aria-label={liked ? "Remove from favorites" : "Add to favorites"}
      >
        {liked ? (
          showPreview
            ? <HeartIcon className="h-5 w-5 text-brand-grey" />
            : <HeartIconSolid className="h-5 w-5 text-brand-gold" />
        ) : (
          showPreview
            ? <HeartIconSolid className="h-5 w-5 text-brand-gold" />
            : <HeartIcon className="h-5 w-5 text-brand-grey" />
        )}
      </motion.button>
      <AnimatePresence>
        {toast && (
          <motion.span
            key={toast}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-brand-dark/90 px-2 py-0.5 text-[10px] text-brand-gold"
          >
            {toast}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
