"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function ClearFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Show "clear all" if we're on a collection page or have sort params
  const isFiltered = pathname !== "/search" || searchParams.has("sort");

  if (!isFiltered) return null;

  return (
    <Link
      href="/search"
      className="text-xs text-brand-grey transition-colors hover:text-brand-gold"
    >
      clear all
    </Link>
  );
}
