"use client";

import type {
  Cart,
  CartItem,
  Product,
  ProductVariant,
} from "lib/shopify/types";
import React, {
  createContext,
  use,
  useContext,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
} from "react";

export const MAX_ITEM_QUANTITY = 20;

type UpdateType = "plus" | "minus" | "delete";

type CartAction =
  | {
      type: "UPDATE_ITEM";
      payload: { merchandiseId: string; updateType: UpdateType };
    }
  | {
      type: "ADD_ITEM";
      payload: { variant: ProductVariant; product: Product };
    }
  | { type: "REMOVE_DISCOUNT" };

type CartContextType = {
  serverCart: Cart | undefined;
  setServerCart: React.Dispatch<React.SetStateAction<Cart | undefined>>;
  qtyPatch: Map<string, number>;
  setQtyPatch: React.Dispatch<React.SetStateAction<Map<string, number>>>;
  patchHydrated: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateItemCost(quantity: number, price: string): string {
  return (Number(price) * quantity).toFixed(2);
}

function updateCartItemHelper(
  item: CartItem,
  updateType: UpdateType,
): CartItem | null {
  if (updateType === "delete") return null;

  const newQuantity = Math.min(
    updateType === "plus" ? item.quantity + 1 : item.quantity - 1,
    MAX_ITEM_QUANTITY,
  );
  if (newQuantity === 0) return null;

  const singleItemAmount = Number(item.cost.totalAmount.amount) / item.quantity;
  const newTotalAmount = calculateItemCost(
    newQuantity,
    singleItemAmount.toString(),
  );

  return {
    ...item,
    quantity: newQuantity,
    cost: {
      ...item.cost,
      totalAmount: { ...item.cost.totalAmount, amount: newTotalAmount },
    },
  };
}

function createOrUpdateCartItem(
  existingItem: CartItem | undefined,
  variant: ProductVariant,
  product: Product,
): CartItem {
  const quantity = existingItem ? existingItem.quantity + 1 : 1;
  const totalAmount = calculateItemCost(quantity, variant.price.amount);

  return {
    id: existingItem?.id,
    quantity,
    cost: {
      totalAmount: {
        amount: totalAmount,
        currencyCode: variant.price.currencyCode,
      },
    },
    merchandise: {
      id: variant.id,
      title: variant.title,
      selectedOptions: variant.selectedOptions,
      product: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        featuredImage: product.featuredImage,
      },
    },
  };
}

function updateCartTotals(
  lines: CartItem[],
): Pick<Cart, "totalQuantity" | "cost"> {
  const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = lines.reduce(
    (sum, item) => sum + Number(item.cost.totalAmount.amount),
    0,
  );
  const currencyCode = lines[0]?.cost.totalAmount.currencyCode ?? "USD";

  return {
    totalQuantity,
    cost: {
      subtotalAmount: { amount: totalAmount.toFixed(2), currencyCode },
      totalAmount: { amount: totalAmount.toFixed(2), currencyCode },
      totalTaxAmount: { amount: "0", currencyCode },
    },
  };
}

function createEmptyCart(): Cart {
  return {
    id: undefined,
    checkoutUrl: "",
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: { amount: "0", currencyCode: "USD" },
      totalAmount: { amount: "0", currencyCode: "USD" },
      totalTaxAmount: { amount: "0", currencyCode: "USD" },
    },
    discountCodes: [],
    discountAllocations: [],
  };
}

