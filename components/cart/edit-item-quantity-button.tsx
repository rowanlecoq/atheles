"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { updateItemQuantity } from "components/cart/actions";
import type { CartItem } from "lib/shopify/types";

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
  return (
    <button
      type="button"
      aria-label={
        type === "plus" ? "Increase item quantity" : "Reduce item quantity"
      }
      onClick={() => {
        optimisticUpdate(item.merchandise.id, type);
        updateItemQuantity(null, {
          merchandiseId: item.merchandise.id,
          quantity: type === "plus" ? item.quantity + 1 : item.quantity - 1,
        }).catch(() => {});
      }}
      className={clsx(
        "tap-target ease flex h-11 min-w-11 max-w-11 flex-none items-center justify-center rounded-full p-2 transition-all duration-200 hover:opacity-80",
        { "ml-auto": type === "minus" },
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
