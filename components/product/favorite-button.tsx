"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "lib/hooks/use-favorites";

export function FavoriteButton({ handle }: { handle: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(handle);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(handle)}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-dark-gold/30 bg-brand-dark/50 backdrop-blur-sm transition-all duration-200 hover:border-brand-gold/50 hover:bg-brand-dark/80"
      aria-label={liked ? "Remove from favorites" : "Add to favorites"}
    >
      {liked ? (
        <HeartIconSolid className="h-5 w-5 text-brand-gold" />
      ) : (
        <HeartIcon className="h-5 w-5 text-brand-grey transition-colors hover:text-brand-gold" />
      )}
    </button>
  );
}
