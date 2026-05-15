"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { removeItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import type { CartItem } from "lib/shopify/types";

export function DeleteItemButton({
  item,
  optimisticUpdate,
}: {
  item: CartItem;
  optimisticUpdate: (merchandiseId: string, updateType: "delete") => void;
}) {
  const { setServerCart } = useCart();
  const merchandiseId = item.merchandise.id;

  return (
    <button
      type="button"
      aria-label="Remove cart item"
      onClick={() => {
        optimisticUpdate(merchandiseId, "delete");
        removeItem(null, { lineItemId: item.id, merchandiseId }).then((result) => {
          if (result && typeof result === "object" && "cart" in result) {
            setServerCart(result.cart);
          }
        }).catch(() => {});
      }}
      className="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-brand-medium-grey transition-colors hover:bg-brand-dark-gold"
    >
      <XMarkIcon className="mx-[1px] h-5 w-5 text-white" />
    </button>
  );
}
