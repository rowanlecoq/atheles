import CartModal from "components/cart/modal";
import { getMenu } from "lib/shopify";
import type { Menu } from "lib/shopify/types";
import { Suspense } from "react";
import { AccountIcon } from "./account-icon";
import { CategoryNav } from "./category-nav";
import { CountrySelector } from "./country-selector";
import { FavoritesIcon } from "./favorites-icon";
import { LogoLink } from "./logo-link";
import MobileMenu from "./mobile-menu";
import { SearchToggle } from "./search-toggle";

const fallbackMenu: Menu[] = [
  { title: "Home", path: "/" },
  { title: "Store", path: "/search" },
];

export async function Navbar() {
  const shopifyMenu = await getMenu("next-js-frontend-header-menu");
  const menu = shopifyMenu.length ? shopifyMenu : fallbackMenu;

  return (
    <div className="animate-nav-enter sticky top-0 z-50">
      <nav className="border-b border-brand-dark-gold/20 bg-brand-dark/95 px-4 py-2 backdrop-blur-sm transition-[background-color,border-color] duration-500 lg:px-6">
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
            <AccountIcon />
            <CartModal />
          </div>
        </div>
      </nav>
      <CategoryNav />
    </div>
  );
}
