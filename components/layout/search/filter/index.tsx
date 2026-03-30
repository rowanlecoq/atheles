"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { SortFilterItem } from "lib/constants";
import { Suspense, useState } from "react";
import FilterItemDropdown from "./dropdown";
import { FilterItem } from "./item";

export type ListItem = SortFilterItem | PathFilterItem;
export type PathFilterItem = { title: string; path: string };

function FilterItemList({ list }: { list: ListItem[] }) {
  return (
    <>
      {list.map((item: ListItem, i) => (
        <FilterItem key={i} item={item} />
      ))}
    </>
  );
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-brand-dark-gold/15 pb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-brand-pale-gold">
          {title}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-brand-grey transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <ul className="space-y-0.5 pb-1">
          {children}
        </ul>
      )}
    </div>
  );
}

export default function FilterList({
  list,
  title,
}: {
  list: ListItem[];
  title?: string;
}) {
  return (
    <nav>
      {/* Desktop: collapsible section */}
      <div className="hidden md:block">
        <CollapsibleSection title={title || "Filter"}>
          <Suspense fallback={null}>
            <FilterItemList list={list} />
          </Suspense>
        </CollapsibleSection>
      </div>

      {/* Mobile: dropdown */}
      <div className="md:hidden">
        <Suspense fallback={null}>
          <FilterItemDropdown list={list} />
        </Suspense>
      </div>
    </nav>
  );
}
