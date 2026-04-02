"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
