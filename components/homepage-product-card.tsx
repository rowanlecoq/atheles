"use client";

import { FavoriteCardButton } from "components/favorite-card-button";
import { useAnimateInView } from "lib/hooks/use-animate-in-view";
import Image from "next/image";
import Link from "next/link";
import Price from "components/price";
import type { Product } from "lib/shopify/types";
const CARD_ANIM_STR = "fi-up 0.28s cubic-bezier(0.22,1,0.36,1) 0s both";

export function HomepageProductCard({
  product,
  size = "half",
  priority = false,
}: {
  product: Product;
  size?: "full" | "half";
  priority?: boolean;
  index?: number;
}) {
  const ref = useAnimateInView<HTMLDivElement>(CARD_ANIM_STR);
  const secondImage = product.images?.[1]?.url;

  return (
    <div ref={ref} className="fi-anim group h-full">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-brand-dark md:aspect-auto md:h-full">
        <Link
          href={`/product/${product.handle}`}
          prefetch={true}
          className="relative block h-full"
        >
          {/* Primary image */}
          {product.featuredImage?.url && (
            <Image
              src={product.featuredImage.url}
              alt={product.title}
              fill
              sizes={size === "full" ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
              priority={priority}
              className={`h-full w-full object-cover transition-opacity duration-500 ${
                secondImage ? "group-hover:opacity-0" : ""
              }`}
            />
          )}
          {/* Second image on hover */}
          {secondImage && (
            <Image
              src={secondImage}
              alt={`${product.title} - alternate`}
              fill
              sizes={size === "full" ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
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

        {/* Product info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
          <h3 className="text-sm font-medium text-white">{product.title}</h3>
          <Price
            className="text-sm text-brand-grey"
            amount={product.priceRange.maxVariantPrice.amount}
            currencyCode={product.priceRange.maxVariantPrice.currencyCode}
          />
        </div>
      </div>
    </div>
  );
}
