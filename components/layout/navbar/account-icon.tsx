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
          // Fetch avatar fresh (no cache to avoid account switch leaks)
          fetch("/api/auth/avatar")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.avatar) {
                setAvatar(d.avatar);
                try { sessionStorage.setItem("atheles-avatar", d.avatar); } catch {}
              } else {
                setAvatar(null);
                try { sessionStorage.removeItem("atheles-avatar"); } catch {}
              }
            })
            .catch(() => {});
        } else {
          setLoggedIn(false);
          setInitials(null);
          setAvatar(null);
          try { sessionStorage.removeItem("atheles-avatar"); } catch {}
        }
      })
      .catch(() => {
        setLoggedIn(false);
        setInitials(null);
        setAvatar(null);
        try { sessionStorage.removeItem("atheles-avatar"); } catch {}
      });
  }, []);

  useEffect(() => {
    refreshSession();
  }, [pathname, refreshSession]);

  // Listen for avatar changes from the profile page
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
    const handleLogout = () => {
      setLoggedIn(false);
      setInitials(null);
      setAvatar(null);
    };
    window.addEventListener("user-logout", handleLogout);
    return () => {
      window.removeEventListener("avatar-changed", handleAvatarChange);
      window.removeEventListener("user-logout", handleLogout);
    };
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
          className="h-9 w-9 rounded-full object-cover transition-transform duration-200 hover:scale-110"
        />
      ) : loggedIn && initials ? (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark-gold/20 text-xs font-bold text-brand-gold transition-transform duration-200 hover:scale-110">
          {initials}
        </span>
      ) : (
        <UserIcon className="h-5 w-5" />
      )}
    </Link>
  );
}
