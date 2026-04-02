"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Same intensity as profile page
const THEME_COLORS: Record<string, { a: string; b: string; c: string; d: string; particle: string }> = {
  gold: { a: "rgba(193,163,104,0.18)", b: "rgba(180,140,60,0.14)", c: "rgba(220,200,140,0.10)", d: "rgba(160,120,40,0.08)", particle: "#c1a368" },
  ocean: { a: "rgba(30,180,220,0.16)", b: "rgba(20,100,200,0.14)", c: "rgba(40,210,240,0.10)", d: "rgba(15,60,160,0.08)", particle: "#22d3ee" },
  tropical: { a: "rgba(16,185,129,0.16)", b: "rgba(245,158,11,0.12)", c: "rgba(20,200,160,0.10)", d: "rgba(250,180,50,0.07)", particle: "#10b981" },
  midnight: { a: "rgba(30,30,80,0.22)", b: "rgba(60,60,160,0.14)", c: "rgba(90,50,200,0.10)", d: "rgba(20,20,60,0.12)", particle: "#6366f1" },
  aurora: { a: "rgba(120,60,220,0.16)", b: "rgba(40,200,140,0.14)", c: "rgba(220,60,180,0.10)", d: "rgba(80,180,255,0.08)", particle: "#a855f7" },
};

const SPARKLES = [
  { x: "12%", y: "18%", size: "6px", dur: "3s", delay: "0s" },
  { x: "68%", y: "12%", size: "8px", dur: "4s", delay: "1s" },
  { x: "35%", y: "55%", size: "5px", dur: "3.5s", delay: "2s" },
  { x: "82%", y: "42%", size: "7px", dur: "4.5s", delay: "0.5s" },
  { x: "22%", y: "78%", size: "6px", dur: "3.8s", delay: "1.5s" },
  { x: "55%", y: "88%", size: "5px", dur: "4.2s", delay: "0.8s" },
  { x: "90%", y: "72%", size: "7px", dur: "3.2s", delay: "2.5s" },
];

function readCache(): { theme: string | null; globalTheme: boolean } {
  try {
    const cached = sessionStorage.getItem("atheles-session");
    if (cached) {
      const u = JSON.parse(cached);
      return { theme: u.theme || null, globalTheme: !!u.globalTheme };
    }
  } catch {}
  return { theme: null, globalTheme: false };
}

export function ThemeBackground() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<string | null>(null);
  const [globalOn, setGlobalOn] = useState(false);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const applyFromCache = () => {
    const { theme: t, globalTheme: g } = readCache();
    if (g && t && t !== "none") {
      setTheme(t);
      setGlobalOn(true);
      if (t === "custom") {
        fetch("/api/auth/background")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => { if (d?.background) setCustomBg(d.background); })
          .catch(() => {});
      }
    } else {
      setTheme(null);
      setGlobalOn(false);
    }
  };

  useEffect(() => {
    const loggedIn = document.cookie.includes("atheles-logged-in=1");
    if (!loggedIn) {
      setTheme(null);
      setGlobalOn(false);
      setCustomBg(null);
      return;
    }

    // Check cache first
    const { theme: cachedTheme } = readCache();
    if (cachedTheme !== null) {
      // Cache exists — use it (it's the source of truth, written by profile page)
      applyFromCache();
      initializedRef.current = true;
    } else {
      // No cache — fetch session to populate it, then read
      fetch("/api/auth/session")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.user) {
            try {
              sessionStorage.setItem("atheles-session", JSON.stringify(data.user));
            } catch {}
            applyFromCache();
          }
        })
        .catch(() => {});
      initializedRef.current = true;
    }

    // Listen for profile page theme changes (cache is already updated when this fires)
    const handleChange = () => applyFromCache();
    window.addEventListener("theme-changed", handleChange);

    // Re-sync from server when tab regains focus (cross-device sync)
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!document.cookie.includes("atheles-logged-in=1")) return;
      fetch("/api/auth/session")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.user) {
            try {
              sessionStorage.setItem("atheles-session", JSON.stringify(data.user));
            } catch {}
            applyFromCache();
          }
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("theme-changed", handleChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't render on profile page — it has its own background
  if (pathname === "/profile") return null;

  // Don't render if global theme is off or no theme set
  if (!globalOn || !theme || theme === "none") return null;

  const colors = THEME_COLORS[theme];

  // Custom image background
  if (theme === "custom" && customBg) {
    return (
      <div className="noise-overlay pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={customBg} alt="" className="h-full w-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-brand-dark/70 to-brand-dark" />
      </div>
    );
  }

  // Animated gradient background
  if (!colors) return null;

  return (
    <div className="noise-overlay pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute -inset-[60%]"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 25% 35%, ${colors.a}, transparent 65%)`,
          filter: "blur(80px)",
          animation: "gdrift1 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -inset-[60%]"
        style={{
          background: `radial-gradient(ellipse 55% 70% at 75% 65%, ${colors.b}, transparent 65%)`,
          filter: "blur(90px)",
          animation: "gdrift2 25s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -inset-[40%]"
        style={{
          background: `radial-gradient(ellipse 50% 50% at 50% 45%, ${colors.c}, transparent 60%)`,
          filter: "blur(70px)",
          animation: "gdrift3 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -inset-[50%]"
        style={{
          background: `radial-gradient(ellipse 45% 55% at 40% 70%, ${colors.d}, transparent 60%)`,
          filter: "blur(100px)",
          animation: "gdrift4 22s ease-in-out infinite",
        }}
      />
      {SPARKLES.map((p, i) => (
        <span
          key={i}
          className="absolute animate-pulse"
          style={{
            left: p.x, top: p.y,
            fontSize: p.size,
            animationDuration: p.dur,
            animationDelay: p.delay,
            color: colors.particle,
            opacity: 0.25,
          }}
        >&#10022;</span>
      ))}
      <style jsx>{`
        @keyframes gdrift1 {
          0%, 100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          20% { transform: translate(6%, -4%) scale(1.08) rotate(1deg); }
          40% { transform: translate(-3%, 7%) scale(0.96) rotate(-0.5deg); }
          60% { transform: translate(-7%, -2%) scale(1.04) rotate(0.5deg); }
          80% { transform: translate(4%, 5%) scale(0.98) rotate(-1deg); }
        }
        @keyframes gdrift2 {
          0%, 100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          20% { transform: translate(-8%, 5%) scale(1.06) rotate(-1deg); }
          40% { transform: translate(5%, -6%) scale(0.94) rotate(0.5deg); }
          60% { transform: translate(7%, 8%) scale(1.02) rotate(-0.5deg); }
          80% { transform: translate(-4%, -5%) scale(1.07) rotate(1deg); }
        }
        @keyframes gdrift3 {
          0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.7; }
          25% { transform: translate(4%, -3%) scale(1.12); opacity: 0.9; }
          50% { transform: translate(-3%, 4%) scale(0.92); opacity: 1; }
          75% { transform: translate(-5%, -4%) scale(1.06); opacity: 0.8; }
        }
        @keyframes gdrift4 {
          0%, 100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          25% { transform: translate(-5%, -6%) scale(1.1) rotate(1.5deg); }
          50% { transform: translate(6%, 3%) scale(0.95) rotate(-1deg); }
          75% { transform: translate(3%, -5%) scale(1.05) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
}
