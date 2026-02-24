"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { removeItem } from "components/cart/actions";
import type { CartItem } from "lib/shopify/types";
import { useActionState } from "react";

export function DeleteItemButton({
  item,
  optimisticUpdate,
}: {
  item: CartItem;
  optimisticUpdate: (merchandiseId: string, updateType: "delete") => void;
}) {
  const [message, formAction] = useActionState(removeItem, null);
  const merchandiseId = item.merchandise.id;
  const removeItemAction = formAction.bind(null, merchandiseId);

  return (
    <form
      action={async () => {
        optimisticUpdate(merchandiseId, "delete");
        removeItemAction();
      }}
    >
      <button
        type="submit"
        aria-label="Remove cart item"
        className="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-brand-medium-grey transition-colors hover:bg-brand-dark-gold"
      >
        <XMarkIcon className="mx-[1px] h-5 w-5 text-white" />
      </button>
      <output aria-live="polite" className="sr-only">
        {message}
      </output>
    </form>
  );
}
