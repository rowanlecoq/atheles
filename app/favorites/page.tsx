"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { FadeIn } from "components/animations";
import { useCurrency } from "components/currency-context";
import { useFavorites } from "lib/hooks/use-favorites";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
      <Link
        href={`/product/${product.handle}`}
        className="flex items-center gap-4 p-3"
      >
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
              <span className="font-heading text-xs text-brand-gold/30">
                ATHELES
              </span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium tracking-wide text-white transition-colors group-hover:text-brand-gold sm:text-sm">
            {product.title}
          </h3>
          <p className="mt-1 text-base text-brand-grey sm:text-sm">{price}</p>
        </div>
      </Link>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="group/heart absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center"
        aria-label="Remove from favorites"
      >
        <HeartIconSolid className="h-6 w-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] text-brand-gold group-hover/heart:hidden" />
        <HeartIcon className="hidden h-6 w-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] text-brand-gold group-hover/heart:block" />
      </button>
    </div>
  );
}

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedHandlesRef = useRef<string>("");

  useEffect(() => {
    // Build a key from sorted handles to avoid refetching the same set
    const key = [...favorites].sort().join(",");

    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      fetchedHandlesRef.current = "";
      return;
    }

    // Skip fetch if we already have this exact set
    if (key === fetchedHandlesRef.current) {
      // Just filter out removed items from existing products
      setProducts((prev) =>
        prev.filter((p) => favorites.includes(p.handle)),
      );
      return;
    }

    // Check which handles we already have cached
    setProducts((prev) => {
      const cached = prev.filter((p) => favorites.includes(p.handle));
      const missing = favorites.filter(
        (h) => !cached.some((p) => p.handle === h),
      );

      if (missing.length === 0) {
        fetchedHandlesRef.current = key;
        setLoading(false);
        return cached;
      }

      // Fetch only missing products
      setLoading(true);
      fetch("/api/products/by-handles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: missing }),
      })
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((data) => {
          const newProducts: FavoriteProduct[] = data.products || [];
          // Auto-remove any handles that no longer exist in Shopify
          const foundHandles = new Set(newProducts.map((p) => p.handle));
          missing.forEach((h) => {
            if (!foundHandles.has(h)) removeFavorite(h);
          });
          setProducts([...cached, ...newProducts]);
          fetchedHandlesRef.current = key;
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      return cached;
    });
  }, [favorites]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <FadeIn direction="up">
        <h1 className="mb-2 font-heading text-3xl uppercase tracking-wider text-brand-gold sm:text-4xl">
          your favorites.
        </h1>
      </FadeIn>
      <FadeIn direction="none" delay={0.1}>
        <div className="mb-8 h-px w-24 bg-brand-dark-gold/40" />
      </FadeIn>

      {loading && products.length === 0 ? (
        <FadeIn delay={0.15} className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: Math.min(favorites.length || 2, 4) }).map(
            (_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-3"
              >
                <div className="h-20 w-20 flex-none animate-pulse rounded bg-brand-dark-gold/15" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-brand-dark-gold/15" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-brand-dark-gold/15" />
                </div>
              </div>
            ),
          )}
        </FadeIn>
      ) : favorites.length === 0 ? (
        <FadeIn delay={0.15} className="py-12 text-center">
          <p className="mb-6 text-base text-brand-grey">
            you haven&apos;t saved any favorites yet.
          </p>
          <Link
            href="/search"
            className="inline-block border border-brand-gold px-8 py-3 text-xs uppercase tracking-[0.18em] text-brand-gold transition-colors duration-300 hover:bg-brand-gold hover:text-brand-dark"
          >
            browse the shop
          </Link>
        </FadeIn>
      ) : (
        <FadeIn delay={0.15} className="grid gap-3 sm:grid-cols-2">
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
        </FadeIn>
      )}
    </div>
  );
}
