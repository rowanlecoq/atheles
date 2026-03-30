import Footer from "components/layout/footer";
import Collections, { MobileCollections } from "components/layout/search/collections";
import FilterList from "components/layout/search/filter";
import { ClearFilters } from "components/layout/search/clear-filters";
import SearchPageHeader from "components/layout/search/page-header";
import { sorting } from "lib/constants";
import ChildrenWrapper from "./children-wrapper";
import { Suspense } from "react";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Page header */}
      <Suspense fallback={null}>
        <SearchPageHeader />
      </Suspense>

      {/* Mobile filters — compact horizontal pills + sort dropdown */}
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pt-4 md:hidden">
        <div className="mb-2">
          <MobileCollections />
        </div>
        <div className="mb-4 flex items-center justify-between border-b border-brand-dark-gold/10 pb-3">
          <Suspense fallback={null}>
            <ClearFilters />
          </Suspense>
          <FilterList list={sorting} title="Sort by" />
        </div>
      </div>

      {/* Main content area */}
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-8 pt-4 text-white md:pt-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[180px_1fr]">
          {/* Desktop sidebar: filter & sort */}
          <div className="hidden md:block">
            <div className="sticky top-20 pr-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wider text-brand-pale-gold">
                  filter & sort
                </h2>
                <Suspense fallback={null}>
                  <ClearFilters />
                </Suspense>
              </div>
              <Collections />
              <FilterList list={sorting} title="Sort by" />
            </div>
          </div>

          {/* Products */}
          <div className="min-h-[60vh]">
            <Suspense fallback={null}>
              <ChildrenWrapper>{children}</ChildrenWrapper>
            </Suspense>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
