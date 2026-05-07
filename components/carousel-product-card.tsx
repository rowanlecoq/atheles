"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "lib/hooks/use-favorites";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import Price from "components/price";
import type { Product } from "lib/shopify/types";

export function CarouselProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(product.handle);
  const secondImage = product.images?.[1]?.url;
  const prefersReducedMotion = useReducedMotion();
  const blurInitial = prefersReducedMotion ? undefined : "blur(8px)";
  const blurFinal = prefersReducedMotion ? undefined : "blur(0.001px)";

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 16, ...(blurInitial ? { filter: blurInitial } : {}) }}
      whileInView={{ opacity: 1, y: 0, ...(blurFinal ? { filter: blurFinal } : {}) }}
      viewport={{ once: true, margin: "0px" }}
      transition={{ duration: 0.28, delay: Math.min(index, 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-brand-dark">
        <Link href={`/product/${product.handle}`} prefetch={true}>
          {product.featuredImage?.url && (
            <Image
              src={product.featuredImage.url}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 72vw"
              className={`h-full w-full object-cover transition-opacity duration-200 ${
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
              className="h-full w-full object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100"
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
    </motion.div>
  );
}
