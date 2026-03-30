"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useCart } from "components/cart/cart-context";
import {
  animationDurations,
  animationDurationsMobile,
  animationEasing,
  animationStaggers,
  animationStaggersMobile,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useFavorites } from "lib/hooks/use-favorites";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import type { Product } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import Price from "components/price";

function ProductCard({ product }: { product: Product }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addCartItem } = useCart();
  const [showSizes, setShowSizes] = useState(false);
  const [adding, setAdding] = useState(false);
  const liked = isFavorite(product.handle);
  const hasMultipleImages = product.images.length > 1;
  const secondImage = product.images[1]?.url;
  const hasMultipleVariants = product.variants.length > 1;

  const handleAdd = async (variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;
    setAdding(true);
    addCartItem(variant, product);
    try {
      const { addItem } = await import("components/cart/actions");
      await addItem(null, variantId);
    } catch {}
    window.dispatchEvent(new Event("open-cart"));
    setAdding(false);
    setShowSizes(false);
  };

  return (
    <div className="group">
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-brand-dark">
        <Link href={`/product/${product.handle}`} prefetch={true}>
          {/* Primary image */}
          {product.featuredImage?.url && (
            <Image
              src={product.featuredImage.url}
              alt={product.title}
              fill
              sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              className={`h-full w-full object-cover transition-opacity duration-500 ${
                hasMultipleImages ? "group-hover:opacity-0" : ""
              }`}
            />
          )}
          {/* Second image on hover */}
          {hasMultipleImages && secondImage && (
            <Image
              src={secondImage}
              alt={`${product.title} - alternate view`}
              fill
              sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Favorite button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.handle);
          }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark/60 backdrop-blur-sm transition-all hover:bg-brand-dark/80"
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
        >
          {liked ? (
            <HeartIconSolid className="h-4 w-4 text-brand-gold" />
          ) : (
            <HeartIcon className="h-4 w-4 text-white/70 transition-colors group-hover:text-white" />
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

        {/* Size picker overlay on hover (desktop) */}
        {hasMultipleVariants && product.availableForSale && showSizes && (
          <div
            className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-brand-dark via-brand-dark/95 to-transparent p-4 pt-10"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <div className="grid grid-cols-4 gap-1.5">
              {product.variants.map((variant) => {
                const size = variant.selectedOptions.find(
                  (o) => o.name.toLowerCase() === "size",
                )?.value || variant.title;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!variant.availableForSale || adding}
                    onClick={() => variant.availableForSale && handleAdd(variant.id)}
                    className={`rounded py-2 text-xs font-medium transition-all ${
                      variant.availableForSale
                        ? "bg-white/10 text-white hover:bg-brand-gold hover:text-brand-dark"
                        : "cursor-not-allowed text-white/20 line-through"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Product info below */}
      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/product/${product.handle}`} className="flex-1">
            <h3 className="text-sm font-medium text-white transition-colors group-hover:text-brand-gold">
              {product.title}
            </h3>
          </Link>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <Price
            className="text-sm text-brand-grey"
            amount={product.priceRange.maxVariantPrice.amount}
            currencyCode={product.priceRange.maxVariantPrice.currencyCode}
          />
          {hasMultipleVariants && product.availableForSale && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSizes(!showSizes);
              }}
              className="text-xs text-brand-grey underline underline-offset-4 transition-colors hover:text-brand-gold"
            >
              {showSizes ? "close" : "quick add"}
            </button>
          )}
          {!hasMultipleVariants && product.availableForSale && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const variant = product.variants.find((v) => v.availableForSale);
                if (variant) handleAdd(variant.id);
              }}
              disabled={adding}
              className="text-xs text-brand-grey underline underline-offset-4 transition-colors hover:text-brand-gold disabled:opacity-50"
            >
              {adding ? "adding..." : "quick add"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductGridItems({
  products,
}: {
  products: Product[];
}) {
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const hiddenY = prefersReducedMotion ? 0 : isMobileViewport ? 14 : 22;
  const hiddenScale = prefersReducedMotion ? 1 : isMobileViewport ? 0.985 : 0.97;
  const hiddenBlur = prefersReducedMotion ? "blur(0px)" : isMobileViewport ? "blur(3px)" : "blur(6px)";
  const transitionDuration = prefersReducedMotion ? animationDurations.fast : isMobileViewport ? animationDurationsMobile.normal : animationDurations.normal;
  const staggerDelay = prefersReducedMotion ? 0.01 : isMobileViewport ? animationStaggersMobile.tight : animationStaggers.tight;
  const viewportMargin = isMobileViewport ? animationViewportMarginsMobile.early : animationViewportMargins.early;

  return (
    <>
      {products.map((product, index) => (
        <motion.li
          key={product.handle}
          initial={{ opacity: 0, y: hiddenY, scale: hiddenScale, filter: hiddenBlur }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: viewportMargin }}
          transition={{ duration: transitionDuration, delay: index * staggerDelay, ease: animationEasing }}
          className="transition-opacity"
        >
          <ProductCard product={product} />
        </motion.li>
      ))}
    </>
  );
}
