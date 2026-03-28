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
    title: "Mens",
    description: "Shop all mens athletic wear.",
    subcollections: ["compressions", "t-shirts", "sweatpants"],
  },
  womens: {
    title: "Womens",
    description: "Shop all womens athletic wear.",
    comingSoon: true,
    subcollections: [],
  },
  accessories: {
    title: "Accessories",
    description: "Shop all accessories.",
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
          getCollectionProducts({ collection: sub, sortKey, reverse })
        )
      )
    ).flat();

    // Deduplicate by product id
    const seen = new Set<string>();
    const products = allProducts.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    return (
      <section>
        {products.length === 0 ? (
          <p className="py-3 text-lg">{`No products found in this collection`}</p>
        ) : (
          <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
        <p className="py-3 text-lg">{`No products found in this collection`}</p>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}
