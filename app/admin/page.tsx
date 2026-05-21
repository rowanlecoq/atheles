"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          setUserName(d.user.firstName || d.user.name || "admin");
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-brand-grey">checking access...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-brand-gold">
          admin dashboard
        </h1>
        <p className="mt-1 text-sm text-brand-grey">
          welcome back, {userName.toLowerCase()}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard
          title="birthday tracker"
          description="view upcoming birthdays for members with birthday rewards."
          href="/admin/birthdays"
          icon="🎂"
        />
        <AdminCard
          title="manage members"
          description="view customers, assign tiers, and manage athlete/admin roles."
          href="/admin/members"
          icon="👥"
        />
        <AdminCard
          title="announcements"
          description="edit the announcement bar messages shown at the top of the site."
          href="/admin/announcements"
          icon="📢"
        />
        <AdminCard
          title="site images"
          description="replace placeholder images and videos across the homepage and store."
          href="/admin/images"
          icon="🖼️"
        />
        <AdminCard
          title="website theme"
          description="customize brand colors, text gradients, and logos for seasonal updates."
          href="/admin/theme"
          icon="🎨"
        />
        <AdminCard
          title="athlete profiles"
          description="edit athlete bios, photos, and social links on the athletes page."
          href="/admin/athletes"
          icon="🏋️"
        />
        <AdminCard
          title="manage quotes"
          description="edit the rotating greek quotes shown across the site."
          href="/admin/quotes"
          icon="💬"
        />
        <AdminCard
          title="shopify admin"
          description="go to your shopify dashboard for orders, products, and more."
          href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "admin.shopify.com"}/admin`}
          icon="🛍️"
          external
        />
        <BlobCleanupCard />
      </div>
    </div>
  );
}

function BlobCleanupCard() {
  const [state, setState] = useState<"idle" | "scanning" | "deleting" | "done" | "error">("idle");
  const [result, setResult] = useState<{ orphanCount?: number; deleted?: number } | null>(null);

  const scan = async () => {
    setState("scanning");
    try {
      const r = await fetch("/api/admin/blob-cleanup");
      const d = await r.json();
      setResult(d);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  const cleanup = async () => {
    setState("deleting");
    try {
      const r = await fetch("/api/admin/blob-cleanup", { method: "DELETE" });
      const d = await r.json();
      setResult(d);
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
      <span className="mb-3 block text-2xl">🗑️</span>
      <h2 className="mb-1 text-sm font-medium text-white">blob storage cleanup</h2>
      <p className="mb-4 text-xs leading-relaxed text-brand-grey">
        remove old profile photos and unused files from vercel blob to free up space. runs automatically every sunday.
      </p>

      {result && state !== "deleting" && (
        <p className="mb-3 text-xs text-brand-gold">
          {state === "done"
            ? `deleted ${result.deleted} orphaned file${result.deleted !== 1 ? "s" : ""}.`
            : `found ${result.orphanCount} orphaned file${result.orphanCount !== 1 ? "s" : ""}.`}
        </p>
      )}
      {state === "error" && <p className="mb-3 text-xs text-red-400">something went wrong.</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={scan}
          disabled={state === "scanning" || state === "deleting"}
          className="rounded-full border border-brand-dark-gold/30 px-3 py-1.5 text-xs text-brand-pale-gold transition-colors hover:border-brand-gold/50 hover:text-brand-gold disabled:opacity-40"
        >
          {state === "scanning" ? "scanning…" : "scan"}
        </button>
        <button
          type="button"
          onClick={cleanup}
          disabled={state === "scanning" || state === "deleting"}
          className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-40"
        >
          <TrashIcon className="h-3 w-3" />
          {state === "deleting" ? "cleaning…" : "clean now"}
        </button>
      </div>
    </div>
  );
}

function AdminCard({
  title,
  description,
  href,
  icon,
  external,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  external?: boolean;
}) {
  const Tag = external ? "a" : "a";
  return (
    <Tag
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5 transition-colors hover:border-brand-gold/40"
    >
      <span className="mb-3 block text-2xl">{icon}</span>
      <h2 className="mb-1 text-sm font-medium text-white group-hover:text-brand-gold">
        {title}
      </h2>
      <p className="text-xs leading-relaxed text-brand-grey">{description}</p>
    </Tag>
  );
}
