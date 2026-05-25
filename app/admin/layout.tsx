"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CACHE_KEY = "atheles-admin-v1";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          localStorage.setItem(CACHE_KEY, "1");
        } else {
          localStorage.removeItem(CACHE_KEY);
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  return <>{children}</>;
}
