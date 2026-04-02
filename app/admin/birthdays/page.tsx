"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

const tierColors: Record<string, string> = {
  platinum: "text-cyan-300",
  champion: "text-fuchsia-300",
  athlete: "text-sky-300",
  admin: "text-red-400",
};

export default function AdminBirthdaysPage() {
  const router = useRouter();
  const [data, setData] = useState<BirthdayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          fetchBirthdays();
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const fetchBirthdays = async () => {
    try {
      const res = await fetch("/api/admin/birthdays-internal");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {}
    setLoading(false);
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-brand-grey">loading birthdays...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-red-400">failed to load data.</p>
      </div>
    );
  }

  const searchLower = search.toLowerCase();
  const filterMembers = (list: BirthdayMember[]) =>
    search ? list.filter((m) => m.name.toLowerCase().includes(searchLower) || m.email.toLowerCase().includes(searchLower)) : list;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">
          ← back to dashboard
        </a>
        <h1 className="mt-2 font-heading text-2xl text-brand-gold">
          birthday rewards tracker
        </h1>
        <p className="mt-1 text-sm text-brand-grey">
          members with birthday rewards perk (platinum, champion, athlete)
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search by name or email..."
          className="w-full rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-3 py-2.5 text-sm text-white placeholder:text-brand-grey/40 focus:border-brand-gold focus:outline-none"
        />
      </div>

      {/* Upcoming in 30 days */}
      {filterMembers(data.upcomingIn30Days).length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-brand-pale-gold">
            upcoming in 30 days ({filterMembers(data.upcomingIn30Days).length})
          </h2>
          <div className="space-y-2">
            {filterMembers(data.upcomingIn30Days).map((m) => (
              <MemberCard key={m.email} member={m} urgent onCopy={copyEmail} copied={copied} />
            ))}
          </div>
        </div>
      )}

      {/* All members */}
      <div>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-brand-grey">
          all birthday members ({filterMembers(data.allBirthdayMembers).length})
        </h2>
        <div className="space-y-2">
          {filterMembers(data.allBirthdayMembers).map((m) => (
            <MemberCard key={m.email} member={m} onCopy={copyEmail} copied={copied} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member, urgent, onCopy, copied }: { member: BirthdayMember; urgent?: boolean; onCopy: (email: string) => void; copied: string | null }) {
  const color = tierColors[member.tier] || "text-brand-grey";

  return (
    <div className={`rounded-lg border bg-brand-dark p-4 ${urgent ? "border-brand-gold/40" : "border-brand-dark-gold/20"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white">{member.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-brand-grey">{member.email}</p>
            <button
              type="button"
              onClick={() => onCopy(member.email)}
              className="flex-none text-[10px] text-brand-dark-gold hover:text-brand-gold"
            >
              {copied === member.email ? "✓" : "copy"}
            </button>
          </div>
        </div>
        <span className={`text-xs uppercase tracking-wider ${color}`}>
          {member.tier}
        </span>
      </div>
      {member.missing ? (
        <p className="mt-2 text-xs text-red-400/70">dob not set</p>
      ) : (
        <div className="mt-2 flex items-center gap-4 text-xs text-brand-grey">
          <span>🎂 {member.birthday}</span>
          {member.turningAge && <span>turning {member.turningAge}</span>}
          {member.daysUntil !== null && (
            <span className={member.daysUntil <= 14 ? "font-medium text-brand-gold" : ""}>
              {member.daysUntil === 0
                ? "🎉 today!"
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
