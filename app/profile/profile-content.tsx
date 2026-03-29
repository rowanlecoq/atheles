"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ImageCropModal from "components/image-crop-modal";

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  phone: string | null;
  acceptsMarketing: boolean;
  createdAt: string;
  numberOfOrders: string;
  totalSpent: string;
  dob: string | null;
};

const TIERS = [
  {
    name: "BRONZE",
    min: 0,
    max: 5000,
    barGradient: "from-amber-900 via-amber-700 to-amber-500",
    titleGradient: "from-amber-500 via-amber-400 to-yellow-300",
    perks: [] as string[],
  },
  {
    name: "SILVER",
    min: 5000,
    max: 15000,
    barGradient: "from-gray-500 via-gray-400 to-gray-300",
    titleGradient: "from-gray-300 via-gray-200 to-white",
    perks: ["10% monthly discount code"],
  },
  {
    name: "GOLD",
    min: 15000,
    max: 30000,
    barGradient: "from-yellow-700 via-yellow-500 to-amber-300",
    titleGradient: "from-yellow-400 via-yellow-300 to-amber-200",
    perks: ["early access", "15% monthly discount code", "birthday rewards"],
  },
  {
    name: "PLATINUM",
    min: 30000,
    max: 50000,
    barGradient: "from-cyan-700 via-cyan-400 to-cyan-200",
    titleGradient: "from-cyan-300 via-cyan-200 to-white",
    perks: [
      "early access",
      "18% monthly discount code",
      "birthday rewards",
      "free shipping",
    ],
  },
  {
    name: "CHAMPION",
    min: 50000,
    max: Infinity,
    barGradient: "from-fuchsia-700 via-purple-500 to-amber-400",
    titleGradient: "from-fuchsia-300 via-purple-300 to-amber-200",
    perks: [
      "exclusive access",
      "20% monthly discount code",
      "free shipping",
      "birthday rewards",
    ],
  },
];

function getTier(points: number) {
  return TIERS.find((t) => points >= t.min && points < t.max) || TIERS[0]!;
}

