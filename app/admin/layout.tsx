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

  if (!show) {
    return (
      <div className="min-h-screen bg-brand-dark px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-4 animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-white/5" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
