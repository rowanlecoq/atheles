"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
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
  const disabled = !availableForSale || !selectedVariantId;

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
          ? "cursor-pointer bg-brand-gold text-brand-dark hover:shadow-[0_0_30px_rgba(193,163,104,0.4)]"
          : "cursor-not-allowed bg-brand-gold/50 text-brand-dark/60 opacity-60",
      )}
    >
      {/* Animated gradient overlay on hover */}
      {selectedVariantId && (
        <div
          className={clsx(
            "absolute inset-0 transition-opacity duration-500",
            hovering ? "opacity-100" : "opacity-0",
          )}
          style={{
            background:
              "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 70%, transparent 100%)",
            animation: hovering ? "shimmerBtn 1.5s ease-in-out infinite" : "none",
          }}
        />
      )}

      {/* Sparkle particles on hover */}
      {selectedVariantId && hovering && (
        <>
          <span className="absolute left-[15%] top-[20%] animate-ping text-[6px] text-white/60" style={{ animationDuration: "1s" }}>&#10022;</span>
          <span className="absolute left-[45%] top-[15%] animate-ping text-[5px] text-white/50" style={{ animationDuration: "1.3s", animationDelay: "0.3s" }}>&#10022;</span>
          <span className="absolute left-[75%] top-[25%] animate-ping text-[6px] text-white/60" style={{ animationDuration: "1.1s", animationDelay: "0.6s" }}>&#10022;</span>
          <span className="absolute left-[30%] bottom-[20%] animate-ping text-[5px] text-white/40" style={{ animationDuration: "1.4s", animationDelay: "0.2s" }}>&#10022;</span>
          <span className="absolute left-[60%] bottom-[15%] animate-ping text-[6px] text-white/50" style={{ animationDuration: "1.2s", animationDelay: "0.5s" }}>&#10022;</span>
        </>
      )}

      {/* Plus icon */}
      <div
        className={clsx(
          "absolute left-0 ml-4 transition-transform duration-300",
          hovering && selectedVariantId ? "rotate-90 scale-110" : "",
        )}
      >
        <PlusIcon className="h-5" />
      </div>

      {/* Button text */}
      <span className="relative z-10">
        {selectedVariantId ? "Add To Cart" : "Select a Size"}
      </span>

      {/* Shimmer keyframes */}
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
