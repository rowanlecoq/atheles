"use client";

import { Squares2X2Icon, ListBulletIcon } from "@heroicons/react/24/outline";
import { createUrl } from "lib/utils";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function ViewToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentView = searchParams.get("view") || "grid";

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "grid") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.replace(createUrl(pathname, params));
  };

  return (
    <div className="flex items-center gap-1 rounded border border-brand-dark-gold/30 p-1">
      <button
        type="button"
        onClick={() => setView("grid")}
        className={`tap-target flex h-11 w-11 items-center justify-center rounded transition-colors ${
          currentView === "grid"
            ? "bg-brand-gold text-brand-dark"
            : "text-brand-grey hover:text-brand-gold"
        }`}
        aria-label="Grid view"
      >
        <Squares2X2Icon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => setView("list")}
        className={`tap-target flex h-11 w-11 items-center justify-center rounded transition-colors ${
          currentView === "list"
            ? "bg-brand-gold text-brand-dark"
            : "text-brand-grey hover:text-brand-gold"
        }`}
        aria-label="List view"
      >
        <ListBulletIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
