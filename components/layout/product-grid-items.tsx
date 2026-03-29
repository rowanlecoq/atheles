"use client";

import { GridTileImage } from "components/grid/tile";

import {
  animationDurations,
  animationDurationsMobile,
  animationEasing,
  animationStaggers,
  animationStaggersMobile,
  animationViewportMargins,
  animationViewportMarginsMobile,
} from "lib/animation-config";
import { useMobileViewport } from "lib/hooks/use-mobile-viewport";
import { useReducedMotion } from "lib/hooks/use-reduced-motion";
import type { Product } from "lib/shopify/types";
import Link from "next/link";
import { motion } from "motion/react";

export default function ProductGridItems({
  products,
}: {
  products: Product[];
}) {
  const isMobileViewport = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();
  const hiddenY = prefersReducedMotion ? 0 : isMobileViewport ? 14 : 22;
  const hiddenScale = prefersReducedMotion
    ? 1
    : isMobileViewport
      ? 0.985
      : 0.97;
  const hiddenBlur = prefersReducedMotion
    ? "blur(0px)"
    : isMobileViewport
      ? "blur(3px)"
      : "blur(6px)";
  const transitionDuration = prefersReducedMotion
    ? animationDurations.fast
    : isMobileViewport
      ? animationDurationsMobile.normal
      : animationDurations.normal;
  const staggerDelay = prefersReducedMotion
    ? 0.01
    : isMobileViewport
      ? animationStaggersMobile.tight
      : animationStaggers.tight;
  const viewportMargin = isMobileViewport
    ? animationViewportMarginsMobile.early
    : animationViewportMargins.early;

  return (
    <>
      {products.map((product, index) => (
        <motion.li
          key={product.handle}
          initial={{
            opacity: 0,
            y: hiddenY,
            scale: hiddenScale,
            filter: hiddenBlur,
          }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: viewportMargin }}
          transition={{
            duration: transitionDuration,
            delay: index * staggerDelay,
            ease: animationEasing,
          }}
          className="aspect-square transition-opacity group"
        >
          <div className="relative h-full w-full">
            <Link
              className="relative inline-block h-full w-full"
              href={`/product/${product.handle}`}
              prefetch={true}
            >
              <GridTileImage
                alt={product.title}
                label={{
                  title: product.title,
                  amount: product.priceRange.maxVariantPrice.amount,
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode,
                }}
                src={product.featuredImage?.url}
                fill
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              {/* Stock indicator */}
              <div className="absolute left-3 top-3 z-10">
                {product.availableForSale ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-brand-dark/80 px-2.5 py-1 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    <span className="text-xs uppercase tracking-wider text-green-400">In Stock</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-full bg-brand-dark/80 px-2.5 py-1 backdrop-blur-sm">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-xs uppercase tracking-wider text-red-400">Sold Out</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </motion.li>
      ))}
    </>
  );
}
