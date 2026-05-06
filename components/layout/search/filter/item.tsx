"use client";

import clsx from "clsx";
import type { SortFilterItem as SortFilterItemType } from "lib/constants";
import { createUrl } from "lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ListItem, PathFilterItem as PathFilterItemType } from ".";

type ItemProps = { onSelect?: (slug?: string) => void; optimisticSlug?: string | null };

function PathFilterListItem({ item, onSelect }: { item: PathFilterItemType } & ItemProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? "p" : Link;

  newParams.delete("q");

  return (
    <li>
      <DynamicTag
        href={createUrl(item.path, newParams)}
        onClick={() => onSelect?.()}
        className={clsx(
          "flex w-full items-center gap-2.5 whitespace-nowrap lowercase rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? "bg-brand-gold/10 text-brand-gold"
            : "text-white hover:bg-brand-dark-gold/10 hover:text-brand-gold",
        )}
      >
        <span className={clsx("flex h-4 w-4 flex-none items-center justify-center rounded-full border", active ? "border-brand-gold" : "border-brand-dark-gold/40")}>
          {active && <span className="h-2 w-2 rounded-full bg-brand-gold" />}
        </span>
        {item.title}
      </DynamicTag>
    </li>
  );
}

function SortFilterListItem({ item, onSelect, optimisticSlug }: { item: SortFilterItemType } & ItemProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const realActive = (searchParams.get("sort") || "") === (item.slug || "");
  // Show as active immediately when optimistically selected
  const active = optimisticSlug !== null && optimisticSlug !== undefined
    ? (item.slug || "") === optimisticSlug
    : realActive;
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
    <li>
      <DynamicTag
        href={href}
        onClick={() => onSelect?.(item.slug || "")}
        className={clsx(
          "flex w-full items-center gap-2.5 whitespace-nowrap lowercase rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? "bg-brand-gold/10 text-brand-gold"
            : "text-white hover:bg-brand-dark-gold/10 hover:text-brand-gold",
        )}
      >
        <span className={clsx("flex h-4 w-4 flex-none items-center justify-center rounded-full border", active ? "border-brand-gold" : "border-brand-dark-gold/40")}>
          {active && <span className="h-2 w-2 rounded-full bg-brand-gold" />}
        </span>
        {item.title}
      </DynamicTag>
    </li>
  );
}

export function FilterItem({ item, onSelect, optimisticSlug }: { item: ListItem } & ItemProps) {
  return "path" in item ? (
    <PathFilterListItem item={item} onSelect={onSelect} />
  ) : (
    <SortFilterListItem item={item} onSelect={onSelect} optimisticSlug={optimisticSlug} />
  );
}
