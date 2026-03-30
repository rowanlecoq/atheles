import { SplitText } from "components/animations";
import { HomepageProductCard } from "components/homepage-product-card";
import { getCollectionProducts } from "lib/shopify";
import type { Product } from "lib/shopify/types";

function ThreeItemGridItem({
  item,
  size,
  priority,
}: {
  item: Product;
  size: "full" | "half";
  priority?: boolean;
}) {
  return (
    <div
      className={
        size === "full"
          ? "md:col-span-4 md:row-span-2"
          : "md:col-span-2 md:row-span-1"
      }
    >
      <HomepageProductCard product={item} size={size} priority={priority} />
    </div>
  );
}

export async function ThreeItemGrid() {
  const homepageItems = await getCollectionProducts({
    collection: "hidden-homepage-featured-items",
  });

  if (!homepageItems[0] || !homepageItems[1] || !homepageItems[2]) return null;

  const [firstProduct, secondProduct, thirdProduct] = homepageItems;

  return (
    <section className="py-10 sm:py-12">
      <div className="mb-8 px-4 text-center">
        <SplitText
          as="h2"
          text="best selling"
          className="mb-2 font-heading text-xl font-bold tracking-[0.08em] text-brand-gold sm:text-2xl sm:tracking-wider md:text-3xl"
        />
        <div className="mx-auto h-px w-24 bg-brand-dark-gold/40" />
      </div>

      <div className="mx-auto grid max-w-(--breakpoint-2xl) gap-3 px-4 pb-4 sm:gap-4 md:grid-cols-6 md:grid-rows-2 md:max-h-[400px] lg:max-h-[500px]">
        <ThreeItemGridItem size="full" item={firstProduct} priority={true} />
        <ThreeItemGridItem size="half" item={secondProduct} priority={true} />
        <ThreeItemGridItem size="half" item={thirdProduct} />
      </div>
    </section>
  );
}
