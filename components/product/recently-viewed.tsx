"use client";

import { FavoriteCardButton } from "components/favorite-card-button";
import {
  useRecentlyViewed,
  type RecentlyViewedItem,
} from "lib/hooks/use-recently-viewed";
import Image from "next/image";
import Link from "next/link";
import Price from "components/price";
import { useEffect } from "react";

export function RecentlyViewedTracker({
  product,
}: {
  product: RecentlyViewedItem;
}) {
  const { addItem } = useRecentlyViewed();

  useEffect(() => {
    addItem(product);
  }, [product, addItem]);

  return null;
}

export function RecentlyViewedProducts({
  currentHandle,
}: {
  currentHandle: string;
}) {
  const { items } = useRecentlyViewed();
  const filtered = items.filter((i) => i.handle !== currentHandle);

  if (filtered.length === 0) return null;

  return (
    <div className="py-8">
      <h2 className="mb-4 font-heading text-2xl font-bold text-brand-gold">
        Recently Viewed
      </h2>
      <ul className="flex w-full gap-4 overflow-x-auto scrollbar-hide pt-1 pb-2">
        {filtered.map((product) => (
          <li
            key={product.handle}
            className="w-[72%] min-w-[200px] flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <div className="group h-full">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-brand-dark">
                <Link href={`/product/${product.handle}`} prefetch={true} className="relative block h-full">
                  {product.featuredImageUrl && (
                    <Image
                      src={product.featuredImageUrl}
                      alt={product.title}
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 72vw"
                      className={`h-full w-full object-cover transition-opacity duration-500 ${product.secondImageUrl ? "group-hover:opacity-0" : ""}`}
                    />
                  )}
                  {product.secondImageUrl && (
                    <Image
                      src={product.secondImageUrl}
                      alt={`${product.title} - alternate`}
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 72vw"
                      loading="lazy"
                      className="h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                    <h3 className="text-sm font-medium text-white">{product.title}</h3>
                    <Price className="text-sm text-brand-grey" amount={product.price} currencyCode={product.currencyCode} />
                  </div>
                </Link>
                <FavoriteCardButton handle={product.handle} />
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
