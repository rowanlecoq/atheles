"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, ClipboardDocumentIcon, CheckIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

type Member = {
  id: string;
  email: string;
  name: string;
  tier: string;
  tierOverride: string | null;
  dob: string | null;
  createdAt: string;
  orders: string;
  newsletter: boolean;
};

const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-500",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  platinum: "text-cyan-300",
  champion: "text-fuchsia-300",
  athlete: "text-sky-300",
  admin: "text-red-400",
};

const TIER_BG: Record<string, string> = {
  bronze: "bg-amber-500/10",
  silver: "bg-gray-300/10",
  gold: "bg-yellow-400/10",
  platinum: "bg-cyan-300/10",
  champion: "bg-fuchsia-300/10",
  athlete: "bg-sky-300/10",
  admin: "bg-red-400/10",
};

const VALID_TIERS = ["bronze", "silver", "gold", "platinum", "champion", "athlete", "admin"];
const ALL_TIER_OPTIONS = [...VALID_TIERS, "auto"];

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const loadMembers = () => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/members")
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (!r.ok) {
          setError(json?.error ?? `HTTP ${r.status}`);
          return;
        }
        if (json?.customers) setMembers(json.customers);
        else setError("API returned no customers field");
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMembers(); }, []);

  const updateTier = async (customerId: string, tier: string) => {
    setUpdating(customerId);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, tier }),
      });
      if (res.ok) {
        if (tier === "auto") {
          // Tier reverts to points-based — reload to reflect actual state
          loadMembers();
        } else {
          setMembers((prev) =>
            prev.map((m) => m.id === customerId ? { ...m, tier, tierOverride: tier } : m),
          );
        }
      }
    } catch {}
    setUpdating(null);
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email).catch(() => {});
    setCopied(email);
    setTimeout(() => setCopied(null), 1500);
  };

  const searchLower = search.toLowerCase();
  const filtered = members.filter((m) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "newsletter" ? m.newsletter
        : filter === "override" ? !!m.tierOverride
        : m.tier === filter);
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(searchLower) ||
      m.email.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">
          ← back to dashboard
        </a>
        <div className="mt-3 flex items-baseline gap-3">
          <h1 className="font-heading text-2xl text-brand-gold">members</h1>
          {!loading && (
            <span className="text-sm text-brand-grey">{members.length} total</span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-grey/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search by name or email..."
          className="w-full rounded-lg border border-brand-dark-gold/20 bg-brand-dark py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-brand-grey/30 focus:border-brand-gold focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["all", "newsletter", ...VALID_TIERS, "override"].map((t) => (
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
            {t}
            <span className="ml-1 text-brand-grey/50">
              {t === "all"
                ? ""
                : t === "newsletter"
                  ? members.filter((m) => m.newsletter).length
                  : t === "override"
                    ? members.filter((m) => !!m.tierOverride).length || ""
                    : members.filter((m) => m.tier === t).length || ""}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">error loading members: {error}</p>
          <button
            type="button"
            onClick={loadMembers}
            className="mt-2 text-xs text-brand-gold hover:underline"
          >
            retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-brand-grey">no members found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-brand-dark-gold/15 bg-brand-dark p-4"
            >
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{m.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="truncate text-xs text-brand-grey">{m.email}</p>
                    <button
                      type="button"
                      onClick={() => copyEmail(m.email)}
                      className="flex-none text-brand-grey/40 transition-colors hover:text-brand-gold"
                      title="copy email"
                    >
                      {copied === m.email
                        ? <CheckIcon className="h-3.5 w-3.5 text-green-400" />
                        : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-brand-grey/50">
                    <span>joined {new Date(m.createdAt).toLocaleDateString()}</span>
                    {m.dob && <span>dob: {m.dob}</span>}
                    {m.newsletter && (
                      <span className="flex items-center gap-1 text-brand-gold/60">
                        <EnvelopeIcon className="h-3 w-3" />
                        subscribed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${TIER_COLORS[m.tier] || "text-brand-grey"} ${TIER_BG[m.tier] || ""}`}>
                      {m.tier}
                    </span>
                    {m.tierOverride && (
                      <span className="rounded-full bg-brand-gold/10 px-1.5 py-0.5 text-[9px] text-brand-gold" title="manually overridden">
                        override
                      </span>
                    )}
                  </div>
                  <select
                    value={m.tierOverride ? m.tierOverride : m.tier}
                    disabled={updating === m.id}
                    onChange={(e) => updateTier(m.id, e.target.value)}
                    className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-2 py-1 text-xs text-white focus:border-brand-gold focus:outline-none disabled:opacity-50"
                  >
                    {ALL_TIER_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t === "auto" ? "auto (points-based)" : t}
                      </option>
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
