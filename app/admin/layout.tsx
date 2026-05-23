"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CACHE_KEY = "atheles-admin-v1";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [show, setShow] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CACHE_KEY) === "1";
    }
    return false;
  });

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          localStorage.setItem(CACHE_KEY, "1");
          setShow(true);
        } else {
          localStorage.removeItem(CACHE_KEY);
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  if (!show) return null;
  return <>{children}</>;
}
