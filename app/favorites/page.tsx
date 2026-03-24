"use client";

import { useFavorites } from "lib/hooks/use-favorites";
import Link from "next/link";

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 font-heading text-3xl uppercase tracking-wider text-brand-gold sm:text-4xl">
        Your Favorites
      </h1>
      <div className="mb-8 h-px w-24 bg-brand-dark-gold/40" />

      {favorites.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-6 text-brand-grey">
            You haven&apos;t saved any favorites yet.
          </p>
          <Link
            href="/search"
            className="inline-block border border-brand-gold px-8 py-3 text-xs uppercase tracking-[0.18em] text-brand-gold transition-colors duration-300 hover:bg-brand-gold hover:text-brand-dark"
          >
            Browse the Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((handle) => (
            <div
              key={handle}
              className="flex items-center justify-between rounded-md border border-brand-dark-gold/20 px-4 py-3"
            >
              <Link
                href={`/product/${handle}`}
                className="text-sm uppercase tracking-wider text-brand-grey transition-colors hover:text-brand-gold"
              >
                {handle.replace(/-/g, " ")}
              </Link>
              <button
                type="button"
                onClick={() => removeFavorite(handle)}
                className="text-xs uppercase tracking-wider text-brand-dark-gold transition-colors hover:text-brand-gold"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
