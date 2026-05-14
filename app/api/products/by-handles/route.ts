import { getProduct } from "lib/shopify";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { handles } = await request.json();

    if (!Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const limited = handles.slice(0, 20);

    const results = await Promise.all(
      limited.map(async (handle: string) => {
        try {
          const product = await getProduct(handle);
          if (!product) return null;
          const firstVariant = product.variants.find((v) => v.availableForSale) || product.variants[0];
          return {
            id: product.id,
            handle: product.handle,
            title: product.title,
            featuredImage: product.featuredImage
              ? { url: product.featuredImage.url }
              : null,
            priceRange: {
              maxVariantPrice: {
                amount: product.priceRange.maxVariantPrice.amount,
                currencyCode: product.priceRange.maxVariantPrice.currencyCode,
              },
            },
            firstVariantId: firstVariant?.id || null,
            firstVariantTitle: firstVariant?.title || "Default Title",
            firstVariantPrice: firstVariant?.price || null,
            firstVariantOptions: firstVariant?.selectedOptions || [],
            availableForSale: product.availableForSale,
          };
        } catch {
          return null;
        }
      }),
    );

    return NextResponse.json({ products: results.filter(Boolean) }, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=15" },
    });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
