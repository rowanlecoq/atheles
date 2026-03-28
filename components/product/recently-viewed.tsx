"use client";

import { GridTileImage } from "components/grid/tile";
import {
  useRecentlyViewed,
  type RecentlyViewedItem,
} from "lib/hooks/use-recently-viewed";
import Link from "next/link";
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
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {filtered.map((product) => (
          <li
            key={product.handle}
            className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <Link
              className="relative h-full w-full"
              href={`/product/${product.handle}`}
              prefetch={true}
            >
              <GridTileImage
                alt={product.title}
                label={{
                  title: product.title,
                  amount: product.price,
                  currencyCode: product.currencyCode,
                }}
                src={product.featuredImageUrl}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
