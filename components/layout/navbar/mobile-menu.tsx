"use client";

import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useState } from "react";

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import LogoSquare from "components/logo-square";
import type { Menu } from "lib/shopify/types";
import Search, { SearchSkeleton } from "./search";

export default function MobileMenu({ menu }: { menu: Menu[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;
  const [isOpen, setIsOpen] = useState(false);
  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

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

  return (
    <>
      <button
        type="button"
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        className="flex h-11 w-11 items-center justify-center rounded-md border border-brand-dark-gold/30 text-brand-grey transition-colors hover:text-brand-gold md:hidden"
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
            <Dialog.Panel className="fixed bottom-0 left-0 right-0 top-0 flex h-full w-full flex-col bg-brand-dark pb-6">
              <div className="p-4">
                <div className="mb-6 flex items-center justify-between">
                  <LogoSquare size="sm" />
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-md border border-brand-dark-gold/30 text-brand-grey transition-colors hover:text-brand-gold"
                    onClick={closeMobileMenu}
                    aria-label="Close mobile menu"
                  >
                    <XMarkIcon className="h-6" />
                  </button>
                </div>

                <div className="mb-6 w-full">
                  <Suspense fallback={<SearchSkeleton />}>
                    <Search />
                  </Suspense>
                </div>
                {menu.length ? (
                  <ul className="flex w-full flex-col">
                    {menu.map((item: Menu) => (
                      <li className="border-b border-brand-dark-gold/10" key={item.title}>
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
              </div>

              {/* Social links at bottom */}
              <div className="mt-auto px-4 pb-4">
                <div className="flex items-center gap-4 border-t border-brand-dark-gold/20 pt-4">
                  <a
                    href="https://www.instagram.com/atheles.co/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target inline-flex min-h-[44px] items-center text-sm uppercase tracking-wider text-brand-grey transition-colors hover:text-brand-gold"
                  >
                    Instagram
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
