"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { updateItemQuantity } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import type { CartItem } from "lib/shopify/types";

export const MAX_ITEM_QUANTITY = 20;

export function EditItemQuantityButton({
  item,
  type,
  optimisticUpdate,
}: {
  item: CartItem;
  type: "plus" | "minus";
  optimisticUpdate: (
    merchandiseId: string,
    updateType: "plus" | "minus",
  ) => void;
}) {
  const { mergeConfirm } = useCart();
  const atMax = type === "plus" && item.quantity >= MAX_ITEM_QUANTITY;

  return (
    <button
      type="button"
      aria-label={
        type === "plus" ? "Increase item quantity" : "Reduce item quantity"
      }
      disabled={atMax}
      onClick={() => {
        if (atMax) return;
        optimisticUpdate(item.merchandise.id, type);
        updateItemQuantity(null, {
          lineItemId: item.id,
          merchandiseId: item.merchandise.id,
          quantity: type === "plus" ? item.quantity + 1 : item.quantity - 1,
        }).then((result) => {
          if (result && typeof result === "object" && "cart" in result) {
            mergeConfirm(result.cart);
          }
        }).catch(() => {});
      }}
      className={clsx(
        "tap-target ease flex h-11 min-w-11 max-w-11 flex-none items-center justify-center rounded-full p-2 transition-all duration-200",
        { "ml-auto": type === "minus" },
        atMax ? "cursor-not-allowed opacity-25" : "hover:opacity-80",
      )}
    >
      {type === "plus" ? (
        <PlusIcon className="h-4 w-4 text-brand-grey" />
      ) : (
        <MinusIcon className="h-4 w-4 text-brand-grey" />
      )}
    </button>
  );
}
