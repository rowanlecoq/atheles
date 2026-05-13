"use client";

import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";

import {
  Bars3Icon,
  ChevronDownIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import LogoSquare from "components/logo-square";
import { fetchSession } from "lib/session-cache";
import type { Menu } from "lib/shopify/types";

const TIER_BAR_GRADIENTS: Record<string, string> = {
  BRONZE: "from-amber-900 via-amber-700 to-amber-500",
  SILVER: "from-gray-500 via-gray-400 to-gray-300",
  GOLD: "from-yellow-700 via-yellow-500 to-amber-300",
  PLATINUM: "from-cyan-700 via-cyan-400 to-cyan-200",
  CHAMPION: "from-fuchsia-700 via-purple-500 to-amber-400",
  ADMIN: "from-red-500 via-orange-400 to-amber-300",
  ATHLETE: "from-sky-400 via-teal-300 to-amber-300",
};

const TIER_THRESHOLDS: Record<string, { min: number; max: number; next: string | null }> = {
  BRONZE:   { min: 0,     max: 5000,    next: "SILVER" },
  SILVER:   { min: 5000,  max: 15000,   next: "GOLD" },
  GOLD:     { min: 15000, max: 30000,   next: "PLATINUM" },
  PLATINUM: { min: 30000, max: 50000,   next: "CHAMPION" },
  CHAMPION: { min: 50000, max: Infinity, next: null },
  ATHLETE:  { min: 0,     max: Infinity, next: null },
  ADMIN:    { min: 0,     max: Infinity, next: null },
};
const TIER_GRADIENTS: Record<string, string> = {
  BRONZE: "from-amber-500 via-amber-400 to-yellow-300",
  SILVER: "from-gray-300 via-gray-200 to-white",
  GOLD: "from-yellow-400 via-yellow-300 to-amber-200",
  PLATINUM: "from-cyan-300 via-cyan-200 to-white",
  CHAMPION: "from-fuchsia-300 via-purple-300 to-amber-200",
  ADMIN: "from-red-400 via-orange-300 to-amber-200",
  ATHLETE: "from-sky-300 via-teal-200 to-amber-200",
};

type CategoryLink = {
  title: string;
  path: string;
  comingSoon?: boolean;
  subcategories?: { title: string; path: string }[];
};

const categoryLinks: CategoryLink[] = [
  {
    title: "Mens",
    path: "/search/mens",
    subcategories: [
      { title: "Compressions", path: "/search/compressions" },
      { title: "Tees", path: "/search/tees" },
      { title: "Sweatpants", path: "/search/sweatpants" },
    ],
  },
  {
    title: "Womens",
    path: "/search/womens",
    comingSoon: true,
  },
  {
    title: "Accessories",
    path: "/search/accessories",
    comingSoon: true,
  },
];

function CategoryItem({
  item,
  onNavigate,
  isLast,
}: {
  item: CategoryLink;
  onNavigate: () => void;
  isLast?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSubs = item.subcategories && item.subcategories.length > 0;

  return (
    <li className={isLast ? "" : "border-b border-brand-dark-gold/10"}>
      <div className="flex items-center">
        <Link
          href={item.path}
          onClick={onNavigate}
          className="tap-target flex min-h-[52px] flex-1 items-center py-4 text-xl uppercase tracking-[0.12em] text-brand-grey transition-colors hover:text-brand-gold"
        >
          {item.title}
          {item.comingSoon && (
            <span className="ml-2 text-xs italic tracking-wide text-brand-dark-gold">
              Soon
            </span>
          )}
        </Link>
        {hasSubs && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-11 w-11 items-center justify-center text-brand-dark-gold transition-colors hover:text-brand-gold"
            aria-label={
              expanded ? "Collapse subcategories" : "Expand subcategories"
            }
          >
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
      {hasSubs && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <ul className="pb-2 pl-4">
            {item.subcategories!.map((sub) => (
              <li key={sub.title}>
                <Link
                  href={sub.path}
                  onClick={onNavigate}
                  className="tap-target flex min-h-[44px] items-center py-2 text-sm uppercase tracking-[0.12em] text-brand-dark-gold transition-colors hover:text-brand-gold"
                >
                  {sub.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export default function MobileMenu({ menu }: { menu: Menu[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;
  const [isOpen, setIsOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [tierLabel, setTierLabel] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);

  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  // Show cached avatar instantly before session loads
  useEffect(() => {
    if (!document.cookie.includes("atheles-logged-in=1")) return;
    try {
      const cached = localStorage.getItem("atheles-session");
      if (cached) {
        const u = JSON.parse(cached);
        setLoggedIn(true);
        setUserName(u.name || u.firstName || "");
        const av = localStorage.getItem(`atheles-avatar-${u.email}`);
        if (av) setAvatar(av);
      }
    } catch {}
  }, []);

  const refreshSession = useCallback(() => {
    fetchSession()
      .then((data) => {
        if ((data as { user?: unknown } | null)?.user) {
          const user = (data as { user: Record<string, string> }).user;
          setLoggedIn(true);
          setUserName(user.name || user.firstName || "");
          const pts = Math.floor(parseFloat(user.totalSpent || "0") * 50);
          const label = user.isAdmin === "true" || user.isAdmin === true as unknown as string
            ? "ADMIN"
            : user.isAthlete === "true" || user.isAthlete === true as unknown as string
            ? "ATHLETE"
            : pts >= 50000 ? "CHAMPION"
            : pts >= 30000 ? "PLATINUM"
            : pts >= 15000 ? "GOLD"
            : pts >= 5000 ? "SILVER"
            : "BRONZE";
          setTierLabel(label);
          setLoyaltyPoints(pts);
          // Per-user avatar cache
          const avatarKey = `atheles-avatar-${user.email}`;
          try {
            const cached = localStorage.getItem(avatarKey);
            if (cached) setAvatar(cached);
          } catch {}
          fetch("/api/auth/avatar")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.avatar) {
                setAvatar(d.avatar);
                try { localStorage.setItem(avatarKey, d.avatar); } catch {}
              } else setAvatar(null);
            })
            .catch(() => setAvatar(null));
        } else {
          setLoggedIn(false);
          setUserName("");
          setAvatar(null);
          setTierLabel("");
          setLoyaltyPoints(null);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshSession();
  }, [pathname, refreshSession]);

  useEffect(() => {
    const handleAvatarChange = () => {
      fetch("/api/auth/avatar")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.avatar) setAvatar(d.avatar);
          else setAvatar(null);
        })
        .catch(() => {});
    };
    const handleLogout = () => {
      setLoggedIn(false);
      setUserName("");
      setAvatar(null);
    };
    window.addEventListener("avatar-changed", handleAvatarChange);
    window.addEventListener("user-logout", handleLogout);
    return () => {
      window.removeEventListener("avatar-changed", handleAvatarChange);
      window.removeEventListener("user-logout", handleLogout);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (routeKey) {
      setIsOpen(false);
    }
  }, [routeKey]);

  const initials = userName
    ? userName
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <>
      <button
        type="button"
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        className="flex h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold md:hidden"
      >
        <Bars3Icon className="h-5" />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeMobileMenu} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-[-100%]"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-[-100%]"
          >
            <Dialog.Panel className="fixed bottom-0 left-0 right-0 top-0 flex h-full w-full flex-col overflow-y-auto bg-brand-dark pb-6">
              <div className="p-4">
                <div className="mb-6 flex items-center justify-between">
                  <LogoSquare size="sm" />
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold"
                    onClick={closeMobileMenu}
                    aria-label="Close mobile menu"
                  >
                    <XMarkIcon className="h-6" />
                  </button>
                </div>

                {/* Account at top */}
                <div className="mb-5 border-b border-brand-dark-gold/20 pb-4">
                  <Link
                    href={loggedIn ? "/profile" : "/login"}
                    onClick={closeMobileMenu}
                    className="tap-target flex min-h-[52px] items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-brand-dark-gold/10"
                  >
                    {avatar ? (
                      <div className="relative h-10 w-10 flex-none overflow-hidden rounded-full" style={{ clipPath: "circle(50%)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatar} alt="Profile" width={40} height={40} className="absolute inset-0 h-full w-full scale-[1.02] object-cover" />
                      </div>
                    ) : loggedIn && initials ? (
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-dark-gold/20 text-sm font-bold text-brand-gold">
                        {initials}
                      </span>
                    ) : (
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-brand-dark-gold/30 bg-brand-dark-gold/10">
                        <UserIcon className="h-5 w-5 text-brand-grey" />
                      </span>
                    )}
                    <div>
                      {loggedIn ? (
                        <>
                          {tierLabel && (
                            <p className={`bg-gradient-to-r ${TIER_GRADIENTS[tierLabel] ?? ""} bg-clip-text text-[10px] uppercase tracking-[0.18em] text-transparent`}>
                              {tierLabel}
                            </p>
                          )}
                          <p className="text-base font-medium text-white">
                            {userName}
                          </p>
                          <p className="text-xs uppercase tracking-wider text-brand-dark-gold">
                            view profile
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-medium text-brand-pale-gold">
                            sign in
                          </p>
                          <p className="text-xs uppercase tracking-wider text-brand-dark-gold">
                            or create account
                          </p>
                        </>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Unified nav list — Shopify menu items + categories together */}
                <ul className="flex w-full flex-col">
                  {menu.map((item: Menu) => (
                    <li className="border-b border-brand-dark-gold/10" key={item.title}>
                      <Link
                        href={item.path}
                        prefetch={true}
                        onClick={closeMobileMenu}
                        className="tap-target flex min-h-[52px] items-center py-4 text-xl uppercase tracking-[0.12em] text-brand-pale-gold transition-colors hover:text-brand-gold"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                  {categoryLinks.map((item, idx) => (
                    <CategoryItem
                      key={item.title}
                      item={item}
                      onNavigate={closeMobileMenu}
                      isLast={idx === categoryLinks.length - 1}
                    />
                  ))}
                </ul>
              </div>

              {/* Loyalty card + socials */}
              <div className="px-4 pb-4 pt-6">
                {loggedIn && loyaltyPoints !== null && tierLabel && (() => {
                  const thresh = TIER_THRESHOLDS[tierLabel];
                  const barGradient = TIER_BAR_GRADIENTS[tierLabel] ?? "from-brand-gold to-brand-pale-gold";
                  const pct = thresh && thresh.max !== Infinity
                    ? Math.min(100, Math.round(((loyaltyPoints - thresh.min) / (thresh.max - thresh.min)) * 100))
                    : 100;
                  const ptsToNext = thresh?.next && thresh.max !== Infinity
                    ? Math.max(0, thresh.max - loyaltyPoints)
                    : null;
                  return (
                    <Link
                      href="/profile"
                      onClick={closeMobileMenu}
                      className="mb-5 block rounded-xl border border-brand-dark-gold/20 bg-brand-dark-gold/5 px-4 py-3 transition-colors hover:border-brand-dark-gold/40"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`bg-gradient-to-r ${TIER_GRADIENTS[tierLabel] ?? ""} bg-clip-text text-[10px] font-semibold uppercase tracking-[0.2em] text-transparent`}>
                          {tierLabel}
                        </span>
                        <span className="text-sm font-semibold text-brand-pale-gold">
                          {loyaltyPoints.toLocaleString()} pts
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-dark-gold/20">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {ptsToNext !== null && (
                        <p className="mt-1.5 text-right text-[10px] text-brand-dark-gold">
                          {ptsToNext.toLocaleString()} pts to {thresh!.next}
                        </p>
                      )}
                    </Link>
                  );
                })()}
                <div className="border-t border-brand-dark-gold/20 pt-3">
                  <a
                    href="https://www.instagram.com/atheles.co/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target flex min-h-[44px] items-center gap-3 py-2 text-sm tracking-wider text-brand-grey transition-colors hover:text-brand-gold"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="5" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                    @ATHELES.CO
                  </a>
                  <a
                    href="https://www.tiktok.com/@atheles.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target flex min-h-[44px] items-center gap-3 py-2 text-sm tracking-wider text-brand-grey transition-colors hover:text-brand-gold"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.12a8.16 8.16 0 0 0 4.83 1.55V7.22a4.85 4.85 0 0 1-1.06-.53z" />
                    </svg>
                    @ATHELES.CO
                  </a>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
