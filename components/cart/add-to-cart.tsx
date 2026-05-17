"use client";

import clsx from "clsx";
import { addItem } from "components/cart/actions";
import type { Product, ProductVariant } from "lib/shopify/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_ITEM_QUANTITY, useCart } from "./cart-context";

export function AddToCart({ product }: { product: Product }) {
  const { variants, availableForSale } = product;
  const { addCartItem, mergeConfirmAdd, cart } = useCart();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "added">("idle");
  const [addingInProgress, setAddingInProgress] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const variant = variants.find((v: ProductVariant) =>
    v.selectedOptions.every(
      (option) => option.value === searchParams.get(option.name.toLowerCase()),
    ),
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const finalVariant = variants.find((v) => v.id === selectedVariantId);

  const price = parseFloat(product.priceRange.maxVariantPrice.amount);
  const pointsEarned = Math.floor(price * 50);

  // Stock-aware limit: compare current optimistic cart qty against quantityAvailable.
  // Cart line's quantityAvailable is authoritative — Shopify returns real counts there
  // even for "coming soon" products where the product API returns null.
  const cartLine = cart?.lines.find((l) => l.merchandise.id === selectedVariantId);
  const currentQtyInCart = cartLine?.quantity ?? 0;
  const stockCap = typeof finalVariant?.quantityAvailable === "number"
    ? Math.min(finalVariant.quantityAvailable, MAX_ITEM_QUANTITY)
    : typeof cartLine?.merchandise.quantityAvailable === "number"
    ? Math.min(cartLine.merchandise.quantityAvailable, MAX_ITEM_QUANTITY)
    : MAX_ITEM_QUANTITY;
  const atStockLimit = currentQtyInCart >= stockCap;

  const handleAddToCart = () => {
    if (!selectedVariantId || !finalVariant || state === "added" || atStockLimit || addingInProgress) return;

    setAddingInProgress(true);
    addCartItem(finalVariant, product);
    window.dispatchEvent(new Event("open-cart"));

    addItem(null, selectedVariantId).then((result) => {
      if (result && typeof result === "object" && "cart" in result) {
        mergeConfirmAdd(result.cart);
      }
    }).catch(() => {}).finally(() => {
      setAddingInProgress(false);
    });

    setState("added");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setState("idle"), 700);
  };

  if (!availableForSale) {
    return (
      <div className="space-y-3">
        <button
          disabled
          className="relative flex w-full cursor-not-allowed items-center justify-center overflow-hidden rounded-full border border-brand-dark-gold/30 bg-brand-dark p-4 font-heading text-sm uppercase tracking-wider text-brand-grey opacity-60"
        >
          Out Of Stock
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!selectedVariantId || state === "added" || atStockLimit || addingInProgress}
        aria-label={selectedVariantId ? "Add to cart" : "Please select a size"}
        className={clsx(
          "group relative flex w-full items-center justify-center overflow-hidden rounded-full p-4 font-heading text-sm uppercase text-brand-dark transition-all duration-300",
          selectedVariantId
            ? "cursor-pointer bg-brand-gold"
            : "cursor-not-allowed bg-brand-gold/50 opacity-60",
        )}
      >
        {selectedVariantId && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{
            background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.15) 52%, transparent 70%)",
            animation: "cartShimmer 2s ease-in-out infinite",
          }} />
        )}
        <span className="relative z-10 tracking-wider transition-all duration-300 group-hover:tracking-[0.2em]">
          {state === "added" ? "Added!" : atStockLimit ? "Max Quantity" : selectedVariantId ? "Add To Cart" : "Select a Size"}
        </span>
      </button>

      {availableForSale && pointsEarned > 0 && (
        <p className="text-center text-xs text-brand-grey">
          earn <span className="text-brand-gold">{pointsEarned.toLocaleString()} points</span> with this purchase
        </p>
      )}
    </div>
  );
}
