"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  email: string;
  name: string;
  tier: string;
  dob: string | null;
  createdAt: string;
  orders: string;
};

const tierColors: Record<string, string> = {
  bronze: "text-amber-500",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  platinum: "text-cyan-300",
  champion: "text-fuchsia-300",
  athlete: "text-sky-300",
  admin: "text-red-400",
};

const validTiers = ["bronze", "silver", "gold", "platinum", "champion", "athlete", "admin"];

export default function AdminMembersPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          fetchMembers();
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/members");
      if (res.ok) {
        const d = await res.json();
        setMembers(d.customers || []);
      }
    } catch {}
    setLoading(false);
  };

  const updateTier = async (customerId: string, tier: string) => {
    setUpdating(customerId);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, tier }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === customerId ? { ...m, tier } : m)),
        );
      }
    } catch {}
    setUpdating(null);
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email).catch(() => {});
    setCopied(email);
    setTimeout(() => setCopied(null), 1500);
  };

  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-brand-grey">checking access...</p>
      </div>
    );
  }

  const searchLower = search.toLowerCase();
  const filtered = members.filter((m) => {
    const matchesFilter = filter === "all" || m.tier === filter;
    const matchesSearch = !search || m.name.toLowerCase().includes(searchLower) || m.email.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-6">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">
          ← back to dashboard
        </a>
        <h1 className="mt-2 font-heading text-2xl text-brand-gold">
          manage members
        </h1>
        <p className="mt-1 text-sm text-brand-grey">
          {members.length} total members
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search by name or email..."
          className="w-full rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-3 py-2.5 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
        />
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["all", ...validTiers].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
              filter === t
                ? "bg-brand-gold/10 text-brand-gold"
                : "border border-brand-dark-gold/20 text-brand-grey hover:text-brand-gold"
            }`}
          >
            {t} {t !== "all" && `(${members.filter((m) => m.tier === t).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-brand-grey">loading members...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-brand-grey">no members found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{m.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs text-brand-grey">{m.email}</p>
                    <button
                      type="button"
                      onClick={() => copyEmail(m.email)}
                      className="flex-none text-[10px] text-brand-dark-gold hover:text-brand-gold"
                      title="Copy email"
                    >
                      {copied === m.email ? "✓" : "copy"}
                    </button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] text-brand-grey">
                    <span>joined {new Date(m.createdAt).toLocaleDateString()}</span>
                    {m.dob && <span>dob: {m.dob}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs uppercase tracking-wider ${tierColors[m.tier] || "text-brand-grey"}`}>
                    {m.tier}
                  </span>
                  <select
                    value={m.tier}
                    disabled={updating === m.id}
                    onChange={(e) => updateTier(m.id, e.target.value)}
                    className="rounded border border-brand-dark-gold/30 bg-brand-dark px-2 py-1 text-xs text-white focus:border-brand-gold focus:outline-none"
                  >
                    {validTiers.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
