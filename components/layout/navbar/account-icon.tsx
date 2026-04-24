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

  // Show cached avatar instantly before session loads
  useEffect(() => {
    if (!document.cookie.includes("atheles-logged-in=1")) return;
    try {
      const cached = localStorage.getItem("atheles-session");
      if (cached) {
        const u = JSON.parse(cached);
        const key = `atheles-avatar-${u.email}`;
        const av = localStorage.getItem(key);
        if (av) setAvatar(av);
        setLoggedIn(true);
        const n = u.name || u.email || "A";
        setInitials(n.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2));
      }
    } catch {}
  }, []);

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
          // Per-user avatar cache for instant display
          const avatarKey = `atheles-avatar-${data.user.email}`;
          try {
            const cached = localStorage.getItem(avatarKey);
            if (cached) setAvatar(cached);
          } catch {}
          fetch("/api/auth/avatar")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.avatar) {
                setAvatar(d.avatar);
                try { localStorage.setItem(avatarKey, d.avatar); } catch {}
              } else {
                setAvatar(null);
                try { localStorage.removeItem(avatarKey); } catch {}
              }
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
        <div className="h-9 w-9 overflow-hidden rounded-full transition-transform duration-200 hover:scale-110" style={{ WebkitMaskImage: "-webkit-radial-gradient(circle, white 100%, black 100%)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt="Profile" width={36} height={36} className="h-full w-full object-cover" />
        </div>
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
