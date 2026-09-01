"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useCurrency } from "components/currency-context";
import { DEFAULT_OPTION } from "lib/constants";
import { useFavorites } from "lib/hooks/use-favorites";
import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
  handle: string;
  title: string;
  featuredImageUrl?: string;
  price: string;
  currencyCode: string;
  variants?: { title: string }[];
  tags?: string[];
};

export function ProductCard({
  handle,
  title,
  featuredImageUrl,
  price,
  currencyCode,
  variants = [],
  tags = [],
}: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currency, convert } = useCurrency();
  const liked = isFavorite(handle);

  // Get color from first variant title (e.g. "Black / M" → "Black")
  // Filter out size-only names to avoid showing "XS", "S", "M" etc. as colors
  const sizeNames = new Set(["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "OS", "One Size", DEFAULT_OPTION]);
  const colorName =
    variants.length > 0 ? variants[0]?.title.split(" / ")[0] : undefined;
  const displayColorName =
    colorName && !sizeNames.has(colorName) ? colorName : undefined;

  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(parseFloat(convert(price)));

  return (
    <div className="group relative">
      {/* Image container */}
      <Link
        href={`/product/${handle}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-[#1a1a1a]"
      >
        {featuredImageUrl ? (
          <Image
            src={featuredImageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 72vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#222]">
            <span className="text-4xl opacity-20" aria-hidden="true">🔱</span>
          </div>
        )}

        {/* Tags overlay (bottom-left) */}
        {tags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="bg-brand-dark/90 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Favorite button — inside image so it positions relative to image bottom-right */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(handle);
          }}
          className="group/heart absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center"
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
        >
          {liked ? (
            <>
              <HeartIconSolid className="h-6 w-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] text-brand-gold group-hover/heart:hidden" />
              <HeartIcon className="hidden h-6 w-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] text-brand-gold group-hover/heart:block" />
            </>
          ) : (
            <>
              <HeartIcon className="h-6 w-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] text-white/60 group-hover/heart:hidden" />
              <HeartIcon className="hidden h-6 w-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] text-brand-gold group-hover/heart:block" />
            </>
          )}
        </button>
      </Link>

      {/* Product info */}
      <div className="mt-3 space-y-0.5">
        <Link href={`/product/${handle}`}>
          <h3 className="text-sm font-medium tracking-wide text-white transition-colors group-hover:text-brand-gold">
            {title}
          </h3>
        </Link>
        {displayColorName && (
          <p className="text-xs tracking-wide text-brand-grey">
            {displayColorName}
          </p>
        )}
        <p className="pt-0.5 text-sm font-semibold tracking-wide text-white">
          {formattedPrice}
        </p>
      </div>
    </div>
  );
}
