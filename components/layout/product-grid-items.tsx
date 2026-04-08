"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useCart } from "components/cart/cart-context";
import { useFavorites } from "lib/hooks/use-favorites";
import type { Product } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { addItem } from "components/cart/actions";
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
    addItem(null, variantId).catch(() => {});
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
            const wasLiked = liked;
            toggleFavorite(product.handle);
            // Pop animation
            const btn = e.currentTarget;
            btn.style.transform = "scale(1.3)";
            setTimeout(() => { btn.style.transform = ""; }, 200);
            // Show toast
            const toast = btn.querySelector("[data-fav-toast]") as HTMLElement;
            if (toast) {
              toast.textContent = wasLiked ? "removed!" : "added!";
              toast.style.opacity = "1";
              toast.style.transform = "translateY(0)";
              setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateY(4px)"; }, 1000);
            }
          }}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark/60 backdrop-blur-sm transition-all duration-200 hover:bg-brand-dark/80 active:scale-90"
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
        >
          {liked ? (
            <HeartIconSolid className="h-5 w-5 text-brand-gold" />
          ) : (
            <HeartIcon className="h-5 w-5 text-white/70 transition-colors group-hover:text-white" />
          )}
          <span data-fav-toast className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-brand-dark/90 px-2 py-0.5 text-[10px] text-brand-gold opacity-0 transition-all duration-300" style={{ transform: "translateY(4px)" }} />
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
                // Abbreviate size names for compact display
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
                    disabled={!variant.availableForSale || adding}
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
              disabled={adding}
              className="text-sm text-brand-grey underline underline-offset-4 transition-colors hover:text-brand-gold sm:text-xs disabled:opacity-50"
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
  return (
    <>
      {products.map((product, index) => (
        <motion.li
          key={product.handle}
          initial={{ opacity: 0, y: 44 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{
            duration: 0.55,
            // Base delay of 0.08s lets the page settle first.
            // Stagger capped at 8 items so off-screen cards don't wait forever.
            delay: Math.min(index, 8) * 0.055 + 0.08,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <ProductCard product={product} />
        </motion.li>
      ))}
    </>
  );
}
