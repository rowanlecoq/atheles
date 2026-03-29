"use client";

import clsx from "clsx";
import { useCart } from "components/cart/cart-context";
import type { Product } from "lib/shopify/types";
import { useState } from "react";

export function QuickAddButton({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const [showSizes, setShowSizes] = useState(false);
  const [adding, setAdding] = useState(false);
  const [hovering, setHovering] = useState(false);

  if (!product.availableForSale) return null;

  const availableVariants = product.variants.filter((v) => v.availableForSale);
  if (availableVariants.length === 0) return null;

  const hasMultipleVariants = product.variants.length > 1;

  const handleAdd = async (variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;

    setAdding(true);
    addCartItem(variant, product);
    setShowSizes(false);

    try {
      const { addItem } = await import("components/cart/actions");
      await addItem(null, variantId);
    } catch {
      // Already updated optimistically
    }
    window.dispatchEvent(new Event("open-cart"));
    setAdding(false);
  };

  // Single variant
  if (!hasMultipleVariants) {
    const variant = availableVariants[0]!;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleAdd(variant.id);
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        disabled={adding}
        className="overflow-hidden rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-brand-dark transition-all disabled:opacity-50"
        style={{
          background: hovering
            ? "linear-gradient(270deg, #c1a368, #e8d5a3, #a08540, #c1a368)"
            : "#c1a368",
          backgroundSize: hovering ? "300% 100%" : "100% 100%",
          animation: hovering ? "qaShift 3s ease infinite" : "none",
        }}
      >
        {adding ? "adding..." : "quick add"}
        <style jsx>{`
          @keyframes qaShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </button>
    );
  }

  // Multiple variants
  if (showSizes) {
    return (
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg bg-brand-dark/95 p-4 backdrop-blur-sm"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <button
          type="button"
          onClick={() => setShowSizes(false)}
          className="absolute right-3 top-3 text-brand-grey transition-colors hover:text-white"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p className="mb-3 text-xs uppercase tracking-wider text-brand-grey">
          select size
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {product.variants.map((variant) => {
            const size =
              variant.selectedOptions.find(
                (o) => o.name.toLowerCase() === "size",
              )?.value || variant.title;
            const available = variant.availableForSale;

            return (
              <button
                key={variant.id}
                type="button"
                disabled={!available || adding}
                onClick={() => available && handleAdd(variant.id)}
                className={clsx(
                  "min-w-[48px] rounded-md px-4 py-2.5 text-sm font-medium transition-all",
                  available
                    ? "border border-brand-dark-gold/30 text-white hover:bg-brand-gold hover:text-brand-dark"
                    : "cursor-not-allowed border border-brand-dark-gold/10 text-brand-grey/30 line-through",
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowSizes(true);
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      disabled={adding}
      className="overflow-hidden rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-brand-dark transition-all disabled:opacity-50"
      style={{
        background: hovering
          ? "linear-gradient(270deg, #c1a368, #e8d5a3, #a08540, #c1a368)"
          : "#c1a368",
        backgroundSize: hovering ? "300% 100%" : "100% 100%",
        animation: hovering ? "qaShift 3s ease infinite" : "none",
      }}
    >
      {adding ? "adding..." : "quick add"}
      <style jsx>{`
        @keyframes qaShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </button>
  );
}
