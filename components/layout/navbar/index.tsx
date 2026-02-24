import CartModal from "components/cart/modal";
import { getMenu } from "lib/shopify";
import type { Menu } from "lib/shopify/types";
import { UserIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Suspense } from "react";
import { LogoLink } from "./logo-link";
import MobileMenu from "./mobile-menu";
import Search, { SearchSkeleton } from "./search";

const fallbackMenu: Menu[] = [
  { title: "Home", path: "/" },
  { title: "Shop", path: "/search" },
  { title: "About", path: "/about" },
  { title: "Contact", path: "/contact" },
];

export async function Navbar() {
  const shopifyMenu = await getMenu("next-js-frontend-header-menu");
  const menu = shopifyMenu.length ? shopifyMenu : fallbackMenu;

  return (
    <nav className="animate-nav-enter sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-brand-dark-gold/20 bg-brand-dark/95 p-4 backdrop-blur-sm transition-[background-color,border-color] duration-500 lg:px-6">
      <div className="block flex-none md:hidden">
        <Suspense fallback={null}>
          <MobileMenu menu={menu} />
        </Suspense>
      </div>
      <div className="flex min-w-0 flex-1 items-center">
        <div className="flex min-w-0 flex-1 md:w-1/3">
          <LogoLink />
          {menu.length ? (
            <ul className="hidden gap-6 text-sm md:flex md:items-center">
              {menu.map((item: Menu) => (
                <li key={item.title}>
                  <Link
                    href={item.path}
                    prefetch={true}
                    className="uppercase tracking-wider text-brand-grey underline-offset-4 transition-colors hover:text-brand-gold"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="hidden justify-center md:flex md:w-1/3">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-3 md:w-1/3">
          <Link
            href="/login"
            className="flex h-11 w-11 items-center justify-center rounded-md border border-brand-dark-gold/30 text-brand-grey transition-colors hover:border-brand-gold hover:text-brand-gold"
            aria-label="Account"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
          <CartModal />
        </div>
      </div>
    </nav>
  );
}
