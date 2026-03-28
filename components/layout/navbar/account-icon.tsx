"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function AccountIcon() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const href = isLoggedIn ? "/profile" : "/login";
  const initials = isLoggedIn
    ? (session.user?.name || session.user?.email || "A")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <Link
      href={href}
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
  );
}
