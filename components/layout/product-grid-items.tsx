"use client";

import { useCart } from "components/cart/cart-context";
import { FavoriteCardButton } from "components/favorite-card-button";
import type { Product } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { addItem } from "components/cart/actions";
import Price from "components/price";

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addCartItem, mergeConfirmAdd } = useCart();
  const [showSizes, setShowSizes] = useState(false);
  const [added, setAdded] = useState(false);
  const addedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (addedTimerRef.current) clearTimeout(addedTimerRef.current); };
  }, []);
  const hasMultipleImages = product.images.length > 1;
  const secondImage = product.images[1]?.url;
  const hasMultipleVariants = product.variants.length > 1;

  const handleAdd = (variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant || added) return;
    addCartItem(variant, product);
    window.dispatchEvent(new Event("open-cart"));
    addItem(null, variantId).then((result) => {
      if (result && typeof result === "object" && "cart" in result) {
        mergeConfirmAdd(result.cart);
      }
    }).catch(() => {});
    setShowSizes(false);
    setAdded(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setAdded(false), 700);
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
              priority={index < 4}
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
              loading="lazy"
              className="h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        <FavoriteCardButton handle={product.handle} />

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

        {/* Size picker overlay */}
        {hasMultipleVariants && product.availableForSale && showSizes && (
          <div
            className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-brand-dark via-brand-dark/95 to-transparent p-4 pt-10"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <div className="grid auto-cols-fr grid-flow-col gap-1.5">
              {product.variants.map((variant) => {
                const rawSize = variant.selectedOptions.find(
                  (o) => o.name.toLowerCase() === "size",
                )?.value || variant.title;
                const abbrev: Record<string, string> = {
                  "extra small": "XS", "xs": "XS",
                  "small": "S", "s": "S",
                  "medium": "M", "m": "M",
                  "large": "L", "l": "L",
                  "extra large": "XL", "xl": "XL",
                  "xx-large": "XXL", "xxl": "XXL",
                  "2xl": "2XL", "3xl": "3XL",
                };
                const size = abbrev[rawSize.toLowerCase().trim()] || rawSize;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!variant.availableForSale || added}
                    onClick={() => variant.availableForSale && handleAdd(variant.id)}
                    className={`min-h-[40px] rounded-md py-2.5 text-xs font-medium transition-all ${
                      variant.availableForSale
                        ? "bg-white/10 text-white hover:bg-brand-gold hover:text-brand-dark active:bg-brand-gold active:text-brand-dark"
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
            <h3 className="text-base font-medium text-white transition-colors group-hover:text-brand-gold sm:text-sm">
              {product.title}
            </h3>
          </Link>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <Price
            className="text-base text-brand-grey sm:text-sm"
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
              className="text-sm text-brand-grey underline underline-offset-4 transition-colors hover:text-brand-gold sm:text-xs"
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
              disabled={added}
              className="text-sm text-brand-grey underline underline-offset-4 transition-colors hover:text-brand-gold sm:text-xs disabled:opacity-50"
            >
              {added ? "added!" : "quick add"}
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
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      {products.map((product, index) => (
        <motion.li
          key={product.handle}
          // First 4 cards are above the fold — skip opacity:0 initial state so
          // SSR'd HTML is immediately visible and LCP fires without waiting for hydration
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <ProductCard product={product} index={index} />
        </motion.li>
      ))}
    </>
  );
}
