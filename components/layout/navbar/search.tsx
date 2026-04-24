"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Form from "next/form";
import { useSearchParams } from "next/navigation";

export default function Search() {
  const searchParams = useSearchParams();

  return (
    <Form
      action="/search"
      className="relative w-full max-w-[550px] lg:w-80 xl:w-full"
    >
      <input
        key={searchParams?.get("q")}
        type="text"
        name="q"
        placeholder="search for items"
        autoComplete="off"
        defaultValue={searchParams?.get("q") || ""}
        className="tap-target min-h-[44px] w-full rounded-lg border border-brand-dark-gold/40 bg-brand-dark px-4 py-2.5 pr-10 text-[16px] text-white placeholder:text-brand-grey md:text-sm"
      />
      <div className="pointer-events-none absolute right-0 top-0 mr-3 flex h-full items-center">
        <MagnifyingGlassIcon className="h-4 text-brand-gold" />
      </div>
    </Form>
  );
}

export function SearchSkeleton() {
  return (
    <form className="relative w-full max-w-[550px] lg:w-80 xl:w-full">
      <input
        placeholder="search for items"
        className="tap-target min-h-[44px] w-full rounded-lg border border-brand-dark-gold/40 bg-brand-dark px-4 py-2.5 pr-10 text-[16px] text-white placeholder:text-brand-grey md:text-sm"
      />
      <div className="pointer-events-none absolute right-0 top-0 mr-3 flex h-full items-center">
        <MagnifyingGlassIcon className="h-4 text-brand-gold" />
      </div>
    </form>
  );
}