function cartReducer(state: Cart | undefined, action: CartAction): Cart {
  const currentCart = state || createEmptyCart();

  switch (action.type) {
    case "UPDATE_ITEM": {
      const { merchandiseId, updateType } = action.payload;
      const updatedLines = currentCart.lines
        .map((item) =>
          item.merchandise.id === merchandiseId
            ? updateCartItemHelper(item, updateType)
            : item,
        )
        .filter(Boolean) as CartItem[];

      if (updatedLines.length === 0) {
        return {
          ...currentCart,
          lines: [],
          totalQuantity: 0,
          cost: {
            ...currentCart.cost,
            totalAmount: { ...currentCart.cost.totalAmount, amount: "0" },
          },
        };
      }

      return { ...currentCart, ...updateCartTotals(updatedLines), lines: updatedLines };
    }
    case "ADD_ITEM": {
      const { variant, product } = action.payload;
      const existingItem = currentCart.lines.find(
        (item) => item.merchandise.id === variant.id,
      );
      const updatedItem = createOrUpdateCartItem(existingItem, variant, product);
      const updatedLines = existingItem
        ? currentCart.lines.map((item) =>
            item.merchandise.id === variant.id ? updatedItem : item,
          )
        : [...currentCart.lines, updatedItem];

      return { ...currentCart, ...updateCartTotals(updatedLines), lines: updatedLines };
    }
    case "REMOVE_DISCOUNT": {
      return {
        ...currentCart,
        discountCodes: [],
        discountAllocations: [],
        cost: {
          ...currentCart.cost,
          // Restore total to subtotal (no discount applied)
          totalAmount: currentCart.cost.subtotalAmount,
        },
      };
    }
    default:
      return currentCart;
  }
}

