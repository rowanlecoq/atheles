"use client";

import clsx from "clsx";
import { addItem } from "components/cart/actions";
import type { Product, ProductVariant } from "lib/shopify/types";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { useCart } from "./cart-context";

function SubmitButton({
  availableForSale,
  selectedVariantId,
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
}) {
  const [hovering, setHovering] = useState(false);

  if (!availableForSale) {
    return (
      <button
        disabled
        className="relative flex w-full cursor-not-allowed items-center justify-center overflow-hidden rounded-full border border-brand-dark-gold/30 bg-brand-dark p-4 font-heading text-sm uppercase tracking-wider text-brand-grey opacity-60"
      >
        Out Of Stock
      </button>
    );
  }

  return (
    <button
      aria-label={selectedVariantId ? "Add to cart" : "Please select a size"}
      disabled={!selectedVariantId}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={clsx(
        "group relative flex w-full items-center justify-center overflow-hidden rounded-full p-4 font-heading text-sm uppercase tracking-wider transition-all duration-500",
        selectedVariantId
          ? "cursor-pointer bg-brand-gold text-brand-dark"
          : "cursor-not-allowed bg-brand-gold/50 text-brand-dark/60 opacity-60",
      )}
    >
      {/* Subtle shimmer sweep on hover */}
      {selectedVariantId && (
        <div
          className={clsx(
            "absolute inset-0 transition-opacity duration-700",
            hovering ? "opacity-100" : "opacity-0",
          )}
          style={{
            background:
              "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.12) 48%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 52%, transparent 70%)",
            animation: hovering ? "shimmerBtn 2s ease-in-out infinite" : "none",
          }}
        />
      )}

      {/* Button text with subtle lift on hover */}
      <span
        className={clsx(
          "relative z-10 transition-all duration-300",
          hovering && selectedVariantId ? "tracking-[0.2em]" : "tracking-wider",
        )}
      >
        {selectedVariantId ? "Add To Cart" : "Select a Size"}
      </span>

      <style jsx>{`
        @keyframes shimmerBtn {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </button>
  );
}

export function AddToCart({ product }: { product: Product }) {
  const { variants, availableForSale } = product;
  const { addCartItem } = useCart();
  const searchParams = useSearchParams();
  const [message, formAction] = useActionState(addItem, null);
  const [buyingNow, setBuyingNow] = useState(false);

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === searchParams.get(option.name.toLowerCase()),
    ),
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const addItemAction = formAction.bind(null, selectedVariantId);
  const finalVariant = variants.find(
    (variant) => variant.id === selectedVariantId,
  );

  const handleBuyNow = async () => {
    if (!finalVariant || !selectedVariantId) return;
    setBuyingNow(true);
    try {
      addCartItem(finalVariant, product);
      await addItemAction();
      const { redirectToCheckout } = await import("components/cart/actions");
      await redirectToCheckout();
    } catch {
      setBuyingNow(false);
    }
  };

  return (
    <div className="space-y-3">
      <form
        action={async () => {
          if (finalVariant) {
            addCartItem(finalVariant, product);
          }
          addItemAction();
        }}
      >
        <SubmitButton
          availableForSale={availableForSale}
          selectedVariantId={selectedVariantId}
        />
        <p aria-live="polite" className="sr-only" role="status">
          {message}
        </p>
      </form>

      {/* Buy Now */}
      {availableForSale && selectedVariantId && (
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={buyingNow}
          className="flex w-full items-center justify-center rounded-full border border-brand-dark-gold/30 bg-brand-dark p-4 font-heading text-sm uppercase tracking-wider text-brand-pale-gold transition-all duration-300 hover:border-brand-gold hover:text-brand-gold disabled:opacity-50"
        >
          {buyingNow ? "redirecting..." : "buy now"}
        </button>
      )}

      {/* Payment icons */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <span className="text-xs text-brand-grey/50">we accept</span>
        <div className="flex items-center gap-2">
          {/* Visa */}
          <svg viewBox="0 0 38 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="38" height="24" rx="3" fill="#1A1F71" />
            <path d="M15.3 15.8H13l1.4-8.6h2.3l-1.4 8.6zm7.5-8.4c-.5-.2-1.2-.4-2.1-.4-2.3 0-3.9 1.2-3.9 2.9 0 1.3 1.2 2 2 2.4.9.4 1.2.7 1.2 1.1 0 .6-.7.9-1.4.9-1 0-1.5-.1-2.3-.5l-.3-.2-.3 2c.6.3 1.6.5 2.7.5 2.4 0 4-1.2 4-3 0-1-.6-1.8-2-2.4-.8-.4-1.3-.7-1.3-1.1 0-.4.4-.8 1.3-.8.7 0 1.3.2 1.7.3l.2.1.5-1.8zm5.8-.2h-1.8c-.5 0-1 .2-1.2.7l-3.4 8.1h2.4l.5-1.3h2.9l.3 1.3h2.1l-1.8-8.8zm-2.8 5.7l1.2-3.2.3 1 .5 2.2h-2zm-11.5-5.7L12.1 13l-.2-1.2c-.4-1.4-1.7-2.9-3.2-3.7l2.1 7.7h2.4l3.7-8.6h-2.6z" fill="white" />
            <path d="M9.6 7.2H6l0 .2c2.9.7 4.8 2.5 5.6 4.6l-.8-4.1c-.1-.5-.5-.7-1.2-.7z" fill="#F9A533" />
          </svg>
          {/* Mastercard */}
          <svg viewBox="0 0 38 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="38" height="24" rx="3" fill="#252525" />
            <circle cx="15" cy="12" r="7" fill="#EB001B" />
            <circle cx="23" cy="12" r="7" fill="#F79E1B" />
            <path d="M19 6.7a7 7 0 0 1 2.6 5.3A7 7 0 0 1 19 17.3a7 7 0 0 1-2.6-5.3A7 7 0 0 1 19 6.7z" fill="#FF5F00" />
          </svg>
          {/* Apple Pay */}
          <svg viewBox="0 0 38 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="38" height="24" rx="3" fill="#000" />
            <path d="M13.3 8.3c.3-.4.5-.9.5-1.4-.5 0-1.1.3-1.4.7-.3.3-.6.9-.5 1.4.5 0 1.1-.3 1.4-.7zm.4.8c-.8 0-1.5.4-1.8.4-.4 0-1-.4-1.6-.4-.8 0-1.6.5-2 1.2-.9 1.5-.2 3.7.6 4.9.4.6.9 1.2 1.5 1.2.6 0 .8-.4 1.6-.4.7 0 .9.4 1.5.4.7 0 1.1-.6 1.5-1.2.5-.7.7-1.4.7-1.4-.8-.3-1-1.3-.9-1.3 0-1 .8-1.5.8-1.5-.4-.7-1.1-.8-1.4-.9h.5zm5.6-.7h-1.8l-1.2 4.2-.1.4h0l-.1-.4-1.2-4.2h-1.9l2.2 6.5-.1.3c-.2.5-.5.7-.9.7-.2 0-.3 0-.4 0v1.4c.2 0 .4.1.7.1.9 0 1.6-.4 2.1-1.6l2.7-7.4zm3.2 1.4c-.9 0-1.5.5-1.7 1.2h0l.1-1.1h-1.4l-.7 5.5h1.5l.3-2.5c.1-.7.6-1.2 1.1-1.2.4 0 .6.3.6.6l-.4 3.1h1.5l.4-3.3c0-.9-.5-1.5-1.3-1.5v-.3zm4.5 0c-1.5 0-2.5 1.2-2.5 2.8 0 1.2.7 2.1 2 2.1.6 0 1.1-.1 1.6-.5l-.4-1c-.3.2-.7.3-1 .3-.5 0-.9-.3-.9-.8h2.6c0-.2.1-.5.1-.8 0-1.1-.6-2.1-1.9-2.1h.4zm-.5 1.1c.4 0 .7.3.7.8h-1.6c.1-.5.5-.8.9-.8z" fill="white" />
          </svg>
          {/* Shop Pay */}
          <div className="flex h-5 items-center rounded bg-[#5A31F4] px-1.5">
            <span className="text-[9px] font-bold text-white">Shop</span>
            <span className="ml-0.5 text-[9px] font-bold text-white/70">Pay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
