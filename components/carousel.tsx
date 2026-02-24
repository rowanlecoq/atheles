import { SplitText } from "components/animations";
import { getCollectionProducts } from "lib/shopify";
import Link from "next/link";
import { GridTileImage } from "./grid/tile";

export async function Carousel() {
  const products = await getCollectionProducts({
    collection: "hidden-homepage-carousel",
  });

  if (!products?.length) return null;

  const carouselProducts = [...products, ...products, ...products];

  return (
    <section className="py-10 sm:py-12">
      {/* Section heading */}
      <div className="mb-8 px-4 text-center">
        <SplitText
          as="h2"
          text="New Arrivals"
          className="mb-2 font-heading text-xl font-bold tracking-[0.08em] text-brand-gold sm:text-2xl sm:tracking-wider md:text-3xl"
        />
        <div className="mx-auto h-px w-24 bg-brand-dark-gold/40" />
      </div>

      <div className="relative w-full overflow-hidden pb-6 pt-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-brand-dark to-transparent sm:w-16 md:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-brand-dark to-transparent sm:w-16 md:w-20" />

        <ul className="flex w-max animate-carousel gap-3 px-4 sm:gap-4">
          {carouselProducts.map((product, i) => (
            <li
              key={`${product.handle}${i}`}
              className="relative aspect-square h-[34vh] min-h-[220px] w-[72vw] max-h-[300px] max-w-[340px] flex-none sm:h-[30vh] sm:w-[58vw] md:w-1/3 md:max-w-[475px]"
            >
              <Link
                href={`/product/${product.handle}`}
                className="relative h-full w-full"
              >
                <GridTileImage
                  alt={product.title}
                  label={{
                    title: product.title,
                    amount: product.priceRange.maxVariantPrice.amount,
                    currencyCode: product.priceRange.maxVariantPrice.currencyCode,
                  }}
                  src={product.featuredImage?.url}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
