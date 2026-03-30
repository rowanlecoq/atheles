import { Suspense } from "react";

import { getCollections } from "lib/shopify";
import { CollectionFilter } from "./filter";

async function CollectionList() {
  const collections = await getCollections();
  return <CollectionFilter list={collections} />;
}

export default function Collections() {
  return (
    <Suspense
      fallback={
        <div className="py-4">
          <div className="mb-3 h-5 w-24 animate-pulse rounded bg-brand-dark-gold/30" />
          <div className="space-y-2">
            <div className="h-10 w-full animate-pulse rounded-lg bg-brand-dark-gold/15" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-brand-dark-gold/15" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-brand-dark-gold/15" />
          </div>
        </div>
      }
    >
      <CollectionList />
    </Suspense>
  );
}
