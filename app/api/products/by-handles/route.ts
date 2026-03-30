import { getProduct } from "lib/shopify";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { handles } = await request.json();

    if (!Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Limit to 20 products max
    const limited = handles.slice(0, 20);

    const results = await Promise.all(
      limited.map(async (handle: string) => {
        try {
          const product = await getProduct(handle);
          if (!product) return null;
          return {
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
          };
        } catch {
          return null;
        }
      }),
    );

    return NextResponse.json({
      products: results.filter(Boolean),
    });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
