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
        "group relative flex w-full items-center justify-center overflow-hidden rounded-full p-4 font-heading text-sm uppercase tracking-wider text-brand-dark transition-all duration-300",
        selectedVariantId
          ? "cursor-pointer"
          : "cursor-not-allowed opacity-60",
      )}
      style={{
        background: !selectedVariantId
          ? "rgba(193,163,104,0.5)"
          : hovering
            ? "linear-gradient(270deg, #c1a368, #e8d5a3, #a08540, #c1a368)"
            : "#c1a368",
        backgroundSize: hovering && selectedVariantId ? "300% 100%" : "100% 100%",
        animation: hovering && selectedVariantId ? "colorShift 3s ease infinite" : "none",
      }}
    >
      <span className="relative z-10">
        {selectedVariantId ? "Add To Cart" : "Select a Size"}
      </span>

      <style jsx>{`
        @keyframes colorShift {
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

  // Calculate points earned
  const price = parseFloat(product.priceRange.maxVariantPrice.amount);
  const pointsEarned = Math.floor(price * 50);

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

      {/* Points earned info */}
      {availableForSale && pointsEarned > 0 && (
        <p className="text-center text-xs text-brand-grey">
          earn <span className="text-brand-gold">{pointsEarned.toLocaleString()} points</span> with this purchase
        </p>
      )}
    </div>
  );
}
