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
      totalAmount: { amount: Math.max(0, subtotal - discount).toFixed(2), currencyCode },
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
      const qty = Math.min((existing?.quantity ?? 0) + 1, MAX_ITEM_QUANTITY);
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
          quantityAvailable: existing?.merchandise.quantityAvailable,
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

  // Apply a server-confirmed cart for ADD operations only.
  // Preserves items that are still in-flight — optimistically added but not yet
  // in the confirmed cart, identified by having no server-assigned line ID.
  // Never use this for removes or updates; call setCart(result) directly there.
  function mergeConfirmAdd(confirmed: Cart) {
    setCart((prev) => {
      if (!prev) return confirmed;
      const confirmedIds = new Set(confirmed.lines.map((l) => l.merchandise.id));
      const inFlight = prev.lines.filter(
        (l) => !confirmedIds.has(l.merchandise.id) && l.id === undefined,
      );
      if (inFlight.length === 0) return confirmed;
      return withTotals(confirmed, [...confirmed.lines, ...inFlight]);
    });
  }

  return { cart, setCart, addCartItem, mergeConfirmAdd };
}
