import { Product } from "lib/shopify/types";

export function StockIndicator({ product }: { product: Product }) {
  if (!product.availableForSale) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="uppercase tracking-wider text-red-400">
          Out of Stock
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      <span className="uppercase tracking-wider text-green-400">In Stock</span>
    </div>
  );
}
