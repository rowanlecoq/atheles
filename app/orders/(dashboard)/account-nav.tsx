"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const accountNav = [
  { title: "orders", path: "/orders" },
  { title: "help", path: "/orders/order-help" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full flex-none md:w-48">
      <ul className="flex gap-2 md:flex-col md:gap-2">
        {accountNav.map((item) => {
          const active = pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`block rounded-lg px-4 py-3 text-sm transition-colors ${
                  active
                    ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"
                    : "bg-brand-dark border border-white/[0.08] text-brand-grey hover:text-brand-gold"
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
