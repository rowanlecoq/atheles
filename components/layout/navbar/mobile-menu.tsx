"use client";

import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useCallback, useEffect, useState } from "react";

import {
  Bars3Icon,
  ChevronDownIcon,
  HeartIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import LogoSquare from "components/logo-square";
import type { Menu } from "lib/shopify/types";
import Search, { SearchSkeleton } from "./search";

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
      { title: "Tees", path: "/search/t-shirts" },
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
          className="tap-target flex min-h-[44px] flex-1 items-center py-3 text-lg uppercase tracking-[0.12em] text-brand-grey transition-colors hover:text-brand-gold sm:text-xl sm:tracking-wider"
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
                  className="tap-target flex min-h-[40px] items-center py-2 text-sm uppercase tracking-[0.12em] text-brand-dark-gold transition-colors hover:text-brand-gold"
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

  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  const refreshSession = useCallback(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setLoggedIn(true);
          setUserName(data.user.name || data.user.firstName || "");
          // Show cached avatar instantly, refetch in background
          try {
            const cached = sessionStorage.getItem("atheles-avatar");
            if (cached) setAvatar(cached);
          } catch {}
          fetch("/api/auth/avatar")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.avatar) {
                setAvatar(d.avatar);
                try { sessionStorage.setItem("atheles-avatar", d.avatar); } catch {}
              } else setAvatar(null);
            })
            .catch(() => setAvatar(null));
        } else {
          setLoggedIn(false);
          setUserName("");
          setAvatar(null);
          try { sessionStorage.removeItem("atheles-avatar"); sessionStorage.removeItem("atheles-custom-bg"); } catch {}
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
    window.addEventListener("avatar-changed", handleAvatarChange);
    return () =>
      window.removeEventListener("avatar-changed", handleAvatarChange);
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
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          </Transition.Child>
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

                {/* Account, Favorites at top */}
                <div className="mb-5 border-b border-brand-dark-gold/20 pb-4">
                  <Link
                    href={loggedIn ? "/profile" : "/login"}
                    onClick={closeMobileMenu}
                    className="tap-target mb-1 flex min-h-[48px] items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-brand-dark-gold/10"
                  >
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full border border-brand-gold object-cover"
                      />
                    ) : loggedIn && initials ? (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-gold bg-brand-dark-gold/20 text-xs font-bold text-brand-gold">
                        {initials}
                      </span>
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-dark-gold/30 bg-brand-dark-gold/10">
                        <UserIcon className="h-5 w-5 text-brand-grey" />
                      </span>
                    )}
                    <div>
                      {loggedIn ? (
                        <>
                          <p className="text-base font-medium text-white">
                            {userName}
                          </p>
                          <p className="text-sm uppercase tracking-wider text-brand-dark-gold">
                            view profile
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-medium text-brand-pale-gold">
                            sign in
                          </p>
                          <p className="text-sm uppercase tracking-wider text-brand-dark-gold">
                            or create account
                          </p>
                        </>
                      )}
                    </div>
                  </Link>
                  <Link
                    href="/favorites"
                    onClick={closeMobileMenu}
                    className="tap-target flex min-h-[44px] items-center gap-3 rounded-lg px-2 py-2 text-base uppercase tracking-wider text-brand-grey transition-colors hover:bg-brand-dark-gold/10 hover:text-brand-gold"
                  >
                    <HeartIcon className="h-5 w-5" />
                    Favorites
                  </Link>
                </div>

                <div className="mb-6 w-full">
                  <Suspense fallback={<SearchSkeleton />}>
                    <Search />
                  </Suspense>
                </div>

                {/* Main nav links */}
                {menu.length ? (
                  <ul className="flex w-full flex-col">
                    {menu.map((item: Menu) => (
                      <li
                        className="border-b border-brand-dark-gold/10"
                        key={item.title}
                      >
                        <Link
                          href={item.path}
                          prefetch={true}
                          onClick={closeMobileMenu}
                          className="tap-target flex min-h-[44px] items-center py-3 text-lg uppercase tracking-[0.12em] text-brand-pale-gold transition-colors hover:text-brand-gold sm:text-xl sm:tracking-wider"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {/* Category links with expandable subcategories */}
                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-brand-dark-gold">
                    Categories
                  </p>
                  <ul className="flex w-full flex-col">
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
              </div>

              {/* Social at bottom */}
              <div className="mt-auto px-4 pb-4">
                <div className="border-t border-brand-dark-gold/20 pt-3">
                  <a
                    href="https://www.instagram.com/atheles.co/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target flex min-h-[44px] items-center gap-3 py-2 text-sm tracking-wider text-brand-grey transition-colors hover:text-brand-gold"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="5" />
                      <circle
                        cx="17.5"
                        cy="6.5"
                        r="1"
                        fill="currentColor"
                        stroke="none"
                      />
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
