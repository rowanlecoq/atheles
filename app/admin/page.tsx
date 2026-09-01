"use client";

import { useState } from "react";
import {
  CakeIcon,
  UsersIcon,
  MegaphoneIcon,
  PhotoIcon,
  PaintBrushIcon,
  TrophyIcon,
  ChatBubbleBottomCenterTextIcon,
  ShoppingBagIcon,
  LockClosedIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

const CARDS = [
  {
    title: "birthday tracker",
    description: "view upcoming birthdays for members with birthday rewards.",
    href: "/admin/birthdays",
    Icon: CakeIcon,
  },
  {
    title: "manage members",
    description: "view customers, assign tiers, and manage athlete/admin roles.",
    href: "/admin/members",
    Icon: UsersIcon,
  },
  {
    title: "announcements",
    description: "edit the announcement bar messages shown at the top of the site.",
    href: "/admin/announcements",
    Icon: MegaphoneIcon,
  },
  {
    title: "site images",
    description: "replace images and videos across the homepage and store.",
    href: "/admin/images",
    Icon: PhotoIcon,
  },
  {
    title: "website theme",
    description: "customize brand colors, text gradients, and logos.",
    href: "/admin/theme",
    Icon: PaintBrushIcon,
  },
  {
    title: "athlete profiles",
    description: "edit athlete bios, photos, and social links.",
    href: "/admin/athletes",
    Icon: TrophyIcon,
  },
  {
    title: "manage quotes",
    description: "edit the rotating greek quotes shown across the site.",
    href: "/admin/quotes",
    Icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    title: "homepage content",
    description: "edit the carousel title, subtitle, and featured section heading.",
    href: "/admin/homepage",
    Icon: HomeIcon,
  },
  {
    title: "site lock",
    description: "lock the site with a coming-soon page, countdown, and waitlist.",
    href: "/admin/site-lock",
    Icon: LockClosedIcon,
  },
  {
    title: "shopify admin",
    description: "go to your shopify dashboard for orders, products, and more.",
    href: `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "admin.shopify.com"}/admin`,
    Icon: ShoppingBagIcon,
    external: true,
  },
];

export default function AdminDashboard() {
  return (
    <div className="animate-profile-slide-up mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-3xl text-brand-gold">admin</h1>
        <p className="mt-1 text-sm text-brand-grey">manage your site content and members.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ title, description, href, Icon, external }) => (
          <a
            key={href}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group flex flex-col rounded-xl border border-brand-dark-gold/15 bg-brand-dark p-5 transition-colors hover:border-brand-gold/30"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/10">
                <Icon className="h-4.5 w-4.5 text-brand-gold" style={{ width: 18, height: 18 }} />
              </div>
              {external
                ? <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-brand-grey/40 transition-colors group-hover:text-brand-gold/60" />
                : <ArrowRightIcon className="h-3.5 w-3.5 translate-x-0 text-brand-grey/0 transition-all group-hover:translate-x-0.5 group-hover:text-brand-gold/60" />}
            </div>
            <h2 className="mb-1 text-sm font-medium text-white group-hover:text-brand-gold transition-colors">
              {title}
            </h2>
            <p className="text-xs leading-relaxed text-brand-grey">{description}</p>
          </a>
        ))}
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
    <div className="flex flex-col rounded-xl border border-brand-dark-gold/15 bg-brand-dark p-5">
      <div className="mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
          <TrashIcon className="h-[18px] w-[18px] text-red-400" />
        </div>
      </div>
      <h2 className="mb-1 text-sm font-medium text-white">blob storage cleanup</h2>
      <p className="mb-4 text-xs leading-relaxed text-brand-grey">
        remove unused files from vercel blob. runs automatically every sunday.
      </p>

      {result && state !== "deleting" && (
        <p className="mb-3 text-xs text-brand-gold">
          {state === "done"
            ? `deleted ${result.deleted} orphaned file${result.deleted !== 1 ? "s" : ""}.`
            : `found ${result.orphanCount} orphaned file${result.orphanCount !== 1 ? "s" : ""}.`}
        </p>
      )}
      {state === "error" && <p className="mb-3 text-xs text-red-400">something went wrong.</p>}

      <div className="mt-auto flex gap-2 pt-2">
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
