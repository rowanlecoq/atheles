import { AddToCart } from "components/cart/add-to-cart";
import Price from "components/price";
import Prose from "components/prose";
import { SizeGuideButton } from "components/size-guide";
import { Product } from "lib/shopify/types";
import { FavoriteButton } from "./favorite-button";
import { StockIndicator } from "./stock-indicator";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({ product }: { product: Product }) {
  return (
    <>
      <div className="mb-6 flex flex-col border-b border-brand-dark-gold/30 pb-6">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h1 className="text-balance font-heading text-3xl font-medium leading-tight text-brand-light-gold sm:text-4xl lg:text-5xl">
            {product.title}
          </h1>
          <FavoriteButton handle={product.handle} />
        </div>
        <div className="mr-auto w-auto rounded-full bg-brand-gold p-2 text-sm text-brand-dark">
          <Price
            amount={product.priceRange.maxVariantPrice.amount}
            currencyCode={product.priceRange.maxVariantPrice.currencyCode}
          />
        </div>
        <div className="mt-3">
          <StockIndicator product={product} />
        </div>
      </div>
      <VariantSelector options={product.options} variants={product.variants} />
      <SizeGuideButton />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-relaxed text-brand-grey"
          html={product.descriptionHtml}
        />
      ) : null}
      <AddToCart product={product} />
    </>
  );
}
