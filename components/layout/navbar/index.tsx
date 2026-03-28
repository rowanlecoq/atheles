import CartModal from "components/cart/modal";
import { getMenu } from "lib/shopify";
import type { Menu } from "lib/shopify/types";
import { UserIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "auth";
import { CountrySelector } from "./country-selector";
import { FavoritesIcon } from "./favorites-icon";
import { LogoLink } from "./logo-link";
import MobileMenu from "./mobile-menu";
import { SearchToggle } from "./search-toggle";

const fallbackMenu: Menu[] = [
  { title: "Home", path: "/" },
  { title: "Shop", path: "/search" },
];

export async function Navbar() {
  const [shopifyMenu, session] = await Promise.all([
    getMenu("next-js-frontend-header-menu"),
    auth(),
  ]);
  const menu = shopifyMenu.length ? shopifyMenu : fallbackMenu;

  const isLoggedIn = !!session?.user;
  const accountHref = isLoggedIn ? "/profile" : "/login";
  const initials = isLoggedIn
    ? (session.user?.name || session.user?.email || "A")
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <nav className="animate-nav-enter sticky top-0 z-50 border-b border-brand-dark-gold/20 bg-brand-dark/95 px-4 py-2 backdrop-blur-sm transition-[background-color,border-color] duration-500 lg:px-6">
      <div className="flex items-center justify-between">
        {/* Left: Mobile hamburger | Desktop: Country + Favorites */}
        <div className="flex w-1/3 items-center gap-3">
          <div className="block flex-none md:hidden">
            <Suspense fallback={null}>
              <MobileMenu menu={menu} />
            </Suspense>
          </div>
          <CountrySelector />
          <div className="hidden md:block">
            <FavoritesIcon />
          </div>
        </div>

        {/* Center: Logo */}
        <div className="flex w-1/3 justify-center">
          <LogoLink />
        </div>

        {/* Right: Search + Account + Cart */}
        <div className="flex w-1/3 items-center justify-end gap-3">
          <SearchToggle />
          <Link
            href={accountHref}
            className="hidden h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold md:flex"
            aria-label="Account"
          >
            {isLoggedIn && initials ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-gold bg-brand-dark-gold/20 text-[10px] font-bold text-brand-gold">
                {initials}
              </span>
            ) : (
              <UserIcon className="h-5 w-5" />
            )}
          </Link>
          <CartModal />
        </div>
      </div>
    </nav>
  );
}
