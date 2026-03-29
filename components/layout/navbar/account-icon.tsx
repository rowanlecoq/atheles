"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function AccountIcon() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const pathname = usePathname();

  const refreshSession = useCallback(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setLoggedIn(true);
          setUserId(data.user.id);
          const name = data.user.name || data.user.email || "A";
          setInitials(
            name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2),
          );
          // Load avatar from localStorage
          try {
            const stored = localStorage.getItem(`avatar-${data.user.id}`);
            setAvatar(stored);
          } catch {
            setAvatar(null);
          }
        } else {
          setLoggedIn(false);
          setInitials(null);
          setAvatar(null);
          setUserId(null);
        }
      })
      .catch(() => {
        setLoggedIn(false);
        setInitials(null);
        setAvatar(null);
        setUserId(null);
      });
  }, []);

  // Re-fetch session on every route change
  useEffect(() => {
    refreshSession();
  }, [pathname, refreshSession]);

  // Listen for avatar changes from the profile page
  useEffect(() => {
    const handleAvatarChange = () => {
      if (userId) {
        try {
          const stored = localStorage.getItem(`avatar-${userId}`);
          setAvatar(stored);
        } catch {
          setAvatar(null);
        }
      }
    };

    window.addEventListener("avatar-changed", handleAvatarChange);
    return () =>
      window.removeEventListener("avatar-changed", handleAvatarChange);
  }, [userId]);

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
          width={28}
          height={28}
          className="h-7 w-7 rounded-full border border-brand-gold object-cover"
        />
      ) : loggedIn && initials ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-gold bg-brand-dark-gold/20 text-xs font-bold text-brand-gold">
          {initials}
        </span>
      ) : (
        <UserIcon className="h-5 w-5" />
      )}
    </Link>
  );
}