export function CartProvider({
  children,
  cartPromise,
}: {
  children: React.ReactNode;
  cartPromise: Promise<Cart | undefined>;
}) {
  // Keep a ref to the INITIAL promise so use() is only ever called on it.
  // The initial promise is pre-resolved by Next.js RSC (no suspension in practice).
  // All subsequent cart re-fetches (triggered by server actions calling updateTag)
  // are handled via useEffect → setState so consumers NEVER suspend after mount.
  const initialPromiseRef = useRef(cartPromise);
  const initialCart = use(initialPromiseRef.current);

  const [serverCart, setServerCart] = useState<Cart | undefined>(initialCart);
  const [qtyPatch, setQtyPatch] = useState<Map<string, number>>(new Map());
  const [patchHydrated, setPatchHydrated] = useState(false);

  // Subscribe to future cartPromise changes without causing any suspension.
  useEffect(() => {
    if (cartPromise === initialPromiseRef.current) return;
    let cancelled = false;
    cartPromise.then((data) => {
      if (!cancelled) setServerCart(data ?? undefined);
    });
    return () => { cancelled = true; };
  }, [cartPromise]);

  // Load persisted quantities from sessionStorage after mount.
  // sessionStorage (not localStorage) is used intentionally: it survives
  // soft Next.js navigation within a tab but is cleared on hard reload /
  // new tab, preventing stale patches from previous sessions overriding
  // the server cart and causing quantity/price glitches.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("atheles-qty-patch");
      if (stored) {
        const obj = JSON.parse(stored) as Record<string, number>;
        setQtyPatch(new Map(Object.entries(obj).map(([k, v]) => [k, Number(v)])));
      }
    } catch {}
    setPatchHydrated(true);
  }, []);

  // Persist patch to sessionStorage whenever it changes (after hydration).
  useEffect(() => {
    if (!patchHydrated) return;
    if (qtyPatch.size === 0) {
      sessionStorage.removeItem("atheles-qty-patch");
    } else {
      sessionStorage.setItem(
        "atheles-qty-patch",
        JSON.stringify(Object.fromEntries(qtyPatch)),
      );
    }
  }, [qtyPatch, patchHydrated]);

  return (
    <CartContext.Provider value={{ serverCart, setServerCart, qtyPatch, setQtyPatch, patchHydrated }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  const { serverCart, setServerCart, qtyPatch, setQtyPatch, patchHydrated } = context;

  // serverCart is plain state — no use(), no suspension possible.
  const [optimisticCart, updateOptimisticCart] = useOptimistic(
    serverCart,
    cartReducer,
  );

  // When serverCart is refreshed from Shopify, clear patch entries it has confirmed.
  useEffect(() => {
    if (!serverCart) return;
    setQtyPatch((prev) => {
      if (prev.size === 0) return prev;
      const next = new Map(prev);
      let changed = false;
      for (const [id, qty] of next) {
        const serverItem = serverCart.lines.find((l) => l.merchandise.id === id);
        if (serverItem && serverItem.quantity === qty) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [serverCart, setQtyPatch]);

  // Merge qtyPatch on top of optimisticCart.
  // Discount allocations are scaled proportionally using serverCart as the baseline —
  // NOT optimisticCart, which already has the new quantities baked in (scale ≈ 1).
  const cart = useMemo(() => {
    if (!optimisticCart || qtyPatch.size === 0) return optimisticCart;

    const updatedLines = optimisticCart.lines
      .map((item) => {
        const overrideQty = qtyPatch.get(item.merchandise.id);
        if (overrideQty === undefined) return item;
        if (overrideQty <= 0) return null;
        const singlePrice = Number(item.cost.totalAmount.amount) / item.quantity;
        return {
          ...item,
          quantity: overrideQty,
          cost: {
            ...item.cost,
            totalAmount: {
              ...item.cost.totalAmount,
              amount: (singlePrice * overrideQty).toFixed(2),
            },
          },
        };
      })
      .filter(Boolean) as CartItem[];

    const patchedSubtotal = updatedLines.reduce(
      (sum, item) => sum + Number(item.cost.totalAmount.amount),
      0,
    );

    // Base the discount scale on the server-confirmed subtotal, not the
    // already-updated optimistic subtotal (which would give scale = 1).
    const baseSubtotal = Number(serverCart?.cost.subtotalAmount.amount ?? "0");
    const discountScale = baseSubtotal > 0 ? patchedSubtotal / baseSubtotal : 1;

    const scaledAllocations = (optimisticCart.discountAllocations ?? []).map(
      (a) => ({
        ...a,
        discountedAmount: {
          ...a.discountedAmount,
          amount: (parseFloat(a.discountedAmount.amount) * discountScale).toFixed(2),
        },
      }),
    );

    const totalDiscount = scaledAllocations.reduce(
      (sum, a) => sum + parseFloat(a.discountedAmount.amount),
      0,
    );
    const currencyCode =
      updatedLines[0]?.cost.totalAmount.currencyCode ?? "USD";
    const patchedTotal = Math.max(0, patchedSubtotal - totalDiscount);

    return {
      ...optimisticCart,
      lines: updatedLines,
      totalQuantity: updatedLines.reduce((sum, item) => sum + item.quantity, 0),
      discountAllocations: scaledAllocations,
      cost: {
        ...optimisticCart.cost,
        subtotalAmount: { amount: patchedSubtotal.toFixed(2), currencyCode },
        totalAmount: { amount: patchedTotal.toFixed(2), currencyCode },
      },
    };
  }, [optimisticCart, qtyPatch, serverCart]);

  const updateCartItem = (merchandiseId: string, updateType: UpdateType) => {
    updateOptimisticCart({
      type: "UPDATE_ITEM",
      payload: { merchandiseId, updateType },
    });
    setQtyPatch((prev) => {
      const currentItem = optimisticCart?.lines.find(
        (l) => l.merchandise.id === merchandiseId,
      );
      const baseQty = prev.get(merchandiseId) ?? currentItem?.quantity ?? 1;
      const newQty = Math.min(
        updateType === "plus"
          ? baseQty + 1
          : updateType === "minus"
            ? baseQty - 1
            : 0,
        MAX_ITEM_QUANTITY,
      );
      const next = new Map(prev);
      if (newQty <= 0) next.delete(merchandiseId);
      else next.set(merchandiseId, newQty);
      return next;
    });
  };

  const addCartItem = (variant: ProductVariant, product: Product) => {
    updateOptimisticCart({ type: "ADD_ITEM", payload: { variant, product } });
    // Clear any stale patch for this variant so an old persisted quantity
    // doesn't override the freshly-added quantity (qty 1 from a clean add).
    setQtyPatch((prev) => {
      if (!prev.has(variant.id)) return prev;
      const next = new Map(prev);
      next.delete(variant.id);
      return next;
    });
  };

  // Optimistically zeroes out discount so the total updates instantly on remove.
  // The server action (removeDiscountCode) catches up in the background.
  const clearDiscount = () => {
    updateOptimisticCart({ type: "REMOVE_DISCOUNT" });
  };

  return useMemo(
    () => ({ cart, updateCartItem, addCartItem, clearDiscount, setServerCart, patchHydrated }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, patchHydrated, setServerCart],
  );
}
