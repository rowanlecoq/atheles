import { AddToCart } from "components/cart/add-to-cart";
import Price from "components/price";
import Prose from "components/prose";
import { SizeGuideButton } from "components/size-guide";
import { Product } from "lib/shopify/types";
import { FavoriteButton } from "./favorite-button";
import { ShareButton } from "./share-button";
import { StockIndicator } from "./stock-indicator";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({ product }: { product: Product }) {
  return (
    <>
      {/* Title + Price */}
      <div className="mb-4">
        <h1 className="mb-1 text-balance font-heading text-3xl font-medium leading-tight text-brand-light-gold sm:text-4xl lg:text-5xl">
          {product.title}
        </h1>
        <div className="mt-2 text-lg text-brand-grey">
          <Price
            amount={product.priceRange.maxVariantPrice.amount}
            currencyCode={product.priceRange.maxVariantPrice.currencyCode}
          />
        </div>
      </div>

      {/* Actions row: favorite + share */}
      <div className="mb-6 flex items-center gap-3 border-b border-brand-dark-gold/30 pb-6">
        <FavoriteButton handle={product.handle} />
        <ShareButton title={product.title} />
        <div className="ml-auto">
          <StockIndicator product={product} />
        </div>
      </div>

      {/* Size selector with guide link */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm uppercase tracking-wide text-brand-pale-gold">
          select a size
        </span>
        <SizeGuideButton />
      </div>
      <VariantSelector options={product.options} variants={product.variants} />

      {/* Description */}
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-relaxed text-brand-grey"
          html={product.descriptionHtml}
        />
      ) : null}

      {/* Add to Cart */}
      <AddToCart product={product} />
    </>
  );
}
