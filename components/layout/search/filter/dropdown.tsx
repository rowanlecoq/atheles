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

  useEffect(() => {
    list.forEach((listItem: ListItem) => {
      if (
        ("path" in listItem && pathname === listItem.path) ||
        ("slug" in listItem && searchParams.get("sort") === listItem.slug)
      ) {
        setActive(listItem.title);
      }
    });
  }, [pathname, list, searchParams]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpenSelect(!openSelect);
        }}
        className="tap-target flex min-h-[44px] w-full items-center justify-between rounded-sm border border-brand-dark-gold/30 px-4 py-2.5 text-left text-sm text-white"
      >
        <div>{active}</div>
        <ChevronDownIcon className="h-4 text-brand-gold" />
      </button>
      {openSelect && (
        <div className="absolute z-40 mt-1 max-h-72 w-full overflow-auto rounded-b-md border border-brand-dark-gold/30 bg-brand-dark p-4 shadow-md">
          {list.map((item: ListItem) => (
            <FilterItem
              key={"path" in item ? item.path : item.slug || item.title}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}
