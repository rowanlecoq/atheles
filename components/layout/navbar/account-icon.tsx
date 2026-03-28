"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AccountIcon() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setLoggedIn(true);
          const name = data.user.name || data.user.email || "A";
          setInitials(
            name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      href={loggedIn ? "/profile" : "/login"}
      className="hidden h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold md:flex"
      aria-label="Account"
    >
      {loggedIn && initials ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-gold bg-brand-dark-gold/20 text-[10px] font-bold text-brand-gold">
          {initials}
        </span>
      ) : (
        <UserIcon className="h-5 w-5" />
      )}
    </Link>
  );
}
