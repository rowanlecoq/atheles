"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const accountNav = [
  { title: "general", path: "/account" },
  { title: "help & faq", path: "/account/order-help" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full flex-none md:w-48">
      <ul className="flex gap-2 md:flex-col md:gap-1">
        {accountNav.map((item) => {
          const active = pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`block rounded-lg px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-brand-gold/10 text-brand-gold"
                    : "border border-brand-dark-gold/20 text-brand-grey hover:border-brand-gold/40 hover:text-brand-gold"
                }`}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
