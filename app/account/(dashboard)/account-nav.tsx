"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const accountNav = [
  { title: "orders", path: "/account" },
  { title: "help", path: "/account/order-help" },
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
                    ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"
                    : "bg-white/[0.06] border border-white/[0.08] text-brand-grey hover:bg-white/[0.09] hover:text-white"
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
