"use client";

import clsx from "clsx";
import { addItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import type { Product } from "lib/shopify/types";
import { useActionState, useState } from "react";

export function QuickAddButton({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const [, formAction, isPending] = useActionState(addItem, null);
  const [showSizes, setShowSizes] = useState(false);
  const [hovering, setHovering] = useState(false);

  if (!product.availableForSale) return null;

  const availableVariants = product.variants.filter((v) => v.availableForSale);
  if (availableVariants.length === 0) return null;

  const hasMultipleVariants = product.variants.length > 1;

  const handleAdd = (variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;

    const addItemAction = formAction.bind(null, variantId);
    addCartItem(variant, product);
    addItemAction();
    setShowSizes(false);
  };

  // Single variant — add directly
  if (!hasMultipleVariants) {
    const variant = availableVariants[0]!;
    const addItemAction = formAction.bind(null, variant.id);

    return (
      <form
        action={async () => {
          addCartItem(variant, product);
          addItemAction();
        }}
      >
        <button
          type="submit"
          aria-label={`Add ${product.title} to cart`}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          disabled={isPending}
          className="relative w-full overflow-hidden rounded-full bg-brand-gold p-2.5 font-heading text-xs uppercase tracking-wider text-brand-dark transition-all disabled:opacity-50"
          style={{
            background: hovering
              ? "linear-gradient(270deg, #c1a368, #e8d5a3, #a08540, #c1a368)"
              : "#c1a368",
            backgroundSize: hovering ? "300% 100%" : "100% 100%",
            animation: hovering ? "colorShift 3s ease infinite" : "none",
          }}
        >
          {isPending ? "adding..." : "quick add"}
          <style jsx>{`
            @keyframes colorShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
        </button>
      </form>
    );
  }

  // Multiple variants — show size picker
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Size picker */}
      {showSizes && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setShowSizes(false)} />
          <div className="relative z-30 mt-1 rounded-lg border border-brand-dark-gold/30 bg-brand-dark p-2">
            <div className="flex flex-wrap gap-1.5">
              {product.variants.map((variant) => {
                const size = variant.selectedOptions.find(
                  (o) => o.name.toLowerCase() === "size",
                )?.value || variant.title;
                const available = variant.availableForSale;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!available || isPending}
                    onClick={() => available && handleAdd(variant.id)}
                    className={clsx(
                      "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all",
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

      {/* Button */}
      {!showSizes && (
        <button
          type="button"
          onClick={() => setShowSizes(true)}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className="relative w-full overflow-hidden rounded-full bg-brand-gold p-2.5 font-heading text-xs uppercase tracking-wider text-brand-dark transition-all"
          style={{
            background: hovering
              ? "linear-gradient(270deg, #c1a368, #e8d5a3, #a08540, #c1a368)"
              : "#c1a368",
            backgroundSize: hovering ? "300% 100%" : "100% 100%",
            animation: hovering ? "colorShift 3s ease infinite" : "none",
          }}
        >
          quick add
          <style jsx>{`
            @keyframes colorShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
        </button>
      )}
    </div>
  );
}
