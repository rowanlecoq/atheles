"use client";

import clsx from "clsx";
import type { SortFilterItem as SortFilterItemType } from "lib/constants";
import { createUrl } from "lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ListItem, PathFilterItem as PathFilterItemType } from ".";

function PathFilterListItem({ item }: { item: PathFilterItemType }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? "p" : Link;

  newParams.delete("q");

  return (
    <li key={item.title}>
      <DynamicTag
        href={createUrl(item.path, newParams)}
        className={clsx(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
          active
            ? "bg-brand-gold/10 text-brand-gold"
            : "text-white hover:bg-brand-dark-gold/10 hover:text-brand-gold",
        )}
      >
        {/* Radio dot */}
        <span
          className={clsx(
            "flex h-4 w-4 flex-none items-center justify-center rounded-full border",
            active
              ? "border-brand-gold"
              : "border-brand-dark-gold/40",
          )}
        >
          {active && <span className="h-2 w-2 rounded-full bg-brand-gold" />}
        </span>
        {item.title}
      </DynamicTag>
    </li>
  );
}

function SortFilterListItem({ item }: { item: SortFilterItemType }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("sort") === item.slug;
  const q = searchParams.get("q");
  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(item.slug?.length ? { sort: item.slug } : {}),
    }),
  );
  const DynamicTag = active ? "p" : Link;

  return (
    <li key={item.title}>
      <DynamicTag
        prefetch={!active ? false : undefined}
        href={href}
        className={clsx(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
          active
            ? "bg-brand-gold/10 text-brand-gold"
            : "text-white hover:bg-brand-dark-gold/10 hover:text-brand-gold",
        )}
      >
        {/* Radio dot */}
        <span
          className={clsx(
            "flex h-4 w-4 flex-none items-center justify-center rounded-full border",
            active
              ? "border-brand-gold"
              : "border-brand-dark-gold/40",
          )}
        >
          {active && <span className="h-2 w-2 rounded-full bg-brand-gold" />}
        </span>
        {item.title}
      </DynamicTag>
    </li>
  );
}

export function FilterItem({ item }: { item: ListItem }) {
  return "path" in item ? (
    <PathFilterListItem item={item} />
  ) : (
    <SortFilterListItem item={item} />
  );
}
