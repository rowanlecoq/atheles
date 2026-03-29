"use client";

import { addItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import type { Product } from "lib/shopify/types";
import { useActionState, useState } from "react";

export function QuickAddButton({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const [, formAction, isPending] = useActionState(addItem, null);
  const [showSizes, setShowSizes] = useState(false);

  if (!product.availableForSale) return null;

  const availableVariants = product.variants.filter((v) => v.availableForSale);
  if (availableVariants.length === 0) return null;

  // If only one variant (no size options), add directly
  const hasMultipleVariants = product.variants.length > 1;

  const handleAdd = (variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;

    const addItemAction = formAction.bind(null, variantId);
    addCartItem(variant, product);
    addItemAction();
    setShowSizes(false);
  };

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
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-brand-dark transition-all hover:scale-110 hover:bg-brand-light-gold disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M7.76 7.76L4.93 4.93" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </button>
      </form>
    );
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Size picker dropdown */}
      {showSizes && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setShowSizes(false)} />
          <div className="absolute bottom-12 right-0 z-30 min-w-[160px] rounded-lg border border-brand-dark-gold/30 bg-brand-dark/95 p-2 shadow-xl backdrop-blur-sm">
            <p className="mb-2 px-2 text-xs uppercase tracking-wider text-brand-grey">
              select size
            </p>
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
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-all ${
                      available
                        ? "bg-brand-dark-gold/15 text-white hover:bg-brand-gold hover:text-brand-dark"
                        : "cursor-not-allowed text-brand-grey/30 line-through"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setShowSizes(!showSizes)}
        aria-label={`Quick add ${product.title}`}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-brand-dark transition-all hover:scale-110 hover:bg-brand-light-gold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
