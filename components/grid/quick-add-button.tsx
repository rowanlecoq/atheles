"use client";

import clsx from "clsx";
import { useCart } from "components/cart/cart-context";
import type { Product } from "lib/shopify/types";
import { useState } from "react";

export function QuickAddButton({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const [showSizes, setShowSizes] = useState(false);
  const [adding, setAdding] = useState(false);

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

    // Add to cart via API without triggering server action loading state
    try {
      const { addItem } = await import("components/cart/actions");
      await addItem(null, variantId);
    } catch {
      // Cart context already updated optimistically
    }
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
        disabled={adding}
        className="rounded-full bg-brand-gold px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-brand-dark transition-all hover:bg-brand-light-gold disabled:opacity-50"
      >
        {adding ? "+" : "quick add"}
      </button>
    );
  }

  // Multiple variants — size picker
  return (
    <div className="relative" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      {showSizes && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSizes(false)} />
          <div className="absolute bottom-full right-0 z-50 mb-2 min-w-[140px] rounded-lg border border-brand-dark-gold/30 bg-brand-dark/95 p-2 shadow-xl backdrop-blur-sm">
            <div className="flex flex-wrap gap-1">
              {product.variants.map((variant) => {
                const size = variant.selectedOptions.find(
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
                      "flex-1 rounded px-2.5 py-1.5 text-xs font-medium transition-all",
                      available
                        ? "text-white hover:bg-brand-gold hover:text-brand-dark"
                        : "cursor-not-allowed text-brand-grey/30 line-through",
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setShowSizes(!showSizes)}
        disabled={adding}
        className="rounded-full bg-brand-gold px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-brand-dark transition-all hover:bg-brand-light-gold disabled:opacity-50"
      >
        {adding ? "+" : "quick add"}
      </button>
    </div>
  );
}
