"use client";

import clsx from "clsx";
import { addItem } from "components/cart/actions";
import type { Product, ProductVariant } from "lib/shopify/types";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useCart } from "./cart-context";

function SubmitButton({
  availableForSale,
  selectedVariantId,
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
}) {

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
      className={clsx(
        "group relative flex w-full items-center justify-center overflow-hidden rounded-full p-4 font-heading text-sm uppercase text-brand-dark transition-all duration-300",
        selectedVariantId
          ? "cursor-pointer bg-brand-gold"
          : "cursor-not-allowed bg-brand-gold/50 opacity-60",
      )}
    >
      {/* Shimmer on hover */}
      {selectedVariantId && (
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{
          background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.15) 52%, transparent 70%)",
          animation: "cartShimmer 2s ease-in-out infinite",
        }} />
      )}

      <span className="relative z-10 tracking-wider transition-all duration-300 group-hover:tracking-[0.2em]">
        {selectedVariantId ? "Add To Cart" : "Select a Size"}
      </span>

      <style jsx>{`
        @keyframes cartShimmer {
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
