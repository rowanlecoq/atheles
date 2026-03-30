import Footer from "components/layout/footer";
import Collections from "components/layout/search/collections";
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

      {/* Mobile filters */}
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pt-6 md:hidden">
        <div className="mb-6 flex items-center gap-4 border-b border-brand-dark-gold/10 pb-4">
          <Collections />
          <FilterList list={sorting} title="Sort by" />
        </div>
      </div>

      {/* Main content area */}
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-8 pt-8 text-white">
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
