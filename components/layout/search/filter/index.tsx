"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { SortFilterItem } from "lib/constants";
import { createUrl } from "lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import FilterItemDropdown from "./dropdown";
import { FilterItem } from "./item";

export type ListItem = SortFilterItem | PathFilterItem;
export type PathFilterItem = { title: string; path: string };

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
    <div className="py-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-medium lowercase tracking-wider text-brand-pale-gold">
          {title}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-brand-grey transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div className="mt-1 h-px bg-brand-dark-gold/15" />
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "mt-4 max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function CollectionFilter({ list }: { list: ListItem[] }) {
  return (
    <CollapsibleSection title="Collections">
      <div className="space-y-2">
        <Suspense fallback={null}>
          {list.map((item, i) => (
            "path" in item ? <CollectionPill key={i} item={item} /> : null
          ))}
        </Suspense>
      </div>
    </CollapsibleSection>
  );
}

export function SortFilter({ list, title }: { list: ListItem[]; title?: string }) {
  const searchParams = useSearchParams();
  const [optimisticSlug, setOptimisticSlug] = useState<string | null>(null);

  // Reset when navigation settles
  useEffect(() => {
    setOptimisticSlug(null);
  }, [searchParams]);

  return (
    <CollapsibleSection title={title || "Sort By"}>
      <ul className="space-y-1">
        <Suspense fallback={null}>
          {list.map((item: ListItem, i) => (
            <FilterItem
              key={i}
              item={item}
              optimisticSlug={optimisticSlug}
              onSelect={(slug) => setOptimisticSlug(slug ?? null)}
            />
          ))}
        </Suspense>
      </ul>
    </CollapsibleSection>
  );
}

// Keep default export for backwards compat with mobile dropdown
export default function FilterList({
  list,
  title,
}: {
  list: ListItem[];
  title?: string;
}) {
  return (
    <nav>
      <div className="hidden md:block">
        <SortFilter list={list} title={title} />
      </div>
      <div className="md:hidden">
        <Suspense fallback={null}>
          <FilterItemDropdown list={list} />
        </Suspense>
      </div>
    </nav>
  );
}

// Collection pill button
function CollectionPill({ item }: { item: PathFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? "p" : Link;

  newParams.delete("q");

  return (
    <DynamicTag
      href={createUrl(item.path, newParams)}
      className={clsx(
        "block w-full rounded-lg border px-4 py-2.5 text-center text-sm transition-all",
        active
          ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
          : "border-brand-dark-gold/25 text-white hover:border-brand-gold/50 hover:text-brand-gold",
      )}
    >
      {item.title}
    </DynamicTag>
  );
}

// Mobile horizontal scrolling collection pills
export function MobileCollectionFilter({ list }: { list: ListItem[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
      <Suspense fallback={null}>
        {list.map((item, i) =>
          "path" in item ? <MobileCollectionPill key={i} item={item} /> : null,
        )}
      </Suspense>
    </div>
  );
}

function MobileCollectionPill({ item }: { item: PathFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? "p" : Link;

  newParams.delete("q");

  return (
    <DynamicTag
      href={createUrl(item.path, newParams)}
      className={clsx(
        "flex-none whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-all",
        active
          ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
          : "border-brand-dark-gold/25 text-white hover:border-brand-gold/50 hover:text-brand-gold",
      )}
    >
      {item.title}
    </DynamicTag>
  );
}
