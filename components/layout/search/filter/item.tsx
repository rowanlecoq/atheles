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
    <li className="mt-1 flex text-white" key={item.title}>
      <DynamicTag
        href={createUrl(item.path, newParams)}
        className={clsx(
          "tap-target inline-flex min-h-[44px] w-full items-center py-2 text-sm underline-offset-4 hover:text-brand-gold hover:underline",
          {
            "text-brand-gold underline underline-offset-4": active,
          },
        )}
      >
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
    <li className="mt-1 flex text-sm text-white" key={item.title}>
      <DynamicTag
        prefetch={!active ? false : undefined}
        href={href}
        className={clsx(
          "tap-target inline-flex min-h-[44px] w-full items-center py-2 hover:text-brand-gold hover:underline hover:underline-offset-4",
          {
            "text-brand-gold underline underline-offset-4": active,
          },
        )}
      >
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
