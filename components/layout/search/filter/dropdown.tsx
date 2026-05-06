"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { ListItem } from ".";
import { FilterItem } from "./item";

export default function FilterItemDropdown({ list }: { list: ListItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState("");
  const [openSelect, setOpenSelect] = useState(false);
  const [optimisticSlug, setOptimisticSlug] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenSelect(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Sync real active label from URL
  useEffect(() => {
    list.forEach((listItem: ListItem) => {
      if (
        ("path" in listItem && pathname === listItem.path) ||
        ("slug" in listItem && (searchParams.get("sort") || "") === (listItem.slug || ""))
      ) {
        setActive(listItem.title);
      }
    });
    // Navigation complete — clear optimistic state
    setOptimisticSlug(null);
    setOpenSelect(false);
  }, [pathname, list, searchParams]);

  const displayLabel = optimisticSlug !== null
    ? (list.find(item => "slug" in item && (item.slug || "") === optimisticSlug)?.title ?? active)
    : active;

  return (
    <div className="relative flex-none" ref={ref}>
      <button
        type="button"
        onClick={() => setOpenSelect(!openSelect)}
        className="tap-target flex min-h-[40px] items-center gap-1.5 rounded-full border border-brand-dark-gold/30 px-3.5 py-2 text-left text-sm text-white"
      >
        <div className="lowercase whitespace-nowrap">{displayLabel || "relevance"}</div>
        <ChevronDownIcon className={`h-3.5 w-3.5 flex-none text-brand-gold transition-transform duration-200 ${openSelect ? "rotate-180" : ""}`} />
      </button>
      {openSelect && (
        <ul className="absolute right-0 z-40 mt-1 min-w-[220px] list-none overflow-auto rounded-lg border border-brand-dark-gold/30 bg-brand-dark p-2 shadow-lg">
          {list.map((item: ListItem) => (
            <FilterItem
              key={"path" in item ? item.path : item.slug || item.title}
              item={item}
              optimisticSlug={optimisticSlug}
              onSelect={(slug) => {
                setOptimisticSlug(slug ?? null);
                setOpenSelect(false);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
