import { Suspense } from "react";

import { getCollections } from "lib/shopify";
import { CollectionFilter, MobileCollectionFilter } from "./filter";

async function CollectionList() {
  const collections = await getCollections();
  return <CollectionFilter list={collections} />;
}

async function MobileCollectionList() {
  const collections = await getCollections();
  return <MobileCollectionFilter list={collections} />;
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

export function MobileCollections() {
  return (
    <Suspense
      fallback={
        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded-full bg-brand-dark-gold/15" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-brand-dark-gold/15" />
          <div className="h-9 w-20 animate-pulse rounded-full bg-brand-dark-gold/15" />
        </div>
      }
    >
      <MobileCollectionList />
    </Suspense>
  );
}
