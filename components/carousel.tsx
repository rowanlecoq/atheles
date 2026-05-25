import { CarouselControls } from "components/carousel-controls";
import { CarouselProductCard } from "components/carousel-product-card";
import { getCollectionProducts, getProducts } from "lib/shopify";
import type { Product } from "lib/shopify/types";

export async function Carousel() {
  let products: Product[];
  try {
    products = await getCollectionProducts({
      collection: "hidden-homepage-carousel",
    });
    if (!products || products.length === 0) {
      products = await getProducts({});
    }
  } catch {
    try {
      products = await getProducts({});
    } catch {
      products = [];
    }
  }

  const hasProducts = products && products.length > 0;

  if (!hasProducts) return null;

  return (
    <section className="px-6 py-10 sm:py-14 lg:px-10">
      <CarouselControls
        title="Coming Soon: This Summer"
        subtitle="mens"
        viewAllHref="/search"
      >
        {products.map((product, index) => (
          <div
            key={product.handle}
            data-card
            className="w-[72vw] max-w-[340px] flex-none sm:w-[45vw] sm:max-w-none md:w-auto md:max-w-none"
          >
            <CarouselProductCard product={product} index={index} />
          </div>
        ))}
      </CarouselControls>
    </section>
  );
}