function getNextTier(points: number) {
  const idx = TIERS.findIndex((t) => points >= t.min && points < t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

// Format phone for display based on country code
function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  // US/Canada: +1 (XXX) XXX-XXXX
  if (digits.startsWith("1") && digits.length <= 11) {
    const d = digits.slice(1);
    if (d.length === 0) return "+1";
    if (d.length <= 3) return `+1 (${d})`;
    if (d.length <= 6) return `+1 (${d.slice(0, 3)}) ${d.slice(3)}`;
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
  }

  // UK: +44 XXXX XXXXXX
  if (digits.startsWith("44") && digits.length <= 12) {
    const d = digits.slice(2);
    if (d.length <= 4) return `+44 ${d}`;
    return `+44 ${d.slice(0, 4)} ${d.slice(4)}`;
  }

  // AU: +61 XXX XXX XXX
  if (digits.startsWith("61") && digits.length <= 11) {
    const d = digits.slice(2);
    if (d.length <= 3) return `+61 ${d}`;
    if (d.length <= 6) return `+61 ${d.slice(0, 3)} ${d.slice(3)}`;
    return `+61 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }

  // Default: +CC XXX XXX XXXX (country code 2 digits, rest grouped)
  if (digits.length <= 2) return `+${digits}`;
  const cc = digits.slice(0, 2);
  const d = digits.slice(2);
  if (d.length <= 3) return `+${cc} ${d}`;
  if (d.length <= 6) return `+${cc} ${d.slice(0, 3)} ${d.slice(3)}`;
  return `+${cc} ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

// Convert display phone to E.164 for Shopify: just digits with +
function phoneToE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  return `+${digits}`;
}

export default function ProfileContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [profileBg, setProfileBg] = useState("none");
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const applyUser = (u: User) => {
      setUser(u);
      setFirstName(u.firstName || "");
      setLastName(u.lastName || "");
      setPhone(u.phone ? formatPhoneDisplay(u.phone) : "");
      setNewsletter(u.acceptsMarketing || false);
      if (u.dob) {
        const [y, m, d] = u.dob.split("-");
        setDobYear(y || "");
        setDobMonth(m ? String(parseInt(m)) : "");
        setDobDay(d ? String(parseInt(d)) : "");
      }
      const stored = localStorage.getItem(`avatar-${u.id}`);
      if (stored) setAvatar(stored);
      const bg = localStorage.getItem(`profile-bg-${u.id}`);
      if (bg) setProfileBg(bg);
      const customBg = localStorage.getItem(`profile-bg-img-${u.id}`);
      if (customBg) setCustomBgImage(customBg);
    };

    // Show cached session instantly while fetching fresh data
    try {
      const cached = sessionStorage.getItem("atheles-session");
      if (cached) {
        const u = JSON.parse(cached) as User;
        applyUser(u);
        setLoading(false);
      }
    } catch { /* ignore */ }

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          applyUser(data.user);
          sessionStorage.setItem("atheles-session", JSON.stringify(data.user));
        } else {
          sessionStorage.removeItem("atheles-session");
          setUser(null);
          setRedirecting(true);
          window.location.href = "/login";
          return;
        }
        setLoading(false);
      })
      .catch(() => {
        sessionStorage.removeItem("atheles-session");
        setUser(null);
        setRedirecting(true);
        window.location.href = "/login";
      });
  }, [router]);

  const handleSignOut = async () => {
    sessionStorage.removeItem("atheles-session");
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage("image must be under 5mb.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleCropSave = (croppedDataUrl: string) => {
    if (!user) return;
    setAvatar(croppedDataUrl);
    try {
      localStorage.setItem(`avatar-${user.id}`, croppedDataUrl);
    } catch {
      setSaveMessage("photo saved for this session only (storage full).");
    }
    setCropSrc(null);
    window.dispatchEvent(new Event("avatar-changed"));
  };

  const handleCropCancel = () => {
    setCropSrc(null);
  };

  const handleRemoveAvatar = () => {
    if (!user) return;
    setAvatar(null);
    localStorage.removeItem(`avatar-${user.id}`);
    window.dispatchEvent(new Event("avatar-changed"));
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      setSaveMessage("first name is required.");
      return;
    }
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim() || "",
          phone: phone ? phoneToE164(phone) : "",
          acceptsMarketing: newsletter,
          dob:
            dobDay && dobMonth && dobYear
              ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`
              : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setFirstName(data.user.firstName || "");
        setLastName(data.user.lastName || "");
        setPhone(data.user.phone ? formatPhoneDisplay(data.user.phone) : "");
        if (data.user.dob) {
          const [y, m, d] = data.user.dob.split("-");
          setDobYear(y || "");
          setDobMonth(m ? String(parseInt(m)) : "");
          setDobDay(d ? String(parseInt(d)) : "");
        }
        sessionStorage.setItem("atheles-session", JSON.stringify(data.user));
        setEditing(false);
        setSaveMessage("profile updated.");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage(data.error || "failed to save.");
      }
    } catch {
      setSaveMessage("something went wrong.");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    if (!user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setPhone(user.phone ? formatPhoneDisplay(user.phone) : "");
    setNewsletter(user.acceptsMarketing);
    if (user.dob) {
      const [y, m, d] = user.dob.split("-");
      setDobYear(y || "");
      setDobMonth(m ? String(parseInt(m)) : "");
      setDobDay(d ? String(parseInt(d)) : "");
    } else {
      setDobDay("");
      setDobMonth("");
      setDobYear("");
    }
    setEditing(false);
    setSaveMessage("");
  };

  if (loading || !user) {
    if (redirecting) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-brand-grey">redirecting to sign in...</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16 animate-pulse">
        {/* Avatar skeleton */}
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-4 h-24 w-24 rounded-full bg-brand-dark-gold/20" />
          <div className="mb-2 h-7 w-40 rounded bg-brand-dark-gold/15" />
          <div className="h-4 w-48 rounded bg-brand-dark-gold/10" />
          <div className="mt-2 h-3 w-32 rounded bg-brand-dark-gold/10" />
        </div>
        {/* Tier card skeleton */}
        <div className="mb-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6">
          <div className="mb-5 flex flex-col items-center gap-2">
            <div className="h-3 w-24 rounded bg-brand-dark-gold/15" />
            <div className="h-7 w-28 rounded bg-brand-dark-gold/15" />
          </div>
          <div className="mb-6 flex justify-center">
            <div className="h-12 w-32 rounded bg-brand-dark-gold/10" />
          </div>
          <div className="mb-3 h-6 w-full rounded-full bg-brand-dark-gold/10" />
          <div className="mb-5 flex justify-center">
            <div className="h-4 w-40 rounded bg-brand-dark-gold/10" />
          </div>
          <div className="mb-5 rounded-lg border border-brand-dark-gold/20 bg-brand-medium-grey/10 p-4">
            <div className="mb-3 h-3 w-20 rounded bg-brand-dark-gold/15" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-brand-dark-gold/10" />
              <div className="h-4 w-44 rounded bg-brand-dark-gold/10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 p-3 flex flex-col items-center gap-1">
              <div className="h-6 w-8 rounded bg-brand-dark-gold/15" />
              <div className="h-3 w-12 rounded bg-brand-dark-gold/10" />
            </div>
            <div className="rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 p-3 flex flex-col items-center gap-1">
              <div className="h-6 w-12 rounded bg-brand-dark-gold/15" />
              <div className="h-3 w-16 rounded bg-brand-dark-gold/10" />
            </div>
          </div>
        </div>
        {/* Settings skeleton */}
        <div className="mb-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
          <div className="mb-4 h-5 w-20 rounded bg-brand-dark-gold/15" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="mb-1 h-3 w-20 rounded bg-brand-dark-gold/10" />
                <div className="h-9 w-full rounded bg-brand-dark-gold/10" />
              </div>
            ))}
          </div>
        </div>
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

  const totalSpentNum = parseFloat(user.totalSpent || "0");
  const points = Math.floor(totalSpentNum * 50);
  const orders = parseInt(user.numberOfOrders || "0", 10);
  const tier = getTier(points);
  const nextTier = getNextTier(points);
  const progressInTier =
    tier.max === Infinity
      ? 100
      : Math.min(100, ((points - tier.min) / (tier.max - tier.min)) * 100);

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-12 sm:py-16">
      {/* Background layer */}
      {profileBg === "custom" && customBgImage ? (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={customBgImage} alt="" className="h-full w-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-brand-dark/70 to-brand-dark" />
        </div>
      ) : profileBg !== "none" ? (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className={`absolute inset-0 ${
            profileBg === "gold" ? "bg-gradient-to-br from-yellow-900/25 via-amber-800/15 to-yellow-950/20" :
            profileBg === "ember" ? "bg-gradient-to-br from-red-900/25 via-orange-800/15 to-red-950/20" :
            profileBg === "ocean" ? "bg-gradient-to-br from-cyan-900/25 via-teal-800/15 to-blue-950/20" :
            profileBg === "aurora" ? "bg-gradient-to-br from-purple-900/25 via-fuchsia-800/10 to-emerald-900/20" :
            profileBg === "midnight" ? "bg-gradient-to-br from-indigo-900/25 via-blue-800/15 to-violet-950/20" :
            ""
          }`} style={{ animation: "bgFloat 8s ease-in-out infinite" }} />
          {/* Floating particles */}
          <div className="absolute inset-0">
            <span className="absolute left-[10%] top-[20%] animate-pulse text-[6px] opacity-20" style={{ animationDuration: "3s", color: profileBg === "gold" ? "#c1a368" : profileBg === "ember" ? "#ef4444" : profileBg === "ocean" ? "#22d3ee" : profileBg === "aurora" ? "#a855f7" : "#6366f1" }}>&#10022;</span>
            <span className="absolute left-[70%] top-[15%] animate-pulse text-[8px] opacity-15" style={{ animationDuration: "4s", animationDelay: "1s", color: profileBg === "gold" ? "#c1a368" : profileBg === "ember" ? "#ef4444" : profileBg === "ocean" ? "#22d3ee" : profileBg === "aurora" ? "#a855f7" : "#6366f1" }}>&#10022;</span>
            <span className="absolute left-[40%] top-[60%] animate-pulse text-[5px] opacity-20" style={{ animationDuration: "3.5s", animationDelay: "2s", color: profileBg === "gold" ? "#c1a368" : profileBg === "ember" ? "#ef4444" : profileBg === "ocean" ? "#22d3ee" : profileBg === "aurora" ? "#a855f7" : "#6366f1" }}>&#10022;</span>
            <span className="absolute left-[85%] top-[45%] animate-pulse text-[7px] opacity-15" style={{ animationDuration: "4.5s", animationDelay: "0.5s", color: profileBg === "gold" ? "#c1a368" : profileBg === "ember" ? "#ef4444" : profileBg === "ocean" ? "#22d3ee" : profileBg === "aurora" ? "#a855f7" : "#6366f1" }}>&#10022;</span>
            <span className="absolute left-[25%] top-[80%] animate-pulse text-[6px] opacity-20" style={{ animationDuration: "3.8s", animationDelay: "1.5s", color: profileBg === "gold" ? "#c1a368" : profileBg === "ember" ? "#ef4444" : profileBg === "ocean" ? "#22d3ee" : profileBg === "aurora" ? "#a855f7" : "#6366f1" }}>&#10022;</span>
          </div>
          <style jsx>{`
            @keyframes bgFloat {
              0%, 100% { transform: scale(1) rotate(0deg); }
              50% { transform: scale(1.05) rotate(1deg); }
            }
          `}</style>
        </div>
      ) : null}

      <div className="relative">
      {/* Crop Modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />
      )}

      {/* Avatar Preview Modal */}
      {showAvatarPreview && avatar && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setShowAvatarPreview(false)}
        >
          <button
            type="button"
            onClick={() => setShowAvatarPreview(false)}
            className="absolute right-4 top-4 text-white/70 transition-colors hover:text-white"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="overflow-hidden rounded-full border-4 border-brand-gold/50 shadow-[0_0_40px_rgba(193,163,104,0.2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt="Profile photo"
                className="h-64 w-64 object-cover sm:h-80 sm:w-80"
              />
            </div>
            <p className="font-heading text-xl text-brand-gold">{user.name}</p>
            <p className="text-sm text-brand-grey">{user.email}</p>
          </div>
        </div>
      )}

      {/* Avatar & Name */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="group relative mb-4">
          <div
            className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-brand-gold ${avatar ? "cursor-pointer" : ""} bg-brand-dark-gold/20`}
            onClick={() => avatar && setShowAvatarPreview(true)}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="Profile photo"
                width={96}
                height={96}
                className="h-full w-full rounded-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <span className="font-heading text-2xl text-brand-gold">
                {initials}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-brand-dark-gold/30 bg-brand-dark text-brand-grey transition-colors hover:border-brand-gold hover:text-brand-gold"
            aria-label="Change profile photo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        {avatar && (
          <div className="mb-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-brand-grey transition-colors hover:text-brand-gold"
            >
              change photo
            </button>
            <span className="text-brand-dark-gold/30">|</span>
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-xs text-brand-grey transition-colors hover:text-red-400"
            >
              remove
            </button>
          </div>
        )}
        <h1 className="font-heading text-2xl text-brand-gold sm:text-3xl">
          {user.name}
        </h1>
        <p className="mt-1 text-sm text-brand-grey">{user.email}</p>
        <p className="mt-1 text-xs uppercase tracking-wider text-brand-dark-gold">
          member since {memberSince}
        </p>
      </div>

      {/* Points & Tier Progress */}
      <div className="relative mb-8 overflow-hidden rounded-lg border border-brand-dark-gold/20 bg-brand-dark">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-gold/5 via-transparent to-brand-gold/3" />

        <div className="relative p-6" style={{ textTransform: "uppercase" }}>
          {/* Header - gradient title + tier name */}
          <div className="mb-5 text-center">
            <p
              className={`mb-1.5 bg-gradient-to-r ${tier.titleGradient} bg-clip-text text-xs font-medium tracking-[0.25em] text-transparent`}
            >
              LOYALTY REWARDS
            </p>
            <p
              className={`bg-gradient-to-r ${tier.titleGradient} bg-clip-text text-2xl font-medium tracking-[0.25em] text-transparent`}
            >
              {tier.name}
            </p>
          </div>

          {/* Points display */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <p className="text-center text-5xl font-light tracking-tight text-brand-gold">
                {points.toLocaleString()}
              </p>
              <p className="mt-0.5 text-center text-xs tracking-[0.2em] text-brand-pale-gold/60">
                POINTS EARNED
              </p>
              {/* Decorative sparkles */}
              <span
                className="absolute -left-4 -top-1 animate-pulse text-brand-gold/40"
                style={{ animationDuration: "2.5s" }}
              >
                &#10022;
              </span>
              <span
                className="absolute -right-4 top-2 animate-pulse text-brand-gold/30"
                style={{ animationDuration: "3s", animationDelay: "0.8s" }}
              >
                &#10022;
              </span>
            </div>
          </div>

          {/* Current tier → Next tier labels */}
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`bg-gradient-to-r ${tier.titleGradient} bg-clip-text text-xs font-medium tracking-[0.15em] text-transparent`}
            >
              {tier.name}
            </span>
            {nextTier ? (
              <span
                className={`bg-gradient-to-r ${nextTier.titleGradient} bg-clip-text text-xs font-medium tracking-[0.15em] text-transparent`}
              >
                {nextTier.name}
              </span>
            ) : (
              <span className="text-xs tracking-wider text-brand-pale-gold/50">
                MAX
              </span>
            )}
          </div>

          {/* Tier progress bar */}
          <div className="mb-3">
            <div className="relative h-6 w-full overflow-hidden rounded-full bg-brand-dark-gold/10 shadow-inner">
              {/* Filled bar */}
              <div
                className={`relative h-full rounded-full bg-gradient-to-r ${tier.barGradient} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.max(progressInTier, 3)}%` }}
              >
                {/* Smooth shimmer */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ animation: "shimmerFlow 3s ease-in-out infinite" }}
                >
                  <div
                    className="h-full w-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.12) 60%, transparent 100%)",
                    }}
                  />
                </div>
                {/* Sparkles across the bar */}
                <span
                  className="absolute left-[12%] top-1 animate-pulse text-[5px] text-white/50"
                  style={{ animationDuration: "2s" }}
                >
                  &#10022;
                </span>
                <span
                  className="absolute left-[30%] top-3 animate-pulse text-[4px] text-white/40"
                  style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
                >
                  &#10022;
                </span>
                <span
                  className="absolute left-[50%] top-0.5 animate-pulse text-[5px] text-white/50"
                  style={{ animationDuration: "2.2s", animationDelay: "1s" }}
                >
                  &#10022;
                </span>
                <span
                  className="absolute left-[70%] top-2.5 animate-pulse text-[4px] text-white/35"
                  style={{ animationDuration: "2.8s", animationDelay: "1.5s" }}
                >
                  &#10022;
                </span>
                <span
                  className="absolute left-[88%] top-1 animate-pulse text-[5px] text-white/45"
                  style={{ animationDuration: "2.3s", animationDelay: "0.3s" }}
                >
                  &#10022;
                </span>
                {/* Edge glow */}
                <div className="absolute right-0 top-0 h-full w-4 rounded-full bg-white/15 blur-sm" />
              </div>
            </div>
          </div>

          {/* Progress text */}
          <div className="mb-5 text-center">
            {nextTier ? (
              <p
                className="text-xs text-brand-grey"
                style={{ textTransform: "none" }}
              >
                <span className="text-brand-pale-gold">
                  {(nextTier.min - points).toLocaleString()}
                </span>{" "}
                points to{" "}
                <span
                  className={`bg-gradient-to-r ${nextTier.titleGradient} bg-clip-text font-medium text-transparent`}
                  style={{ textTransform: "uppercase" }}
                >
                  {nextTier.name}
                </span>
              </p>
            ) : (
              <p className="text-xs text-brand-pale-gold">
                &#10022; MAX TIER ACHIEVED &#10022;
              </p>
            )}
          </div>

          {/* Current perks */}
          <div
            className="mb-5 rounded-lg border border-brand-dark-gold/20 bg-brand-medium-grey/10 p-4"
            style={{ textTransform: "none" }}
          >
            <p
              className="mb-2.5 text-xs font-medium tracking-[0.15em] text-brand-pale-gold"
              style={{ textTransform: "uppercase" }}
            >
              YOUR PERKS
            </p>
            {tier.perks.length > 0 ? (
              <ul className="space-y-2">
                {tier.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2.5 text-sm text-white"
                  >
                    <span
                      className={`bg-gradient-to-r ${tier.titleGradient} bg-clip-text text-xs text-transparent`}
                    >
                      &#10022;
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/70">
                reach{" "}
                <span
                  className={`bg-gradient-to-r ${TIERS[1]!.titleGradient} bg-clip-text font-medium text-transparent`}
                  style={{ textTransform: "uppercase" }}
                >
                  SILVER
                </span>{" "}
                to unlock your first perks
              </p>
            )}
            {nextTier && nextTier.perks.length > 0 && (
              <div className="mt-3.5 border-t border-brand-dark-gold/15 pt-3.5">
                <p
                  className="mb-2 text-xs font-medium tracking-[0.15em] text-brand-grey"
                  style={{ textTransform: "uppercase" }}
                >
                  NEXT AT{" "}
                  <span
                    className={`bg-gradient-to-r ${nextTier.titleGradient} bg-clip-text text-transparent`}
                  >
                    {nextTier.name}
                  </span>
                </p>
                <ul className="space-y-1.5">
                  {nextTier.perks
                    .filter((p) => !tier.perks.includes(p))
                    .map((perk) => (
                      <li
                        key={perk}
                        className="flex items-center gap-2.5 text-sm text-white/50"
                      >
                        <span className="text-xs text-brand-dark-gold">
                          &#10022;
                        </span>
                        {perk}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 p-3 text-center">
              <p className="font-heading text-xl text-brand-gold">{orders}</p>
              <p className="text-xs uppercase tracking-wider text-brand-grey">
                orders
              </p>
            </div>
            <div className="rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 p-3 text-center">
              <p className="font-heading text-xl text-brand-gold">
                ${totalSpentNum.toFixed(0)}
              </p>
              <p className="text-xs uppercase tracking-wider text-brand-grey">
                total spent
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-brand-grey/50">
            earn <span className="text-brand-pale-gold">50 points</span> per $1
            spent &#183; unlock exclusive tiers & perks
          </p>
        </div>

        {/* Animation keyframes */}
        <style jsx>{`
          @keyframes shimmerFlow {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(200%);
            }
          }
          @keyframes glitter {
            0%,
            100% {
              opacity: 0;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}</style>
      </div>

      {/* Profile Settings */}
      <div className="mb-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg text-brand-pale-gold">
            settings
          </h2>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-brand-gold transition-colors hover:text-brand-light-gold"
            >
              edit profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-brand-grey transition-colors hover:text-white"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-brand-gold px-3 py-1 text-xs font-medium text-brand-dark transition-colors hover:bg-brand-light-gold disabled:opacity-50"
              >
                {saving ? "saving..." : "save"}
              </button>
            </div>
          )}
        </div>

        {saveMessage && (
          <p
            className={`mb-3 text-xs ${saveMessage.includes("updated") ? "text-green-400" : "text-red-400"}`}
          >
            {saveMessage}
          </p>
        )}

        <div className="space-y-4">
          {/* First Name */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-brand-grey">
              first name
            </label>
            {editing ? (
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-3 py-2 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                placeholder="rowan"
              />
            ) : (
              <p className="px-3 py-2 text-sm text-white">
                {user.firstName || (
                  <span className="text-brand-grey/50">not set</span>
                )}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="mb-1 flex items-baseline gap-1.5 text-xs uppercase tracking-wider text-brand-grey">
              last name
              <span className="normal-case tracking-normal text-brand-grey/40">
                optional
              </span>
            </label>
            {editing ? (
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-3 py-2 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                placeholder="le coq"
              />
            ) : (
              <p className="px-3 py-2 text-sm text-white">
                {user.lastName || (
                  <span className="text-brand-grey/50">not set</span>
                )}
              </p>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-brand-grey">
              email
            </label>
            <p className="px-3 py-2 text-sm text-brand-grey">{user.email}</p>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-brand-grey">
              date of birth
            </label>
            {editing ? (
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value)}
                  className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none"
                  aria-label="Day"
                >
                  <option value="">day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  value={dobMonth}
                  onChange={(e) => setDobMonth(e.target.value)}
                  className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none"
                  aria-label="Month"
                >
                  <option value="">month</option>
                  {[
                    "jan",
                    "feb",
                    "mar",
                    "apr",
                    "may",
                    "jun",
                    "jul",
                    "aug",
                    "sep",
                    "oct",
                    "nov",
                    "dec",
                  ].map((m, i) => (
                    <option key={m} value={String(i + 1)}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value)}
                  className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none"
                  aria-label="Year"
                >
                  <option value="">year</option>
                  {Array.from(
                    { length: 100 },
                    (_, i) => new Date().getFullYear() - 13 - i,
                  ).map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="px-3 py-2 text-sm text-white">
                {user.dob ? (
                  new Date(user.dob + "T00:00:00").toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                ) : (
                  <span className="text-brand-grey/50">not set</span>
                )}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 flex items-baseline gap-1.5 text-xs uppercase tracking-wider text-brand-grey">
              phone number
              <span className="normal-case tracking-normal text-brand-grey/40">
                optional
              </span>
            </label>
            {editing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const raw = e.target.value;
                  const digits = raw.replace(/\D/g, "");
                  if (digits.length === 0) {
                    setPhone("");
                    return;
                  }
                  setPhone(formatPhoneDisplay(raw));
                }}
                className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-3 py-2 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                placeholder="+44 7911 123456"
              />
            ) : (
              <p className="px-3 py-2 text-sm text-white">
                {user.phone ? (
                  formatPhoneDisplay(user.phone)
                ) : (
                  <span className="text-brand-grey/50">not set</span>
                )}
              </p>
            )}
          </div>

          {/* Newsletter */}
          <div className="flex items-center justify-between rounded border border-brand-dark-gold/15 bg-brand-dark-gold/5 px-3 py-3">
            <div>
              <p className="text-sm text-white">newsletter</p>
              <p className="text-xs text-brand-grey">
                get notified about drops, offers & updates
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (editing) setNewsletter(!newsletter);
              }}
              disabled={!editing}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                newsletter ? "bg-brand-gold" : "bg-brand-dark-gold/30"
              } ${!editing ? "opacity-60" : "cursor-pointer"}`}
              aria-label="Toggle newsletter subscription"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  newsletter ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Background */}
      <div className="mb-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
        <h2 className="mb-4 font-heading text-lg text-brand-pale-gold">
          profile theme
        </h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {[
            { id: "none", label: "default", colors: "from-[#1a1a1a] to-[#222]" },
            { id: "gold", label: "gold", colors: "from-yellow-800/60 to-amber-900/60" },
            { id: "ember", label: "ember", colors: "from-red-800/60 to-orange-900/60" },
            { id: "ocean", label: "ocean", colors: "from-cyan-800/60 to-teal-900/60" },
            { id: "aurora", label: "aurora", colors: "from-purple-800/60 to-emerald-900/60" },
            { id: "midnight", label: "midnight", colors: "from-indigo-800/60 to-blue-900/60" },
          ].map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                setProfileBg(theme.id);
                if (user) localStorage.setItem(`profile-bg-${user.id}`, theme.id);
              }}
              className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all ${
                profileBg === theme.id
                  ? "ring-2 ring-brand-gold"
                  : "hover:ring-1 hover:ring-brand-dark-gold/50"
              }`}
            >
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${theme.colors} border border-white/10`} />
              <span className="text-[10px] text-brand-grey">{theme.label}</span>
            </button>
          ))}

          {/* Custom image */}
          <button
            type="button"
            onClick={() => {
              if (profileBg === "custom" && customBgImage) {
                // Already custom — let them pick a new image
                bgFileInputRef.current?.click();
              } else if (customBgImage) {
                // Has a saved custom image — apply it
                setProfileBg("custom");
                if (user) localStorage.setItem(`profile-bg-${user.id}`, "custom");
              } else {
                // No custom image yet — pick one
                bgFileInputRef.current?.click();
              }
            }}
            className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all ${
              profileBg === "custom"
                ? "ring-2 ring-brand-gold"
                : "hover:ring-1 hover:ring-brand-dark-gold/50"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-brand-dark-gold/40 bg-brand-dark-gold/10 overflow-hidden">
              {customBgImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customBgImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-brand-grey">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </div>
            <span className="text-[10px] text-brand-grey">custom</span>
          </button>
        </div>
        <input
          ref={bgFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file || !user) return;
            if (file.size > 5 * 1024 * 1024) {
              setSaveMessage("image must be under 5mb.");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              setCustomBgImage(dataUrl);
              setProfileBg("custom");
              try {
                localStorage.setItem(`profile-bg-img-${user.id}`, dataUrl);
                localStorage.setItem(`profile-bg-${user.id}`, "custom");
              } catch {
                setSaveMessage("image saved for this session only (storage full).");
              }
            };
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {/* Quick Links */}
      <div className="space-y-3">
        <h2 className="mb-4 font-heading text-lg text-brand-pale-gold">
          quick links
        </h2>
        <Link
          href="/favorites"
          className="flex items-center justify-between rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-4 py-3 transition-colors hover:border-brand-gold/30"
        >
          <span className="text-sm text-white">favorites</span>
          <span className="text-xs text-brand-grey">&rarr;</span>
        </Link>
        <Link
          href="/search"
          className="flex items-center justify-between rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-4 py-3 transition-colors hover:border-brand-gold/30"
        >
          <span className="text-sm text-white">shop</span>
          <span className="text-xs text-brand-grey">&rarr;</span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-between rounded-lg border border-red-900/30 bg-brand-dark px-4 py-3 transition-colors hover:border-red-700/50"
        >
          <span className="text-sm text-red-400">sign out</span>
          <span className="text-xs text-red-400/50">&rarr;</span>
        </button>
      </div>
      </div>
    </div>
  );
}
