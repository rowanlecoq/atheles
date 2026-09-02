import { FadeIn } from "components/animations/fade-in";
import { HomepageProductCard } from "components/homepage-product-card";
import Footer from "components/layout/footer";
import { Gallery } from "components/product/gallery";
import { ProductDescription } from "components/product/product-description";
import {
  RecentlyViewedProducts,
  RecentlyViewedTracker,
} from "components/product/recently-viewed";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { getProduct, getProductRecommendations } from "lib/shopify";
import type { Image } from "lib/shopify/types";
import { baseUrl } from "lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: url
      ? {
          images: [
            {
              url,
              width,
              height,
              alt,
            },
          ],
        }
      : null,
  };
}

export default async function ProductPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const productUrl = `${baseUrl}/product/${product.handle}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productUrl,
    name: product.title,
    description: product.description,
    image: product.featuredImage?.url || product.images?.[0]?.url || "",
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: "ATHELES",
    },
    offers: {
      "@type": "AggregateOffer",
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount,
      url: productUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <RecentlyViewedTracker
        product={{
          handle: product.handle,
          title: product.title,
          featuredImageUrl: product.featuredImage?.url ?? "",
          secondImageUrl: product.images?.[1]?.url,
          availableForSale: product.availableForSale,
          price: product.priceRange.maxVariantPrice.amount,
          currencyCode: product.priceRange.maxVariantPrice.currencyCode,
        }}
      />
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-6">
          <div className="flex flex-col rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4 sm:p-6 md:p-10 lg:flex-row lg:gap-8 lg:p-12">
            <div className="w-full basis-full lg:basis-4/6">
              <Suspense
                fallback={
                  <div className="relative aspect-square max-h-[460px] w-full overflow-hidden sm:max-h-[550px]" />
                }
              >
                <Gallery
                  images={product.images.map((image: Image) => ({
                    src: image.url,
                    altText: image.altText,
                  }))}
                />
              </Suspense>
            </div>

            <div className="mt-8 basis-full lg:mt-0 lg:basis-2/6">
              <Suspense fallback={null}>
                <ProductDescription product={product} />
              </Suspense>
            </div>
          </div>
        <RelatedProducts id={product.id} />
        <Suspense fallback={null}>
          <RecentlyViewedProducts currentHandle={product.handle} />
        </Suspense>

      </div>
      <Footer />
    </>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const relatedProducts = await getProductRecommendations(id);

  if (!relatedProducts.length) return null;

  return (
    <FadeIn direction="up" delay={0.15}>
    <div className="py-8">
      <h2 className="mb-4 font-heading text-xl font-bold text-brand-gold sm:text-2xl">
        Related Items
      </h2>
      <ul className="flex w-full gap-4 overflow-x-auto scrollbar-hide pt-1 pb-2">
        {relatedProducts.map((product) => (
          <li
            key={product.handle}
            className="w-[72%] min-w-[200px] flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <HomepageProductCard product={product} size="half" />
          </li>
        ))}
      </ul>
    </div>
    </FadeIn>
  );
}
