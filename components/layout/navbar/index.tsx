import CartModal from "components/cart/modal";
import { WavyDivider } from "components/wavy-divider";
import { getMenu } from "lib/shopify";
import type { Menu } from "lib/shopify/types";
import { Suspense } from "react";
import { AccountIcon } from "./account-icon";
import { AdminIcon } from "./admin-icon";
import { CategoryNav } from "./category-nav";
import { CountrySelector } from "./country-selector";
import { FavoritesIcon } from "./favorites-icon";
import { LogoLink } from "./logo-link";
import MobileMenu from "./mobile-menu";
import { NavbarShell } from "./navbar-shell";
import { SearchToggle } from "./search-toggle";

const fallbackMenu: Menu[] = [
  { title: "Home", path: "/" },
  { title: "Store", path: "/search" },
];

export async function Navbar() {
  const shopifyMenu = await getMenu("next-js-frontend-header-menu");
  const menu = shopifyMenu.length ? shopifyMenu : fallbackMenu;

  return (
    <NavbarShell>
      <nav className="relative z-10 bg-brand-dark/95 px-4 py-2 backdrop-blur-sm lg:px-6 will-change-transform">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Mobile hamburger + Favorites | Desktop: Country + Favorites */}
          <div className="flex items-center gap-1">
            <div className="block flex-none md:hidden">
              <Suspense fallback={null}>
                <MobileMenu menu={menu} />
              </Suspense>
            </div>
            <div className="block md:hidden">
              <FavoritesIcon />
            </div>
            <CountrySelector />
            <div className="hidden md:block">
              <FavoritesIcon />
            </div>
          </div>

          {/* Center: Logo */}
          <div className="flex justify-center">
            <LogoLink />
          </div>

          {/* Right: Search + Account + Cart */}
          <div className="flex items-center justify-end gap-3">
            <SearchToggle />
            <AdminIcon />
            <AccountIcon />
            <CartModal />
          </div>
        </div>
        <WavyDivider className="absolute inset-x-0 bottom-0" />
      </nav>
      <CategoryNav />
    </NavbarShell>
  );
}
