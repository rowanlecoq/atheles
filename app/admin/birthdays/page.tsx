"use client";

import { useEffect, useState } from "react";
import { CakeIcon, MagnifyingGlassIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

type BirthdayMember = {
  name: string;
  email: string;
  tier: string;
  dob: string | null;
  birthday: string | null;
  daysUntil: number | null;
  turningAge: number | null;
  missing: boolean;
};

type BirthdayData = {
  total: number;
  upcoming: number;
  upcomingIn30Days: BirthdayMember[];
  allBirthdayMembers: BirthdayMember[];
};

const TIER_COLORS: Record<string, string> = {
  platinum: "text-cyan-300",
  champion: "text-fuchsia-300",
  athlete: "text-sky-300",
  admin: "text-red-400",
};

export default function AdminBirthdaysPage() {
  const [data, setData] = useState<BirthdayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/birthdays-internal")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email).catch(() => {});
    setCopied(email);
    setTimeout(() => setCopied(null), 1500);
  };

  const searchLower = search.toLowerCase();
  const filterMembers = (list: BirthdayMember[]) =>
    search
      ? list.filter(
          (m) =>
            m.name.toLowerCase().includes(searchLower) ||
            m.email.toLowerCase().includes(searchLower),
        )
      : list;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">
          ← back to dashboard
        </a>
        <h1 className="mt-3 font-heading text-2xl text-brand-gold">birthday tracker</h1>
        <p className="mt-1 text-sm text-brand-grey">
          members with birthday rewards (platinum, champion, athlete)
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-grey/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search by name or email..."
          className="w-full rounded-lg border border-brand-dark-gold/20 bg-brand-dark py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-brand-grey/30 focus:border-brand-gold focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-sm text-red-400">failed to load data.</p>
      ) : (
        <>
          {/* Upcoming in 30 days */}
          {filterMembers(data.upcomingIn30Days).length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-[11px] uppercase tracking-widest text-brand-pale-gold">
                upcoming — next 30 days ({filterMembers(data.upcomingIn30Days).length})
              </h2>
              <div className="space-y-2">
                {filterMembers(data.upcomingIn30Days).map((m) => (
                  <MemberCard
                    key={m.email}
                    member={m}
                    urgent
                    onCopy={copyEmail}
                    copied={copied}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All members */}
          <section>
            <h2 className="mb-3 text-[11px] uppercase tracking-widest text-brand-grey/60">
              all birthday members ({filterMembers(data.allBirthdayMembers).length})
            </h2>
            <div className="space-y-2">
              {filterMembers(data.allBirthdayMembers).map((m) => (
                <MemberCard key={m.email} member={m} onCopy={copyEmail} copied={copied} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MemberCard({
  member,
  urgent,
  onCopy,
  copied,
}: {
  member: BirthdayMember;
  urgent?: boolean;
  onCopy: (email: string) => void;
  copied: string | null;
}) {
  const color = TIER_COLORS[member.tier] || "text-brand-grey";

  return (
    <div
      className={`rounded-xl border bg-brand-dark p-4 ${
        urgent ? "border-brand-gold/30" : "border-brand-dark-gold/15"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{member.name}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="truncate text-xs text-brand-grey">{member.email}</p>
            <button
              type="button"
              onClick={() => onCopy(member.email)}
              className="flex-none text-brand-grey/40 transition-colors hover:text-brand-gold"
            >
              {copied === member.email
                ? <CheckIcon className="h-3.5 w-3.5 text-green-400" />
                : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <span className={`ml-4 text-xs uppercase tracking-wider ${color}`}>{member.tier}</span>
      </div>

      {member.missing ? (
        <p className="mt-2 text-xs text-red-400/70">dob not set</p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-brand-grey">
          <span className="flex items-center gap-1.5">
            <CakeIcon className="h-3.5 w-3.5 text-brand-grey/50" />
            {member.birthday}
          </span>
          {member.turningAge && <span>turning {member.turningAge}</span>}
          {member.daysUntil !== null && (
            <span
              className={
                member.daysUntil <= 14 ? "font-medium text-brand-gold" : "text-brand-grey/60"
              }
            >
              {member.daysUntil === 0
                ? "today!"
                : member.daysUntil === 1
                  ? "tomorrow!"
                  : `in ${member.daysUntil} days`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
