"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function AccountIcon() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const pathname = usePathname();

  const refreshSession = useCallback(() => {
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
              .slice(0, 2),
          );
          // Fetch avatar from server (blob storage)
          fetch("/api/auth/avatar")
            .then((r) => r.json())
            .then((d) => {
              if (d.avatar) setAvatar(d.avatar);
            })
            .catch(() => {});
        } else {
          setLoggedIn(false);
          setInitials(null);
          setAvatar(null);
        }
      })
      .catch(() => {
        setLoggedIn(false);
        setInitials(null);
        setAvatar(null);
      });
  }, []);

  useEffect(() => {
    refreshSession();
  }, [pathname, refreshSession]);

  // Listen for avatar changes from the profile page
  useEffect(() => {
    const handleAvatarChange = () => {
      fetch("/api/auth/avatar")
        .then((r) => r.json())
        .then((d) => {
          if (d.avatar) setAvatar(d.avatar);
          else setAvatar(null);
        })
        .catch(() => {});
    };

    window.addEventListener("avatar-changed", handleAvatarChange);
    return () =>
      window.removeEventListener("avatar-changed", handleAvatarChange);
  }, []);

  return (
    <Link
      href={loggedIn ? "/profile" : "/login"}
      className="hidden h-11 w-11 items-center justify-center text-brand-grey transition-colors hover:text-brand-gold md:flex"
      aria-label="Account"
    >
      {loggedIn && avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt="Profile"
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : loggedIn && initials ? (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark-gold/20 text-xs font-bold text-brand-gold">
          {initials}
        </span>
      ) : (
        <UserIcon className="h-5 w-5" />
      )}
    </Link>
  );
}
