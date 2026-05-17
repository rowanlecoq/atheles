"use client";

import type { Cart, CartItem, Product, ProductVariant } from "lib/shopify/types";
import React, { createContext, use, useContext, useRef, useState } from "react";

export const MAX_ITEM_QUANTITY = 20;

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

function withTotals(base: Cart, lines: CartItem[]): Cart {
  const subtotal = lines.reduce((s, l) => s + parseFloat(l.cost.totalAmount.amount), 0);
  const currencyCode =
    lines[0]?.cost.totalAmount.currencyCode ?? base.cost.totalAmount.currencyCode;
  // Scale total proportionally so any applied discount rate reflects immediately
  // (same formula as applyConfirmed). Exact for % codes; approximates fixed-amount
  // codes until Shopify confirms, which is close enough for optimistic display.
  const baseSubtotal = parseFloat(base.cost.subtotalAmount.amount);
  const baseTotal = parseFloat(base.cost.totalAmount.amount);
  const total = baseSubtotal > 0
    ? Math.max(0, subtotal * (baseTotal / baseSubtotal))
    : subtotal;
  return {
    ...base,
    lines,
    totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
    cost: {
      ...base.cost,
      subtotalAmount: { amount: subtotal.toFixed(2), currencyCode },
      totalAmount: { amount: total.toFixed(2), currencyCode },
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
  // Pin the initial promise — RSC re-renders after server actions pass a new
  // cartPromise prop but we ignore them. Every action returns its confirmed
  // cart and applies it via setCart directly.
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
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  const { cart, setCart } = ctx;

  // Optimistically add an item before the server action fires.
  function addCartItem(variant: ProductVariant, product: Product) {
    setCart((prev) => {
      const base = prev ?? buildEmptyCart(variant.price.currencyCode);
      const existing = base.lines.find((l) => l.merchandise.id === variant.id);
      // Enforce stock limit immediately so rapid adds can't exceed inventory.
      const stockLimit = typeof variant.quantityAvailable === "number"
        ? variant.quantityAvailable
        : typeof existing?.merchandise.quantityAvailable === "number"
        ? existing.merchandise.quantityAvailable
        : MAX_ITEM_QUANTITY;
      const cap = Math.min(stockLimit, MAX_ITEM_QUANTITY);
      const currentQty = existing?.quantity ?? 0;
      if (currentQty >= cap) return prev; // already at limit, no-op
      const qty = currentQty + 1;
      const newLine: CartItem = {
        id: existing?.id,
        quantity: qty,
        cost: {
          totalAmount: {
            amount: (parseFloat(variant.price.amount) * qty).toFixed(2),
            currencyCode: variant.price.currencyCode,
          },
        },
        merchandise: {
          id: variant.id,
          title: variant.title,
          availableForSale: variant.availableForSale,
          quantityAvailable: typeof variant.quantityAvailable === "number"
            ? variant.quantityAvailable
            : existing?.merchandise.quantityAvailable,
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
        ? base.lines.map((l) => (l.merchandise.id === variant.id ? newLine : l))
        : [...base.lines, newLine];
      return withTotals(base, lines);
    });
  }

  // Apply a server-confirmed cart after an ADD, preserving all items currently
  // in prev (in-flight adds from concurrent operations, items from stale confirms).
  // Uses the same "iterate prev" strategy as applyConfirmed in modal.tsx.
  function mergeConfirmAdd(confirmed: Cart) {
    setCart((prev) => {
      if (!prev) return confirmed;
      const lines: CartItem[] = [];
      for (const prevLine of prev.lines) {
        const confirmedLine = confirmed.lines.find((l) => l.merchandise.id === prevLine.merchandise.id);
        if (confirmedLine) {
          // Take id/merchandise from confirmed (real server id, updated quantityAvailable),
          // keep qty/cost from prev (may reflect a more recent optimistic change).
          const qa = confirmedLine.merchandise.quantityAvailable ?? prevLine.merchandise.quantityAvailable;
          lines.push({
            ...confirmedLine,
            quantity: prevLine.quantity,
            cost: prevLine.cost,
            merchandise: { ...confirmedLine.merchandise, quantityAvailable: qa },
          });
        } else {
          // Not in this confirmed cart — keep with prev data.
          // Either an in-flight add (id=undefined) or a stale confirm that raced ahead.
          lines.push(prevLine);
        }
      }
      return withTotals(confirmed, lines);
    });
  }

  return { cart, setCart, addCartItem, mergeConfirmAdd };
}
