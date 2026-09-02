import { FadeIn } from "components/animations/fade-in";
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
      <SearchPageHeader />

      {/* Mobile filters */}
      <FadeIn direction="up" duration={0.3} className="relative z-20">
        <div className="mx-auto max-w-(--breakpoint-2xl) pt-4 md:hidden">
          <div className="mb-2">
            <MobileCollections />
          </div>
          <div className="mb-4 flex items-center justify-end gap-3 border-b border-brand-dark-gold/20 px-4 pb-3">
            <Suspense fallback={null}>
              <ClearFilters />
            </Suspense>
            <FilterList list={sorting} title="Sort by" />
          </div>
        </div>
      </FadeIn>

      {/* Main content area */}
      <div className="search-page-bg mx-auto max-w-(--breakpoint-2xl) px-4 pb-8 pt-4 text-white md:pt-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[200px_1fr]">
          {/* Desktop sidebar */}
          <FadeIn direction="up" duration={0.3}>
            <div className="relative z-10 hidden md:block">
              <div className="sticky top-20 pr-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-medium lowercase text-brand-pale-gold">
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
          </FadeIn>

          {/* Products */}
          <FadeIn direction="up" delay={0.08} duration={0.35}>
            <div className="min-h-[60vh]">
              <Suspense fallback={null}>
                <ChildrenWrapper>{children}</ChildrenWrapper>
              </Suspense>
            </div>
          </FadeIn>
        </div>
      </div>
      <Footer />
    </>
  );
}
