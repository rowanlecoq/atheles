"use client";

import { fetchSession } from "lib/fetch-session";
import { updateSessionCache } from "lib/session-cache";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  theme: string | null;
  globalTheme: boolean;
  isAthlete: boolean;
  isAdmin: boolean;
  discountCode: string | null;
};

const TIERS = [
  {
    name: "BRONZE",
    min: 0,
    max: 5000,
    barGradient: "from-amber-900 via-amber-700 to-amber-500",
    titleGradient: "from-amber-500 via-amber-400 to-yellow-300",
    perks: [] as string[],
    discountCode: null as string | null,
    discountPercent: null as number | null,
  },
  {
    name: "SILVER",
    min: 5000,
    max: 15000,
    barGradient: "from-gray-500 via-gray-400 to-gray-300",
    titleGradient: "from-gray-300 via-gray-200 to-white",
    perks: ["10% loyalty discount"],
    discountCode: null as string | null,
    discountPercent: 10,
  },
  {
    name: "GOLD",
    min: 15000,
    max: 30000,
    barGradient: "from-yellow-700 via-yellow-500 to-amber-300",
    titleGradient: "from-yellow-400 via-yellow-300 to-amber-200",
    perks: ["early access", "12% loyalty discount"],
    discountCode: null as string | null,
    discountPercent: 12,
  },
  {
    name: "PLATINUM",
    min: 30000,
    max: 50000,
    barGradient: "from-cyan-700 via-cyan-400 to-cyan-200",
    titleGradient: "from-cyan-300 via-cyan-200 to-white",
    perks: [
      "early access",
      "15% loyalty discount",
      "birthday rewards",
    ],
    discountCode: null as string | null,
    discountPercent: 15,
  },
  {
    name: "CHAMPION",
    min: 50000,
    max: Infinity,
    barGradient: "from-fuchsia-700 via-purple-500 to-amber-400",
    titleGradient: "from-fuchsia-300 via-purple-300 to-amber-200",
    perks: [
      "exclusive access",
      "18% loyalty discount",
      "free shipping",
      "birthday rewards",
    ],
    discountCode: null as string | null,
    discountPercent: 18,
  },
];

const ADMIN_TIER = {
  name: "ADMIN",
  min: 0,
  max: Infinity,
  barGradient: "from-red-500 via-orange-400 to-amber-300",
  titleGradient: "from-red-400 via-orange-300 to-amber-200",
  perks: [] as string[],
  discountCode: null as string | null,
  discountPercent: null as number | null,
};

const ATHLETE_TIER = {
  name: "ATHLETE",
  min: 0,
  max: Infinity,
  barGradient: "from-sky-400 via-teal-300 to-amber-300",
  titleGradient: "from-sky-300 via-teal-200 to-amber-200",
  perks: [
    "exclusive access",
    "20% athlete discount",
    "free shipping",
    "birthday rewards",
    "event invitations",
    "personal discount code for your followers",
  ],
  discountCode: null as string | null,
  discountPercent: 20,
};

function getTier(points: number, isAthlete?: boolean, isAdmin?: boolean) {
  if (isAdmin) return ADMIN_TIER;
  if (isAthlete) return ATHLETE_TIER;
  return TIERS.find((t) => points >= t.min && points < t.max) || TIERS[0]!;
}

