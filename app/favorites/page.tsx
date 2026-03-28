"use client";

import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useCurrency } from "components/currency-context";
import { useFavorites } from "lib/hooks/use-favorites";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type FavoriteProduct = {
  handle: string;
  title: string;
  featuredImage?: { url: string } | null;
  priceRange: {
    maxVariantPrice: { amount: string; currencyCode: string };
  };
};

function FavoriteItem({
  product,
  onRemove,
}: {
  product: FavoriteProduct;
  onRemove: () => void;
}) {
  const { currency, convert } = useCurrency();
  const price = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(parseFloat(convert(product.priceRange.maxVariantPrice.amount)));

  return (
    <div className="group relative overflow-hidden rounded-lg border border-brand-dark-gold/20 bg-brand-dark transition-colors hover:border-brand-gold/30">
      <Link href={`/product/${product.handle}`} className="flex items-center gap-4 p-3">
        {/* Product image */}
        <div className="relative h-20 w-20 flex-none overflow-hidden rounded bg-[#222]">
          {product.featuredImage?.url ? (
            <Image
              src={product.featuredImage.url}
              alt={product.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-heading text-xs text-brand-gold/30">ATHELES</span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium tracking-wide text-white transition-colors group-hover:text-brand-gold">
            {product.title}
          </h3>
          <p className="mt-1 text-sm text-brand-grey">{price}</p>
        </div>
      </Link>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark/60 text-brand-gold transition-colors hover:bg-brand-dark hover:text-red-400"
        aria-label="Remove from favorites"
      >
        <HeartIconSolid className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    async function fetchProducts() {
      setLoading(true);
      try {
        // Fetch each favorite product
        const results = await Promise.all(
          favorites.map(async (handle) => {
            try {
              const res = await fetch(`/api/search?q=${encodeURIComponent(handle)}`);
              if (res.ok) {
                const data = await res.json();
                const match = data.products?.find(
                  (p: FavoriteProduct) => p.handle === handle
                );
                return match || null;
              }
            } catch {}
            return null;
          })
        );
        setProducts(results.filter(Boolean) as FavoriteProduct[]);
      } catch {
        setProducts([]);
      }
      setLoading(false);
    }

    fetchProducts();
  }, [favorites]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 font-heading text-3xl uppercase tracking-wider text-brand-gold sm:text-4xl">
        your favorites
      </h1>
      <div className="mb-8 h-px w-24 bg-brand-dark-gold/40" />

      {loading ? (
        <div className="py-12 text-center">
          <p className="text-sm text-brand-grey">loading...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-6 text-brand-grey">
            you haven&apos;t saved any favorites yet.
          </p>
          <Link
            href="/search"
            className="inline-block border border-brand-gold px-8 py-3 text-xs uppercase tracking-[0.18em] text-brand-gold transition-colors duration-300 hover:bg-brand-gold hover:text-brand-dark"
          >
            browse the shop
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {favorites.map((handle) => {
            const product = products.find((p) => p.handle === handle);
            if (!product) {
              return (
                <div
                  key={handle}
                  className="flex items-center justify-between rounded-lg border border-brand-dark-gold/20 p-3"
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
                    remove
                  </button>
                </div>
              );
            }
            return (
              <FavoriteItem
                key={handle}
                product={product}
                onRemove={() => removeFavorite(handle)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
