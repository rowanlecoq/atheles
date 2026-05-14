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
  useState,
} from "react";

type UpdateType = "plus" | "minus" | "delete";

type CartAction =
  | {
      type: "UPDATE_ITEM";
      payload: { merchandiseId: string; updateType: UpdateType };
    }
  | {
      type: "ADD_ITEM";
      payload: { variant: ProductVariant; product: Product };
    };

type CartContextType = {
  cartPromise: Promise<Cart | undefined>;
  // Persistent quantity overrides — survive server cart re-fetches (discount apply, navigation, etc.)
  qtyPatch: Map<string, number>;
  setQtyPatch: React.Dispatch<React.SetStateAction<Map<string, number>>>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateItemCost(quantity: number, price: string): string {
  return (Number(price) * quantity).toString();
}

function updateCartItemHelper(
  item: CartItem,
  updateType: UpdateType,
): CartItem | null {
  if (updateType === "delete") return null;

  const newQuantity =
    updateType === "plus" ? item.quantity + 1 : item.quantity - 1;
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
      totalAmount: {
        ...item.cost.totalAmount,
        amount: newTotalAmount,
      },
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
      subtotalAmount: { amount: totalAmount.toString(), currencyCode },
      totalAmount: { amount: totalAmount.toString(), currencyCode },
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

      return {
        ...currentCart,
        ...updateCartTotals(updatedLines),
        lines: updatedLines,
      };
    }
    case "ADD_ITEM": {
      const { variant, product } = action.payload;
      const existingItem = currentCart.lines.find(
        (item) => item.merchandise.id === variant.id,
      );
      const updatedItem = createOrUpdateCartItem(
        existingItem,
        variant,
        product,
      );

      const updatedLines = existingItem
        ? currentCart.lines.map((item) =>
            item.merchandise.id === variant.id ? updatedItem : item,
          )
        : [...currentCart.lines, updatedItem];

      return {
        ...currentCart,
        ...updateCartTotals(updatedLines),
        lines: updatedLines,
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
  // qtyPatch lives in CartProvider (persistent across navigations and cart re-fetches).
  // When a server action invalidates the cart cache, useOptimistic resets to the fresh
  // server state. qtyPatch keeps our local quantity overrides alive so they aren't lost.
  const [qtyPatch, setQtyPatch] = useState<Map<string, number>>(new Map());

  return (
    <CartContext.Provider value={{ cartPromise, qtyPatch, setQtyPatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  const { cartPromise, qtyPatch, setQtyPatch } = context;
  const initialCart = use(cartPromise);
  const [optimisticCart, updateOptimisticCart] = useOptimistic(
    initialCart,
    cartReducer,
  );

  // When server cart is refreshed, clear patch entries that the server has confirmed.
  // This keeps patch entries alive until Shopify catches up, then auto-cleans them.
  useEffect(() => {
    if (!initialCart) return;
    setQtyPatch((prev) => {
      if (prev.size === 0) return prev;
      const next = new Map(prev);
      let changed = false;
      for (const [id, qty] of next) {
        const serverItem = initialCart.lines.find(
          (l) => l.merchandise.id === id,
        );
        // Server confirmed this quantity (or item was deleted) — remove the patch
        if (!serverItem || serverItem.quantity === qty) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [initialCart, setQtyPatch]);

  // Merge qtyPatch on top of the optimistic cart so quantity overrides survive
  // any cart re-fetch triggered by discount codes or navigation.
  const cart = useMemo(() => {
    if (!optimisticCart || qtyPatch.size === 0) return optimisticCart;
    const updatedLines = optimisticCart.lines
      .map((item) => {
        const overrideQty = qtyPatch.get(item.merchandise.id);
        if (overrideQty === undefined) return item;
        if (overrideQty <= 0) return null;
        const singlePrice =
          Number(item.cost.totalAmount.amount) / item.quantity;
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
    return {
      ...optimisticCart,
      ...updateCartTotals(updatedLines),
      lines: updatedLines,
    };
  }, [optimisticCart, qtyPatch]);

  const updateCartItem = (merchandiseId: string, updateType: UpdateType) => {
    updateOptimisticCart({
      type: "UPDATE_ITEM",
      payload: { merchandiseId, updateType },
    });
    // Also record in persistent patch so the quantity survives cache invalidations
    setQtyPatch((prev) => {
      const currentItem = optimisticCart?.lines.find(
        (l) => l.merchandise.id === merchandiseId,
      );
      const baseQty =
        prev.get(merchandiseId) ?? currentItem?.quantity ?? 1;
      const newQty =
        updateType === "plus"
          ? baseQty + 1
          : updateType === "minus"
            ? baseQty - 1
            : 0;
      const next = new Map(prev);
      if (newQty <= 0) next.delete(merchandiseId);
      else next.set(merchandiseId, newQty);
      return next;
    });
  };

  const addCartItem = (variant: ProductVariant, product: Product) => {
    updateOptimisticCart({ type: "ADD_ITEM", payload: { variant, product } });
  };

  return useMemo(
    () => ({
      cart,
      updateCartItem,
      addCartItem,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart],
  );
}