function getNextTier(points: number, isAthlete?: boolean, isAdmin?: boolean) {
  if (isAthlete || isAdmin) return null;
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
  const [avatarError, setAvatarError] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [discountRevealed, setDiscountRevealed] = useState(false);
  const [profileBg, setProfileBg] = useState("none");
  const [globalThemeOn, setGlobalThemeOn] = useState(false);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const prefsLoaded = { current: false };

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

      // Only load preferences (avatar, theme) once
      if (prefsLoaded.current) return;
      prefsLoaded.current = true;

      // Avatar: use per-user cache key so account switch shows correct data
      const cacheKey = `atheles-avatar-${u.email}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) setAvatar(cached);
      } catch {}
      fetch("/api/auth/avatar")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.avatar) {
            setAvatar(d.avatar);
            try { sessionStorage.setItem(cacheKey, d.avatar); } catch {}
          } else {
            setAvatar(null);
            try { sessionStorage.removeItem(cacheKey); } catch {}
          }
        })
        .catch(() => {});

      // Theme: server is source of truth
      const serverTheme = u.theme || "none";
      setProfileBg(serverTheme);
      setGlobalThemeOn(!!u.globalTheme);

      // Custom background: per-user cache key
      const bgCacheKey = `atheles-bg-${u.email}`;
      try {
        const cachedBg = sessionStorage.getItem(bgCacheKey);
        if (cachedBg) setCustomBgImage(cachedBg);
      } catch {}
      fetch("/api/auth/background")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.background) {
            setCustomBgImage(d.background);
            try { sessionStorage.setItem(bgCacheKey, d.background); } catch {}
          } else {
            setCustomBgImage(null);
            try { sessionStorage.removeItem(bgCacheKey); } catch {}
          }
        })
        .catch(() => {});
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

    fetchSession()
      .then((user) => {
        if (user) {
          applyUser(user as User);
          updateSessionCache(user as Record<string, unknown>);
          setLoading(false);
        } else {
          // Session returned null — could be transient Shopify API failure
          // Don't wipe session/cookies client-side; server handles that if truly invalid
          // Just use cached data if available
          try {
            const cached = sessionStorage.getItem("atheles-session");
            if (cached) {
              applyUser(JSON.parse(cached));
              setLoading(false);
              return;
            }
          } catch {}
          // No cache at all — redirect to login
          setUser(null);
          setLoading(false);
          setRedirecting(true);
          setTimeout(() => { window.location.replace("/login"); }, 100);
        }
      })
      .catch(() => {
        // Network error — use cached data, don't wipe anything
        try {
          const cached = sessionStorage.getItem("atheles-session");
          if (cached) {
            applyUser(JSON.parse(cached));
          }
        } catch {}
        setLoading(false);
      });
  }, [router]);

  const handleSignOut = async () => {
    // Clear ALL atheles keys from sessionStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("atheles-")) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    document.cookie = "atheles-logged-in=; max-age=0; path=/";
    // Notify all components to clear cached user data
    window.dispatchEvent(new Event("user-logout"));
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("image must be under 5mb.");
      setTimeout(() => setAvatarError(""), 4000);
      return;
    }
    setAvatarError("");
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleCropSave = async (croppedDataUrl: string) => {
    if (!user) return;
    setAvatar(croppedDataUrl);
    setCropSrc(null);
    try {
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: croppedDataUrl }),
      });
      const d = await res.json();
      if (d.success && d.url) {
        setAvatar(d.url);
      } else if (d.error) {
        setAvatarError(d.error);
        setTimeout(() => setAvatarError(""), 4000);
      }
    } catch {
      setAvatarError("failed to upload photo.");
      setTimeout(() => setAvatarError(""), 4000);
    }
    window.dispatchEvent(new Event("avatar-changed"));
  };

  const handleCropCancel = () => {
    setCropSrc(null);
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatar(null);
    window.dispatchEvent(new Event("avatar-changed"));
    await fetch("/api/auth/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar: null }),
    }).catch(() => {});
  };

  const [uploadingBg, setUploadingBg] = useState(false);

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
        updateSessionCache(data.user as Record<string, unknown>);
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
  const tier = getTier(points, user.isAthlete, user.isAdmin);
  const nextTier = getNextTier(points, user.isAthlete, user.isAdmin);
  const progressInTier =
    tier.max === Infinity
      ? 100
      : Math.min(100, ((points - tier.min) / (tier.max - tier.min)) * 100);

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-12 sm:py-16">
      {/* Background handled by global ThemeBackground component */}

      <div className="relative">
      {/* Crop Modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />
      )}

      {/* Avatar Preview Modal — portaled to cover everything including navbar */}
      {showAvatarPreview && avatar && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 p-4"
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
            <div className="overflow-hidden rounded-full">
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
        </div>,
        document.body,
      )}

      {/* Avatar & Name */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="group relative mb-4">
          <div
            className={`flex h-32 w-32 items-center justify-center overflow-hidden rounded-full sm:h-36 sm:w-36 ${avatar ? "cursor-pointer" : ""} bg-brand-dark-gold/20`}
            onClick={() => avatar && setShowAvatarPreview(true)}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="Profile photo"
                width={144}
                height={144}
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
        {avatarError && (
          <p className="mt-1 text-xs text-red-400">{avatarError}</p>
        )}
        <h1 className="font-heading text-2xl text-brand-gold sm:text-3xl">
          {user.name}
        </h1>
        <p className="mt-1 text-base text-brand-grey sm:text-sm">{user.email}</p>
        <p className="mt-1 text-sm uppercase tracking-wider text-brand-dark-gold sm:text-xs">
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
              <div className="mt-3.5 border-t border-brand-dark-gold/20 pt-3.5">
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
              <p className="text-sm uppercase tracking-wider text-brand-grey sm:text-xs">
                orders
              </p>
            </div>
            <div className="rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 p-3 text-center">
              <p className="font-heading text-xl text-brand-gold">
                ${totalSpentNum.toFixed(0)}
              </p>
              <p className="text-sm uppercase tracking-wider text-brand-grey sm:text-xs">
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

      {/* Monthly Discount Code */}
      {user.discountCode && tier.discountPercent && (
        <div className="mb-8 overflow-hidden rounded-lg border border-brand-dark-gold/20 bg-brand-dark">
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-brand-gold">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <h2 className="font-heading text-xl text-brand-pale-gold sm:text-lg">
                your loyalty discount
              </h2>
            </div>
            <p className="mb-4 text-sm text-brand-grey">
              as a{" "}
              <span className={`bg-gradient-to-r ${tier.titleGradient} bg-clip-text font-medium text-transparent`}>
                {tier.name}
              </span>
              {" "}member, you get {tier.discountPercent}% off every order. use this code at checkout:
            </p>

            {discountRevealed ? (
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-lg border border-brand-dark-gold/30 bg-brand-dark-gold/10 px-4 py-3 text-center font-mono text-lg tracking-wider text-brand-gold">
                    {user.discountCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(user.discountCode!).catch(() => {});
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                    className="flex h-12 w-12 flex-none items-center justify-center rounded-lg border border-brand-dark-gold/30 text-brand-grey transition-colors hover:border-brand-gold hover:text-brand-gold"
                    title="Copy code"
                  >
                    {codeCopied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-400">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
                {codeCopied && (
                  <p className="mt-2 text-center text-xs text-green-400">code copied!</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDiscountRevealed(true)}
                className={`group/reveal relative w-full overflow-hidden rounded-lg bg-gradient-to-r ${tier.barGradient} px-4 py-3 font-heading text-sm uppercase tracking-wider text-white`}
              >
                {/* Shimmer sweep */}
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/reveal:opacity-100"
                  style={{
                    background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 52%, transparent 70%)",
                    animation: "revealShimmer 2s ease-in-out infinite",
                  }}
                />
                {/* Sparkles on hover */}
                <span className="absolute left-[10%] top-[20%] text-[7px] text-white/0 transition-all duration-300 group-hover/reveal:text-white/50" style={{ animation: "revealSpark 1.5s ease-in-out infinite" }}>&#10022;</span>
                <span className="absolute left-[30%] top-[15%] text-[5px] text-white/0 transition-all duration-300 group-hover/reveal:text-white/40" style={{ animation: "revealSpark 1.8s ease-in-out infinite 0.3s" }}>&#10022;</span>
                <span className="absolute left-[55%] top-[70%] text-[6px] text-white/0 transition-all duration-300 group-hover/reveal:text-white/50" style={{ animation: "revealSpark 1.6s ease-in-out infinite 0.6s" }}>&#10022;</span>
                <span className="absolute left-[75%] top-[25%] text-[7px] text-white/0 transition-all duration-300 group-hover/reveal:text-white/40" style={{ animation: "revealSpark 2s ease-in-out infinite 0.2s" }}>&#10022;</span>
                <span className="absolute left-[90%] top-[60%] text-[5px] text-white/0 transition-all duration-300 group-hover/reveal:text-white/50" style={{ animation: "revealSpark 1.7s ease-in-out infinite 0.8s" }}>&#10022;</span>
                {/* Text with letter spacing on hover */}
                <span className="relative z-10 transition-all duration-300 group-hover/reveal:tracking-[0.25em]">
                  reveal your code
                </span>
                <style jsx>{`
                  @keyframes revealShimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
                  @keyframes revealSpark {
                    0%, 100% { opacity: 0; transform: scale(0.5); }
                    50% { opacity: 1; transform: scale(1.2); }
                  }
                `}</style>
              </button>
            )}

            <p className="mt-3 text-xs text-brand-grey/50">
              valid on every order &#183; applies to your entire cart
            </p>
          </div>
        </div>
      )}

      {/* Profile Settings */}
      <div className="mb-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl text-brand-pale-gold sm:text-lg">
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
            <label className="mb-1 block text-sm uppercase tracking-wider text-brand-grey sm:text-xs">
              first name
            </label>
            {editing ? (
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded border border-brand-dark-gold/30 bg-brand-dark px-3 py-2 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                placeholder="first name"
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
            <label className="mb-1 flex items-baseline gap-1.5 text-sm uppercase tracking-wider text-brand-grey sm:text-xs">
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
                placeholder="last name"
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
            <label className="mb-1 block text-sm uppercase tracking-wider text-brand-grey sm:text-xs">
              email
            </label>
            <p className="px-3 py-2 text-sm text-brand-grey">{user.email}</p>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="mb-1 block text-sm uppercase tracking-wider text-brand-grey sm:text-xs">
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
            <label className="mb-1 flex items-baseline gap-1.5 text-sm uppercase tracking-wider text-brand-grey sm:text-xs">
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
        <h2 className="mb-4 font-heading text-xl text-brand-pale-gold sm:text-lg">
          profile theme
        </h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {[
            { id: "none", label: "default", colors: "from-[#1a1a1a] to-[#222]" },
            { id: "gold", label: "gold", colors: "from-amber-500/60 to-yellow-700/60" },
            { id: "ocean", label: "ocean", colors: "from-cyan-500/60 to-blue-600/60" },
            { id: "tropical", label: "tropical", colors: "from-emerald-500/60 to-amber-500/60" },
            { id: "midnight", label: "midnight", colors: "from-indigo-600/70 to-violet-800/70" },
            { id: "sunset", label: "sunset", colors: "from-orange-500/60 via-pink-500/60 to-purple-600/60" },
          ].map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                setProfileBg(theme.id);
                if (user) {
                  // Update cached session so refresh doesn't revert
                  try {
                    const cached = sessionStorage.getItem("atheles-session");
                    if (cached) {
                      const u = JSON.parse(cached);
                      u.theme = theme.id;
                      updateSessionCache(u as Record<string, unknown>);
                    }
                  } catch {}
                  window.dispatchEvent(new Event("theme-changed"));
                  fetch("/api/auth/update-theme", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ theme: theme.id }),
                  }).catch(() => {});
                }
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
                if (user) {
                  try {
                    const cached = sessionStorage.getItem("atheles-session");
                    if (cached) {
                      const u = JSON.parse(cached);
                      u.theme = "custom";
                      updateSessionCache(u as Record<string, unknown>);
                    }
                  } catch {}
                  window.dispatchEvent(new Event("theme-changed"));
                  fetch("/api/auth/update-theme", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ theme: "custom" }),
                  }).catch(() => {});
                }
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-brand-dark-gold/10 overflow-hidden">
              {customBgImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customBgImage} alt="" className="h-full w-full object-cover opacity-70" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-brand-grey">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </div>
            <span className="text-[10px] text-brand-grey">
              {uploadingBg ? "uploading..." : "custom"}
            </span>
          </button>
        </div>
        <input
          ref={bgFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file || !user) return;
            if (file.size > 10 * 1024 * 1024) {
              setSaveMessage("image must be under 10mb.");
              return;
            }
            setUploadingBg(true);
            const reader = new FileReader();
            reader.onload = () => {
              const img = new window.Image();
              img.onload = async () => {
                const canvas = document.createElement("canvas");
                const maxSize = 1920;
                let w = img.width;
                let h = img.height;
                if (w > maxSize || h > maxSize) {
                  if (w > h) {
                    h = Math.round((h * maxSize) / w);
                    w = maxSize;
                  } else {
                    w = Math.round((w * maxSize) / h);
                    h = maxSize;
                  }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) { setUploadingBg(false); return; }
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

                setCustomBgImage(dataUrl);
                setProfileBg("custom");

                // Upload to Vercel Blob and wait for it to complete
                try {
                  const res = await fetch("/api/auth/background", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ background: dataUrl }),
                  });
                  const d = await res.json();
                  if (d.success && d.url) {
                    setCustomBgImage(d.url);
                  } else if (d.error) {
                    setSaveMessage(d.error);
                  }
                } catch {
                  setSaveMessage("failed to upload background.");
                }

                // Update theme on server
                try {
                  const cached = sessionStorage.getItem("atheles-session");
                  if (cached) {
                    const u = JSON.parse(cached);
                    u.theme = "custom";
                    updateSessionCache(u as Record<string, unknown>);
                  }
                } catch {}
                await fetch("/api/auth/update-theme", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ theme: "custom" }),
                }).catch(() => {});

                setUploadingBg(false);
              };
              img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
          className="hidden"
        />

        {/* Global theme toggle */}
        {profileBg !== "none" && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 px-4 py-3">
            <div>
              <p className="text-sm text-white">use across entire store</p>
              <p className="text-xs text-brand-grey">
                {globalThemeOn
                  ? "theme is visible on all pages"
                  : "theme is only on your profile"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !globalThemeOn;
                setGlobalThemeOn(next);
                // Update cached session
                try {
                  const cached = sessionStorage.getItem("atheles-session");
                  if (cached) {
                    const u = JSON.parse(cached);
                    u.globalTheme = next;
                    updateSessionCache(u as Record<string, unknown>);
                  }
                } catch {}
                // Notify other components
                window.dispatchEvent(new Event("theme-changed"));
                // Save to server
                fetch("/api/auth/update-theme", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ globalTheme: next }),
                }).catch(() => {});
              }}
              className={`relative h-6 w-11 flex-none rounded-full transition-colors ${
                globalThemeOn ? "bg-brand-gold" : "bg-brand-dark-gold/30"
              }`}
              aria-label="Toggle global theme"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  globalThemeOn ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="space-y-3">
        <h2 className="mb-4 font-heading text-xl text-brand-pale-gold sm:text-lg">
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
          <span className="text-sm text-white">store</span>
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
