"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "lib/hooks/use-favorites";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export function FavoriteCardButton({
  handle,
  className = "absolute right-3 top-3 z-10",
}: {
  handle: string;
  className?: string;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const hookLiked = isFavorite(handle);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const liked = optimistic ?? hookLiked;
  const [popped, setPopped] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const showPreview = hovered && optimistic === null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasLiked = liked;
    setOptimistic(!wasLiked);
    toggleFavorite(handle);
    setPopped(true);
    setTimeout(() => setPopped(false), 180);
    setToast(wasLiked ? "removed!" : "added!");
    setTimeout(() => { setToast(null); setOptimistic(null); }, 1300);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ scale: popped ? 1.25 : 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`${className} flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark/60 backdrop-blur-sm transition-colors duration-200 hover:bg-brand-dark/80`}
      aria-label={liked ? "Remove from favorites" : "Add to favorites"}
    >
      {liked ? (
        showPreview
          ? <HeartIcon className="h-5 w-5 text-white/50" />
          : <HeartIconSolid className="h-5 w-5 text-brand-gold" />
      ) : (
        showPreview
          ? <HeartIconSolid className="h-5 w-5 text-brand-gold" />
          : <HeartIcon className="h-5 w-5 text-white/70" />
      )}
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
    </motion.button>
  );
}
