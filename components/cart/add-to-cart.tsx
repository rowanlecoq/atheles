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
          ? "cursor-pointer text-brand-dark hover:shadow-[0_0_30px_rgba(193,163,104,0.4)]"
          : "cursor-not-allowed bg-brand-gold/50 text-brand-dark/60 opacity-60",
      )}
      style={
        selectedVariantId
          ? {
              background: hovering
                ? "linear-gradient(135deg, #c1a368 0%, #e8d5a3 25%, #c1a368 50%, #a08540 75%, #c1a368 100%)"
                : "#c1a368",
              backgroundSize: hovering ? "200% 200%" : "100% 100%",
              animation: hovering
                ? "gradientShift 2s ease infinite"
                : "none",
            }
          : undefined
      }
    >
      {/* Shimmer sweep on hover */}
      {selectedVariantId && (
        <div
          className={clsx(
            "absolute inset-0 transition-opacity duration-500",
            hovering ? "opacity-100" : "opacity-0",
          )}
          style={{
            background:
              "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 70%, transparent 100%)",
            animation: hovering
              ? "shimmerBtn 1.5s ease-in-out infinite"
              : "none",
          }}
        />
      )}

      {/* Sparkle particles on hover */}
      {selectedVariantId && hovering && (
        <>
          <span className="absolute left-[12%] top-[18%] animate-ping text-[7px] text-brand-dark/40" style={{ animationDuration: "1s" }}>&#10022;</span>
          <span className="absolute left-[40%] top-[12%] animate-ping text-[6px] text-brand-dark/30" style={{ animationDuration: "1.3s", animationDelay: "0.3s" }}>&#10022;</span>
          <span className="absolute left-[72%] top-[22%] animate-ping text-[7px] text-brand-dark/40" style={{ animationDuration: "1.1s", animationDelay: "0.6s" }}>&#10022;</span>
          <span className="absolute left-[25%] bottom-[18%] animate-ping text-[6px] text-brand-dark/25" style={{ animationDuration: "1.4s", animationDelay: "0.2s" }}>&#10022;</span>
          <span className="absolute left-[58%] bottom-[14%] animate-ping text-[7px] text-brand-dark/35" style={{ animationDuration: "1.2s", animationDelay: "0.5s" }}>&#10022;</span>
          <span className="absolute left-[85%] top-[40%] animate-ping text-[5px] text-brand-dark/30" style={{ animationDuration: "1.5s", animationDelay: "0.8s" }}>&#10022;</span>
        </>
      )}

      {/* Button text */}
      <span className="relative z-10">
        {selectedVariantId ? "Add To Cart" : "Select a Size"}
      </span>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes shimmerBtn {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
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
      // Redirect to checkout
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

      {/* Buy Now button */}
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
    </div>
  );
}
