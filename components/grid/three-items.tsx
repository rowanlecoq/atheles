import { GridTileImage } from "components/grid/tile";
import { GradualBlur, SplitText } from "components/animations";
import { getCollectionProducts } from "lib/shopify";
import type { Product } from "lib/shopify/types";
import Link from "next/link";

function ThreeItemGridItem({
  item,
  size,
  priority,
  delay = 0,
}: {
  item: Product;
  size: "full" | "half";
  priority?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={
        size === "full"
          ? "md:col-span-4 md:row-span-2"
          : "md:col-span-2 md:row-span-1"
      }
    >
      <GradualBlur delay={delay}>
        <Link
          className="relative block aspect-square h-full w-full"
          href={`/product/${item.handle}`}
          prefetch={true}
        >
          <GridTileImage
            src={item.featuredImage.url}
            fill
            sizes={
              size === "full"
                ? "(min-width: 768px) 66vw, 100vw"
                : "(min-width: 768px) 33vw, 100vw"
            }
            priority={priority}
            alt={item.title}
            label={{
              position: size === "full" ? "center" : "bottom",
              title: item.title as string,
              amount: item.priceRange.maxVariantPrice.amount,
              currencyCode: item.priceRange.maxVariantPrice.currencyCode,
            }}
          />
        </Link>
      </GradualBlur>
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
      {/* Section heading */}
      <div className="mb-8 px-4 text-center">
        <SplitText
          as="h2"
          text="best selling"
          className="mb-2 font-heading text-xl font-bold tracking-[0.08em] text-brand-gold sm:text-2xl sm:tracking-wider md:text-3xl"
        />
        <div className="mx-auto h-px w-24 bg-brand-dark-gold/40" />
      </div>

      <div className="mx-auto grid max-w-(--breakpoint-2xl) gap-3 px-4 pb-4 sm:gap-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[500px]">
        <ThreeItemGridItem
          size="full"
          item={firstProduct}
          priority={true}
          delay={0}
        />
        <ThreeItemGridItem
          size="half"
          item={secondProduct}
          priority={true}
          delay={0.06}
        />
        <ThreeItemGridItem size="half" item={thirdProduct} delay={0.12} />
      </div>
    </section>
  );
}
