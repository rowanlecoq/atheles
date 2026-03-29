import Footer from "components/layout/footer";
import Collections from "components/layout/search/collections";
import FilterList from "components/layout/search/filter";
import ViewToggle from "components/layout/search/filter/view-toggle";
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

      {/* Toolbar: filters + view toggle */}
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pt-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-brand-dark-gold/10 pb-4">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <Collections />
            </div>
            <div className="md:hidden">
              <FilterList list={sorting} title="Sort by" />
            </div>
          </div>
          <Suspense fallback={null}>
            <ViewToggle />
          </Suspense>
        </div>
      </div>

      {/* Main content area */}
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-8 text-white">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[160px_1fr_160px]">
          {/* Desktop sidebar: collections */}
          <div className="hidden md:block">
            <div className="sticky top-20">
              <Collections />
            </div>
          </div>

          {/* Products */}
          <div className="min-h-[60vh]">
            <Suspense fallback={null}>
              <ChildrenWrapper>{children}</ChildrenWrapper>
            </Suspense>
          </div>

          {/* Desktop sidebar: sort */}
          <div className="hidden md:block">
            <div className="sticky top-20">
              <FilterList list={sorting} title="Sort by" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
