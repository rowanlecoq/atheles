import { getProducts } from "lib/shopify";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (query.trim().length < 2) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await getProducts({ query: query.trim() });

    const results = products.slice(0, 6).map((p) => ({
      handle: p.handle,
      title: p.title,
      featuredImage: p.featuredImage ? { url: p.featuredImage.url } : null,
      priceRange: {
        maxVariantPrice: {
          amount: p.priceRange.maxVariantPrice.amount,
          currencyCode: p.priceRange.maxVariantPrice.currencyCode,
        },
      },
    }));

    return NextResponse.json({ products: results });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
