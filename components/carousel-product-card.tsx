"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "lib/hooks/use-favorites";
import Image from "next/image";
import Link from "next/link";
import Price from "components/price";
import type { Product } from "lib/shopify/types";

export function CarouselProductCard({ product }: { product: Product }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(product.handle);
  const secondImage = product.images?.[1]?.url;

  return (
    <div className="group">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-brand-dark">
        <Link href={`/product/${product.handle}`} prefetch={true}>
          {product.featuredImage?.url && (
            <Image
              src={product.featuredImage.url}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 72vw"
              className={`h-full w-full object-cover transition-opacity duration-500 ${
                secondImage ? "group-hover:opacity-0" : ""
              }`}
            />
          )}
          {secondImage && (
            <Image
              src={secondImage}
              alt={`${product.title} - alternate`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 72vw"
              className="h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Favorite */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.handle);
            const btn = e.currentTarget;
            btn.style.transform = "scale(1.3)";
            setTimeout(() => { btn.style.transform = ""; }, 200);
          }}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark/60 backdrop-blur-sm transition-all duration-200 hover:bg-brand-dark/80 active:scale-90"
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
        >
          {liked ? (
            <HeartIconSolid className="h-5 w-5 text-brand-gold" />
          ) : (
            <HeartIcon className="h-5 w-5 text-white/70 transition-colors group-hover:text-white" />
          )}
        </button>

        {/* Stock badge */}
        <div className="absolute left-3 top-3 z-10">
          {product.availableForSale ? (
            <div className="flex items-center gap-1.5 rounded-full bg-brand-dark/70 px-2 py-1 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              <span className="text-xs text-green-400">In Stock</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-brand-dark/70 px-2 py-1 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="text-xs text-red-400">Sold Out</span>
            </div>
          )}
        </div>
      </div>

      {/* Product info */}
      <div className="mt-3">
        <Link href={`/product/${product.handle}`}>
          <h3 className="text-sm font-medium text-white transition-colors group-hover:text-brand-gold">
            {product.title}
          </h3>
        </Link>
        <Price
          className="mt-0.5 text-sm text-brand-grey"
          amount={product.priceRange.maxVariantPrice.amount}
          currencyCode={product.priceRange.maxVariantPrice.currencyCode}
        />
      </div>
    </div>
  );
}
