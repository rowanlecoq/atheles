import { CarouselControls } from "components/carousel-controls";
import { ProductCard } from "components/product-card";
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
        title="New In: Our Collection"
        subtitle="Mens"
        viewAllHref="/search"
      >
        {products.map((product) => (
          <div
            key={product.handle}
            data-card
            className="w-[72vw] max-w-[340px] flex-none sm:w-[45vw] sm:max-w-none md:w-auto md:max-w-none"
          >
            <ProductCard
              handle={product.handle}
              title={product.title}
              featuredImageUrl={product.featuredImage?.url}
              price={product.priceRange.maxVariantPrice.amount}
              currencyCode={product.priceRange.maxVariantPrice.currencyCode}
              variants={
                product.variants?.map((v) => ({ title: v.title })) ?? []
              }
              tags={product.tags ?? []}
            />
          </div>
        ))}
      </CarouselControls>
    </section>
  );
}
