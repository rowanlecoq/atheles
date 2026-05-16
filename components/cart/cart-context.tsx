"use client";

import type { Cart, CartItem, Product, ProductVariant } from "lib/shopify/types";
import React, { createContext, use, useContext, useMemo, useRef, useState } from "react";

export const MAX_ITEM_QUANTITY = 20;

type UpdateType = "plus" | "minus" | "delete";

type CartContextType = {
  cart: Cart | undefined;
  setCart: React.Dispatch<React.SetStateAction<Cart | undefined>>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function buildEmptyCart(currencyCode = "USD"): Cart {
  return {
    id: undefined,
    checkoutUrl: "",
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: { amount: "0", currencyCode },
      totalAmount: { amount: "0", currencyCode },
      totalTaxAmount: { amount: "0", currencyCode },
    },
    discountCodes: [],
    discountAllocations: [],
  };
}

// Recompute subtotal/total from lines, preserving base cart metadata.
// Existing discountAllocations are kept so the discount amount doesn't
// disappear mid-operation — confirmed discount data arrives with the
// next server response.
function withTotals(base: Cart, lines: CartItem[]): Cart {
  const subtotal = lines.reduce(
    (s, l) => s + parseFloat(l.cost.totalAmount.amount),
    0,
  );
  const currencyCode =
    lines[0]?.cost.totalAmount.currencyCode ??
    base.cost.totalAmount.currencyCode;
  const discount = (base.discountAllocations ?? []).reduce(
    (s, a) => s + parseFloat(a.discountedAmount.amount),
    0,
  );
  return {
    ...base,
    lines,
    totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
    cost: {
      ...base.cost,
      subtotalAmount: { amount: subtotal.toFixed(2), currencyCode },
      totalAmount: {
        amount: Math.max(0, subtotal - discount).toFixed(2),
        currencyCode,
      },
    },
  };
}

export function CartProvider({
  children,
  cartPromise,
}: {
  children: React.ReactNode;
  cartPromise: Promise<Cart | undefined>;
}) {
  // Pin the initial RSC promise so use() is only ever called once.
  // RSC re-renders pass new cartPromise props but we intentionally ignore them:
  // every cart operation returns its confirmed cart and applies it via setCart,
  // so RSC-fetched stale cache data cannot wipe optimistic state.
  const initialRef = useRef(cartPromise);
  const initialCart = use(initialRef.current);
  const [cart, setCart] = useState<Cart | undefined>(initialCart);

  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  const { cart, setCart } = ctx;

  // Optimistically add an item. Safe to call before the server action fires.
  function addCartItem(variant: ProductVariant, product: Product) {
    setCart((prev) => {
      const base = prev ?? buildEmptyCart(variant.price.currencyCode);
      const existing = base.lines.find(
        (l) => l.merchandise.id === variant.id,
      );
      const qty = Math.min(
        (existing?.quantity ?? 0) + 1,
        MAX_ITEM_QUANTITY,
      );
      const itemTotal = (parseFloat(variant.price.amount) * qty).toFixed(2);
      const newLine: CartItem = {
        id: existing?.id,
        quantity: qty,
        cost: {
          totalAmount: {
            amount: itemTotal,
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
      const lines = existing
        ? base.lines.map((l) =>
            l.merchandise.id === variant.id ? newLine : l,
          )
        : [...base.lines, newLine];
      return withTotals(base, lines);
    });
  }

  // Optimistically update or delete an item quantity.
  function updateCartItem(merchandiseId: string, updateType: UpdateType) {
    setCart((prev) => {
      if (!prev) return prev;
      const lines = prev.lines
        .map((l) => {
          if (l.merchandise.id !== merchandiseId) return l;
          if (updateType === "delete") return null;
          const qty = Math.min(
            updateType === "plus" ? l.quantity + 1 : l.quantity - 1,
            MAX_ITEM_QUANTITY,
          );
          if (qty <= 0) return null;
          const singlePrice =
            parseFloat(l.cost.totalAmount.amount) / l.quantity;
          return {
            ...l,
            quantity: qty,
            cost: {
              ...l.cost,
              totalAmount: {
                ...l.cost.totalAmount,
                amount: (singlePrice * qty).toFixed(2),
              },
            },
          };
        })
        .filter(Boolean) as CartItem[];
      return withTotals(prev, lines);
    });
  }

  // Apply a server-confirmed cart while preserving any concurrent in-flight
  // optimistic adds (items in current cart not yet present in confirmed cart).
  function mergeConfirm(confirmed: Cart) {
    setCart((prev) => {
      if (!prev) return confirmed;
      const confirmedIds = new Set(
        confirmed.lines.map((l) => l.merchandise.id),
      );
      const extraLines = prev.lines.filter(
        (l) => !confirmedIds.has(l.merchandise.id),
      );
      if (extraLines.length === 0) return confirmed;
      return withTotals(confirmed, [...confirmed.lines, ...extraLines]);
    });
  }

  // Optimistically zero out the discount so the total updates instantly.
  function removeDiscountOptimistic() {
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        discountCodes: [],
        discountAllocations: [],
        cost: {
          ...prev.cost,
          totalAmount: { ...prev.cost.subtotalAmount },
        },
      };
    });
  }

  return useMemo(
    () => ({
      cart,
      setCart,
      addCartItem,
      updateCartItem,
      mergeConfirm,
      removeDiscountOptimistic,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, setCart],
  );
}
