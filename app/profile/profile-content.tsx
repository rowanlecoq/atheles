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
};

const TIERS = [
  { name: "BRONZE", min: 0, max: 1000, barGradient: "from-amber-900 via-amber-700 to-amber-500", titleGradient: "from-amber-700 via-amber-500 to-amber-400" },
  { name: "SILVER", min: 1000, max: 3000, barGradient: "from-gray-500 via-gray-400 to-gray-300", titleGradient: "from-gray-400 via-gray-300 to-white" },
  { name: "GOLD", min: 3000, max: 5000, barGradient: "from-yellow-700 via-yellow-500 to-amber-300", titleGradient: "from-yellow-600 via-yellow-400 to-amber-200" },
  { name: "PLATINUM", min: 5000, max: 10000, barGradient: "from-cyan-700 via-cyan-400 to-cyan-200", titleGradient: "from-cyan-500 via-cyan-300 to-white" },
  { name: "CHAMPION", min: 10000, max: Infinity, barGradient: "from-fuchsia-700 via-purple-500 to-amber-400", titleGradient: "from-fuchsia-400 via-purple-300 to-amber-300" },
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
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setFirstName(data.user.firstName || "");
          setLastName(data.user.lastName || "");
          setPhone(data.user.phone ? formatPhoneDisplay(data.user.phone) : "");
          setNewsletter(data.user.acceptsMarketing || false);
          const stored = localStorage.getItem(`avatar-${data.user.id}`);
          if (stored) setAvatar(stored);
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
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setFirstName(data.user.firstName || "");
        setLastName(data.user.lastName || "");
        setPhone(data.user.phone ? formatPhoneDisplay(data.user.phone) : "");
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
    setEditing(false);
    setSaveMessage("");
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
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      {/* Crop Modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />
      )}

      {/* Avatar & Name */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="group relative mb-4">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-brand-gold bg-brand-dark-gold/20">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="Profile photo"
                width={96}
                height={96}
                className="h-full w-full rounded-full object-cover"
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
          <button
            type="button"
            onClick={handleRemoveAvatar}
            className="mb-2 text-[10px] text-brand-grey transition-colors hover:text-red-400"
          >
            remove photo
          </button>
        )}
        <h1 className="font-heading text-2xl text-brand-gold sm:text-3xl">
          {user.name}
        </h1>
        <p className="mt-1 text-sm text-brand-grey">{user.email}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-dark-gold">
          member since {memberSince}
        </p>
      </div>

      {/* Points & Tier Progress */}
      <div className="relative mb-8 overflow-hidden rounded-lg border border-brand-dark-gold/20 bg-brand-dark">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-gold/5 via-transparent to-brand-gold/3" />

        <div className="relative p-6">
          {/* Header - gradient title + tier name */}
          <div className="mb-5 text-center">
            <p
              className={`mb-1 bg-gradient-to-r ${tier.titleGradient} bg-clip-text text-[10px] tracking-[0.25em] text-transparent`}
              style={{ textTransform: "uppercase" }}
            >
              LOYALTY REWARDS
            </p>
            <p
              className={`bg-gradient-to-r ${tier.titleGradient} bg-clip-text text-3xl font-bold tracking-[0.2em] text-transparent`}
              style={{ fontFamily: "inherit", textTransform: "uppercase" }}
            >
              {tier.name}
            </p>
          </div>

          {/* Points display */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <p className="text-center font-heading text-5xl tracking-tight text-brand-gold">
                {points.toLocaleString()}
              </p>
              <p className="mt-0.5 text-center text-[10px] uppercase tracking-[0.2em] text-brand-pale-gold/60">
                POINTS EARNED
              </p>
            </div>
          </div>

          {/* Current tier → Next tier labels */}
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`bg-gradient-to-r ${tier.titleGradient} bg-clip-text text-[10px] font-bold tracking-[0.15em] text-transparent`}
            >
              {tier.name}
            </span>
            {nextTier ? (
              <span
                className={`bg-gradient-to-r ${nextTier.titleGradient} bg-clip-text text-[10px] font-bold tracking-[0.15em] text-transparent`}
              >
                {nextTier.name}
              </span>
            ) : (
              <span className="text-[10px] tracking-wider text-brand-pale-gold/50">MAX</span>
            )}
          </div>

          {/* Tier progress bar - current to next only */}
          <div className="mb-3">
            <div className="relative h-6 w-full overflow-hidden rounded-full bg-brand-dark-gold/10 shadow-inner">
              {/* Filled bar */}
              <div
                className={`relative h-full rounded-full bg-gradient-to-r ${tier.barGradient} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.max(progressInTier, 3)}%` }}
              >
                {/* Single smooth shimmer */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 75%, transparent 100%)",
                    animation: "liquidFlow 4s ease-in-out infinite",
                  }}
                />
                {/* Edge glow */}
                <div className="absolute right-0 top-0 h-full w-4 rounded-full bg-white/15 blur-sm" />
              </div>
            </div>
          </div>

          {/* Progress text */}
          <div className="mb-5 text-center">
            {nextTier ? (
              <p className="text-xs text-brand-grey">
                <span className="text-brand-pale-gold">{(nextTier.min - points).toLocaleString()}</span> points to{" "}
                <span
                  className={`bg-gradient-to-r ${nextTier.titleGradient} bg-clip-text font-bold text-transparent`}
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

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 p-3 text-center">
              <p className="font-heading text-xl text-brand-gold">{orders}</p>
              <p className="text-[10px] uppercase tracking-wider text-brand-grey">
                orders
              </p>
            </div>
            <div className="rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 p-3 text-center">
              <p className="font-heading text-xl text-brand-gold">
                ${totalSpentNum.toFixed(0)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-brand-grey">
                total spent
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] text-brand-grey/50">
            earn <span className="text-brand-pale-gold">50 points</span> per $1 spent &#183; unlock exclusive tiers & perks
          </p>
        </div>

        {/* Animation keyframes */}
        <style jsx>{`
          @keyframes liquidFlow {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
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
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">
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
            <label className="mb-1 flex items-baseline gap-1.5 text-[10px] uppercase tracking-wider text-brand-grey">
              last name
              <span className="normal-case tracking-normal text-brand-grey/40">optional</span>
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
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">
              email
            </label>
            <p className="px-3 py-2 text-sm text-brand-grey">{user.email}</p>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 flex items-baseline gap-1.5 text-[10px] uppercase tracking-wider text-brand-grey">
              phone number
              <span className="normal-case tracking-normal text-brand-grey/40">optional</span>
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
                {user.phone ? formatPhoneDisplay(user.phone) : (
                  <span className="text-brand-grey/50">not set</span>
                )}
              </p>
            )}
          </div>

          {/* Newsletter */}
          <div className="flex items-center justify-between rounded border border-brand-dark-gold/15 bg-brand-dark-gold/5 px-3 py-3">
            <div>
              <p className="text-sm text-white">newsletter</p>
              <p className="text-[10px] text-brand-grey">
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
  );
}
