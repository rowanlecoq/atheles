"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Read cached state synchronously on module load (client only)
function getInitialState() {
  if (typeof window === "undefined") return { loggedIn: false, initials: null as string | null, avatar: null as string | null };
  try {
    if (!document.cookie.includes("atheles-logged-in=1")) return { loggedIn: false, initials: null, avatar: null };
    const cached = sessionStorage.getItem("atheles-session");
    if (!cached) return { loggedIn: false, initials: null, avatar: null };
    const u = JSON.parse(cached);
    const n = u.name || u.email || "A";
    const initials = n.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
    const key = `atheles-avatar-${u.email}`;
    const avatar = sessionStorage.getItem(key) || null;
    return { loggedIn: true, initials, avatar };
  } catch { return { loggedIn: false, initials: null, avatar: null }; }
}

export function AccountIcon() {
  const initial = useRef(getInitialState());
  const [loggedIn, setLoggedIn] = useState(initial.current.loggedIn);
  const [initials, setInitials] = useState(initial.current.initials);
  const [avatar, setAvatar] = useState(initial.current.avatar);
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
          const avatarKey = `atheles-avatar-${data.user.email}`;
          try {
            const cached = sessionStorage.getItem(avatarKey);
            if (cached) setAvatar(cached);
          } catch {}
          fetch("/api/auth/avatar")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.avatar) {
                setAvatar(d.avatar);
                try { sessionStorage.setItem(avatarKey, d.avatar); } catch {}
              } else {
                setAvatar(null);
                try { sessionStorage.removeItem(avatarKey); } catch {}
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
      });
  }, []);

  useEffect(() => {
    refreshSession();
  }, [pathname, refreshSession]);

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
      suppressHydrationWarning
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
