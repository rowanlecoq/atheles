"use client";

import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "lib/hooks/use-favorites";
import Link from "next/link";

export function FavoritesIcon() {
  const { count } = useFavorites();

  return (
    <Link
      href="/favorites"
      className="group relative flex h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold"
      aria-label="Favorites"
    >
      <HeartOutline className="h-6 w-6 group-hover:hidden" />
      <HeartSolid className="hidden h-6 w-6 group-hover:block" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-gold text-[9px] font-bold text-brand-dark md:h-4 md:w-4 md:text-xs">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
