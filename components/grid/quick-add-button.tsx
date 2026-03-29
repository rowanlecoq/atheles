"use client";

import clsx from "clsx";
import { useCart } from "components/cart/cart-context";
import type { Product } from "lib/shopify/types";
import { useState } from "react";

function GoldButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  const [hovering, setHovering] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      disabled={disabled}
      className="overflow-hidden rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-brand-dark transition-all disabled:opacity-50"
      style={{
        background: hovering
          ? "linear-gradient(270deg, #c1a368, #e8d5a3, #a08540, #c1a368)"
          : "#c1a368",
        backgroundSize: hovering ? "300% 100%" : "100% 100%",
        animation: hovering ? "qaShift 3s ease infinite" : "none",
      }}
    >
      {children}
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
      <GoldButton
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleAdd(variant.id);
        }}
        disabled={adding}
      >
        {adding ? "adding..." : "quick add"}
      </GoldButton>
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

      <GoldButton
        onClick={() => setShowSizes(!showSizes)}
        disabled={adding}
      >
        {adding ? "adding..." : "quick add"}
      </GoldButton>
    </div>
  );
}
