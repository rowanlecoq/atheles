"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export default function ProfileContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
        setLoading(false);
      });
  }, [router]);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-brand-grey">loading...</p>
      </div>
    );
  }

  const initials = (user.name || user.email || "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand-gold bg-brand-dark-gold/20">
          <span className="font-heading text-2xl text-brand-gold">{initials}</span>
        </div>
        <h1 className="font-heading text-2xl text-brand-gold sm:text-3xl">{user.name}</h1>
        <p className="mt-1 text-sm text-brand-grey">{user.email}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-dark-gold">
          member since {memberSince}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4 text-center">
          <p className="font-heading text-2xl text-brand-gold">0</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-grey">points</p>
        </div>
        <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4 text-center">
          <p className="font-heading text-2xl text-brand-gold">0</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-grey">orders</p>
        </div>
        <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4 text-center">
          <p className="font-heading text-2xl text-brand-gold">bronze</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-grey">tier</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="mb-4 font-heading text-lg text-brand-pale-gold">account</h2>
        <a href="/favorites" className="flex items-center justify-between rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-4 py-3 transition-colors hover:border-brand-gold/30">
          <span className="text-sm text-white">favorites</span>
          <span className="text-xs text-brand-grey">&rarr;</span>
        </a>
        <a href="/search" className="flex items-center justify-between rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-4 py-3 transition-colors hover:border-brand-gold/30">
          <span className="text-sm text-white">shop</span>
          <span className="text-xs text-brand-grey">&rarr;</span>
        </a>
        <button type="button" onClick={handleSignOut}
          className="flex w-full items-center justify-between rounded-lg border border-red-900/30 bg-brand-dark px-4 py-3 transition-colors hover:border-red-700/50">
          <span className="text-sm text-red-400">sign out</span>
          <span className="text-xs text-red-400/50">&rarr;</span>
        </button>
      </div>
    </div>
  );
}
