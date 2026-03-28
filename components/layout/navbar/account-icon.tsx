"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import { useAuth } from "components/auth-context";
import Image from "next/image";
import Link from "next/link";

export function AccountIcon() {
  const { user } = useAuth();

  return (
    <Link
      href={user ? "/profile" : "/login"}
      className="hidden h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold md:flex"
      aria-label="Account"
    >
      {user?.photoURL ? (
        <Image
          src={user.photoURL}
          alt="profile"
          width={24}
          height={24}
          className="h-6 w-6 rounded-full border border-brand-dark-gold/40 object-cover"
        />
      ) : (
        <UserIcon className="h-5 w-5" />
      )}
    </Link>
  );
}
