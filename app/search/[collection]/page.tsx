import { getCollection, getCollectionProducts } from "lib/shopify";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";

type ParentCategory = {
  title: string;
  description: string;
  subcollections: string[];
  comingSoon?: boolean;
};

const parentCategories: Record<string, ParentCategory> = {
  mens: {
    title: "mens",
    description: "shop all mens athletic wear.",
    subcollections: ["compressions", "tees", "sweatpants"],
  },
  tees: {
    title: "tees",
    description: "shop all tees.",
    subcollections: ["tees"],
  },
  womens: {
    title: "womens",
    description: "shop all womens athletic wear.",
    comingSoon: true,
    subcollections: [],
  },
  accessories: {
    title: "accessories",
    description: "shop all accessories.",
    comingSoon: true,
    subcollections: [],
  },
};

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;

  const parent = parentCategories[params.collection];
  if (parent) {
    return {
      title: parent.title,
      description: parent.description,
    };
  }

  const collection = await getCollection(params.collection);

  if (!collection) return notFound();

  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description ||
      collection.description ||
      `${collection.title} products`,
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const parent = parentCategories[params.collection];

  if (parent?.comingSoon) {
    return (
      <section className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-4 font-heading text-2xl tracking-wider text-brand-gold sm:text-3xl">
          {parent.title}
        </h2>
        <p className="text-sm text-brand-grey">coming soon</p>
      </section>
    );
  }

  if (parent) {
    const allProducts = (
      await Promise.all(
        parent.subcollections.map((sub) =>
          getCollectionProducts({ collection: sub, sortKey, reverse }),
        ),
      )
    ).flat();

    // Deduplicate by product id
    const seen = new Set<string>();
    const deduped = allProducts.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Re-sort the merged results since subcollection ordering is lost after merging
    let products = deduped;
    if (sortKey === "PRICE") {
      products = [...deduped].sort((a, b) => {
        const pa = parseFloat(a.priceRange.minVariantPrice.amount);
        const pb = parseFloat(b.priceRange.minVariantPrice.amount);
        return reverse ? pb - pa : pa - pb;
      });
    } else if (sortKey === "CREATED_AT") {
      products = [...deduped].sort((a, b) => {
        const da = new Date(a.updatedAt).getTime();
        const db = new Date(b.updatedAt).getTime();
        return reverse ? db - da : da - db;
      });
    }

    return (
      <section>
        {products.length === 0 ? (
          <p className="py-3 text-lg">{`No items found in this collection`}</p>
        ) : (
          <Grid className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
            <ProductGridItems products={products} />
          </Grid>
        )}
      </section>
    );
  }

  const products = await getCollectionProducts({
    collection: params.collection,
    sortKey,
    reverse,
  });

  return (
    <section>
      {products.length === 0 ? (
        <p className="py-3 text-lg">{`No items found in this collection`}</p>
      ) : (
        <Grid className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}
