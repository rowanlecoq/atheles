"use client";

import { useAuth } from "components/auth-context";
import Footer from "components/layout/footer";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user, loading, signOut, updateDisplayName } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-brand-grey">loading...</p>
      </div>
    );
  }

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await updateDisplayName(newName.trim());
    setEditingName(false);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const initials = (user.displayName || user.email || "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "unknown";

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        {/* Profile header */}
        <div className="mb-10 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "profile"}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border-2 border-brand-gold object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand-gold bg-brand-dark-gold/20">
                <span className="font-heading text-2xl text-brand-gold">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded border border-brand-dark-gold/30 bg-brand-dark px-3 py-1.5 text-center text-sm text-white focus:border-brand-gold focus:outline-none"
                placeholder="display name"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="text-xs uppercase tracking-wider text-brand-gold hover:text-brand-light-gold"
              >
                {saving ? "..." : "save"}
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="text-xs uppercase tracking-wider text-brand-grey hover:text-white"
              >
                cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl text-brand-gold sm:text-3xl">
                {user.displayName || "athlete"}
              </h1>
              <button
                onClick={() => {
                  setNewName(user.displayName || "");
                  setEditingName(true);
                }}
                className="text-xs uppercase tracking-wider text-brand-grey hover:text-brand-gold"
              >
                edit
              </button>
            </div>
          )}

          <p className="mt-1 text-sm text-brand-grey">{user.email}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-dark-gold">
            member since {memberSince}
          </p>
        </div>

        {/* Stats / Points placeholder */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4 text-center">
            <p className="font-heading text-2xl text-brand-gold">0</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-grey">
              points
            </p>
          </div>
          <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4 text-center">
            <p className="font-heading text-2xl text-brand-gold">0</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-grey">
              orders
            </p>
          </div>
          <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4 text-center">
            <p className="font-heading text-2xl text-brand-gold">bronze</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-grey">
              tier
            </p>
          </div>
        </div>

        {/* Account section */}
        <div className="space-y-3">
          <h2 className="mb-4 font-heading text-lg text-brand-pale-gold">
            account
          </h2>

          <a
            href="/favorites"
            className="flex items-center justify-between rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-4 py-3 transition-colors hover:border-brand-gold/30"
          >
            <span className="text-sm text-white">favorites</span>
            <span className="text-xs text-brand-grey">→</span>
          </a>

          <a
            href="/search"
            className="flex items-center justify-between rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-4 py-3 transition-colors hover:border-brand-gold/30"
          >
            <span className="text-sm text-white">shop</span>
            <span className="text-xs text-brand-grey">→</span>
          </a>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-between rounded-lg border border-red-900/30 bg-brand-dark px-4 py-3 transition-colors hover:border-red-700/50"
          >
            <span className="text-sm text-red-400">sign out</span>
            <span className="text-xs text-red-400/50">→</span>
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
