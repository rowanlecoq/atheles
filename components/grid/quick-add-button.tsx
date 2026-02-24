"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { addItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import type { Product } from "lib/shopify/types";
import { useActionState } from "react";

export function QuickAddButton({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const [, formAction, isPending] = useActionState(addItem, null);

  const firstAvailableVariant = product.variants.find(
    (v) => v.availableForSale,
  );

  if (!product.availableForSale || !firstAvailableVariant) {
    return null;
  }

  const addItemAction = formAction.bind(null, firstAvailableVariant.id);

  return (
    <form
      action={async () => {
        addCartItem(firstAvailableVariant, product);
        addItemAction();
      }}
    >
      <button
        type="submit"
        aria-label={`Add ${product.title} to cart`}
        onClick={(e) => e.stopPropagation()}
        className="tap-target flex min-h-[44px] items-center gap-1.5 rounded-full bg-brand-gold px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-dark transition-all hover:bg-brand-light-gold disabled:opacity-50 sm:text-xs sm:tracking-wider"
        disabled={isPending}
      >
        <PlusIcon className="h-4 w-4" />
        {isPending ? "Adding..." : "Quick Add"}
      </button>
    </form>
  );
}
