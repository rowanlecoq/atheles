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
    // Force cart modal open
    window.dispatchEvent(new Event("open-cart"));
    setAdding(false);
  };

  // Single variant — direct add
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

  // Multiple variants — size picker
  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      {/* Size picker overlay */}
      {showSizes && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSizes(false)} />
          <div className="absolute inset-x-3 bottom-3 z-50 rounded-lg border border-brand-dark-gold/30 bg-brand-dark/95 p-3 shadow-xl backdrop-blur-sm">
            <p className="mb-2 text-center text-xs uppercase tracking-wider text-brand-grey">
              select size
            </p>
            <div className="grid grid-cols-4 gap-1.5">
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
                      "rounded-md py-2 text-xs font-medium transition-all",
                      available
                        ? "bg-brand-dark-gold/15 text-white hover:bg-brand-gold hover:text-brand-dark"
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

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setShowSizes(!showSizes)}
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
    </div>
  );
}
