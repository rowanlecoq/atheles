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

  return (
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
  );
}
