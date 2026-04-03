"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { useFavorites } from "lib/hooks/use-favorites";
import Link from "next/link";

export function FavoritesIcon() {
  const { count } = useFavorites();

  return (
    <Link
      href="/favorites"
      className="relative flex h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold"
      aria-label="Favorites"
    >
      <HeartIcon className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-xs font-bold text-brand-dark">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
