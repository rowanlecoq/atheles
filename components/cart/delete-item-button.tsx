"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { removeItem } from "components/cart/actions";
import type { CartItem } from "lib/shopify/types";
import { useState } from "react";

export function DeleteItemButton({
  item,
  optimisticUpdate,
}: {
  item: CartItem;
  optimisticUpdate: (merchandiseId: string, updateType: "delete") => void;
}) {
  const [removing, setRemoving] = useState(false);
  const merchandiseId = item.merchandise.id;

  return (
    <button
      type="button"
      aria-label="Remove cart item"
      disabled={removing}
      onClick={async () => {
        setRemoving(true);
        optimisticUpdate(merchandiseId, "delete");
        try {
          await removeItem(null, merchandiseId);
        } catch {}
        setRemoving(false);
      }}
      className="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-brand-medium-grey transition-colors hover:bg-brand-dark-gold disabled:opacity-50"
    >
      <XMarkIcon className="mx-[1px] h-5 w-5 text-white" />
    </button>
  );
}
