"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Same intensity as profile page
const THEME_COLORS: Record<string, { a: string; b: string; c: string; d: string; particle: string }> = {
  gold: { a: "rgba(193,163,104,0.18)", b: "rgba(180,140,60,0.14)", c: "rgba(220,200,140,0.10)", d: "rgba(160,120,40,0.08)", particle: "#c1a368" },
  ocean: { a: "rgba(30,180,220,0.16)", b: "rgba(20,100,200,0.14)", c: "rgba(40,210,240,0.10)", d: "rgba(15,60,160,0.08)", particle: "#22d3ee" },
  tropical: { a: "rgba(16,185,129,0.16)", b: "rgba(245,158,11,0.12)", c: "rgba(20,200,160,0.10)", d: "rgba(250,180,50,0.07)", particle: "#10b981" },
  midnight: { a: "rgba(30,30,80,0.22)", b: "rgba(60,60,160,0.14)", c: "rgba(90,50,200,0.10)", d: "rgba(20,20,60,0.12)", particle: "#6366f1" },
  sunset: { a: "rgba(249,115,22,0.2)", b: "rgba(219,39,119,0.16)", c: "rgba(147,51,234,0.12)", d: "rgba(251,146,60,0.1)", particle: "#fb923c" },
};

// Sparkles and particles are now generated inline per theme

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

function getInitialState(): { theme: string | null; globalOn: boolean } {
  if (typeof window === "undefined") return { theme: null, globalOn: false };
  // Read from data attribute first (set by inline script before hydration)
  const bodyTheme = document.body.getAttribute("data-theme");
  const bodyGlobal = document.body.getAttribute("data-theme-global") === "1";
  if (bodyTheme && bodyTheme !== "none") return { theme: bodyTheme, globalOn: bodyGlobal };
  // Fallback to session cache
  if (!document.cookie.includes("atheles-logged-in=1")) return { theme: null, globalOn: false };
  const { theme, globalTheme } = readCache();
  if (theme && theme !== "none") return { theme, globalOn: !!globalTheme };
  return { theme: null, globalOn: false };
}

export function ThemeBackground() {
  const pathname = usePathname();
  // Read cached theme synchronously to avoid flash
  const [theme, setTheme] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const s = getInitialState();
    return s.theme;
  });
  const [globalOn, setGlobalOn] = useState(() => {
    if (typeof window === "undefined") return false;
    const s = getInitialState();
    return s.globalOn;
  });
  const [customBg, setCustomBg] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return sessionStorage.getItem("atheles-custom-bg-url") || null; } catch { return null; }
  });
  const initializedRef = useRef(false);

  const applyFromCache = () => {
    const { theme: t, globalTheme: g } = readCache();
    if (t && t !== "none") {
      setTheme(t);
      setGlobalOn(!!g);
      if (t === "custom") {
        // Show cached custom bg instantly
        try {
          const cached = sessionStorage.getItem("atheles-custom-bg-url");
          if (cached) setCustomBg(cached);
        } catch {}
        fetch("/api/auth/background")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.background) {
              setCustomBg(d.background);
              try { sessionStorage.setItem("atheles-custom-bg-url", d.background); } catch {}
            } else {
              setCustomBg(null);
              try { sessionStorage.removeItem("atheles-custom-bg-url"); } catch {}
            }
          })
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

    // Show from cache instantly
    const { theme: cachedTheme } = readCache();
    if (cachedTheme !== null) {
      applyFromCache();
    }

    // Always fetch fresh session in background to ensure full data
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

    const handleLogout = () => {
      setTheme(null);
      setGlobalOn(false);
      setCustomBg(null);
    };
    window.addEventListener("user-logout", handleLogout);

    return () => {
      window.removeEventListener("theme-changed", handleChange);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("user-logout", handleLogout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always render on profile page (theme is profile-only by default)
  // Only render on other pages if "use across entire store" is ON
  const isProfile = pathname === "/profile";
  if (!isProfile && !globalOn) return null;
  if (!theme || theme === "none") return null;

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

  if (!colors) return null;

  return (
    <div className="noise-overlay pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Base ambient glow — all themes */}
      <div className="absolute -inset-[40%]" style={{ background: `radial-gradient(ellipse 70% 60% at 30% 35%, ${colors.a}, transparent 60%)`, filter: "blur(70px)", animation: "gd1 18s ease-in-out infinite -5s" }} />
      <div className="absolute -inset-[40%]" style={{ background: `radial-gradient(ellipse 55% 70% at 70% 65%, ${colors.b}, transparent 60%)`, filter: "blur(80px)", animation: "gd2 22s ease-in-out infinite -10s" }} />
      <div className="absolute -inset-[30%]" style={{ background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${colors.c}, transparent 55%)`, filter: "blur(60px)", animation: "gd3 15s ease-in-out infinite -3s" }} />

      {/* === GOLD: warm shimmer glow === */}
      {theme === "gold" && <>
        <div className="absolute -inset-[30%]" style={{ background: "radial-gradient(ellipse 60% 40% at 60% 30%, rgba(220,200,140,0.1), transparent 55%)", filter: "blur(50px)", animation: "gd2 13s ease-in-out infinite -7s" }} />
      </>}

      {/* === OCEAN: caustic water light === */}
      {theme === "ocean" && <>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`oc${i}`} className="absolute" style={{
            width: "300%", height: `${30 + (i % 4) * 15}px`,
            background: `linear-gradient(90deg, transparent 5%, rgba(34,211,238,${0.03 + (i % 3) * 0.02}) 30%, rgba(6,182,212,${0.04 + (i % 2) * 0.02}) 50%, transparent 95%)`,
            top: `${5 + i * 12}%`, left: "-100%",
            transform: `rotate(${-10 + i * 3}deg)`,
            filter: "blur(18px)",
            animation: `gc${i % 3} ${10 + i * 1.5}s ease-in-out infinite ${-i * 1.3}s`,
          }} />
        ))}
      </>}

      {/* === TROPICAL: warm light rays === */}
      {theme === "tropical" && <>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`tr${i}`} className="absolute" style={{
            width: "300%", height: `${25 + i * 10}px`,
            background: `linear-gradient(90deg, transparent, rgba(${i % 2 ? "245,158,11" : "16,185,129"},${0.04 + i * 0.01}), transparent)`,
            top: `${8 + i * 18}%`, left: "-100%",
            transform: `rotate(${25 + i * 3}deg)`,
            filter: "blur(12px)",
            animation: `gt ${10 + i * 2}s ease-in-out infinite ${-i * 1.5}s`,
          }} />
        ))}
      </>}

      {/* === MIDNIGHT: stars === */}
      {theme === "midnight" && <>
        {Array.from({ length: 50 }).map((_, i) => (
          <span key={`ms${i}`} className="absolute rounded-full" style={{
            left: `${(i * 23 + 7) % 99}%`, top: `${(i * 41 + 3) % 99}%`,
            width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`,
            background: i % 4 === 0 ? "#c4b5fd" : i % 3 === 0 ? "#818cf8" : "#e0e7ff",
            opacity: 0.15 + (i % 4) * 0.12,
            animation: `gtw ${2 + (i % 5) * 0.5}s ease-in-out infinite ${(i * 0.1) % 5}s`,
          }} />
        ))}
      </>}

      {/* === SUNSET: orange/pink/purple atmosphere === */}
      {theme === "sunset" && <>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(147,51,234,0.12) 0%, rgba(219,39,119,0.1) 30%, rgba(249,115,22,0.14) 60%, rgba(251,146,60,0.1) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 200% 50% at 50% 55%, rgba(249,115,22,0.12), transparent 55%)", animation: "gsp 8s ease-in-out infinite" }} />
        <div className="absolute -inset-[30%]" style={{ background: "radial-gradient(ellipse 50% 50% at 20% 30%, rgba(147,51,234,0.1), transparent 55%)", filter: "blur(60px)", animation: "gd2 16s ease-in-out infinite -6s" }} />
        <div className="absolute -inset-[30%]" style={{ background: "radial-gradient(ellipse 50% 50% at 80% 70%, rgba(219,39,119,0.1), transparent 55%)", filter: "blur(60px)", animation: "gd1 14s ease-in-out infinite -8s" }} />
      </>}

      {/* Floating drift particles — all themes (like homepage gold particles) */}
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={`fp${i}`} className="absolute rounded-full" style={{
          left: `${(i * 23 + 5) % 96}%`, top: `${(i * 37 + 8) % 96}%`,
          width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
          background: colors.particle,
          opacity: 0.1 + (i % 4) * 0.06,
          animation: `gf${i % 3} ${12 + (i % 5) * 4}s ease-in-out infinite ${-i * 1.2}s`,
        }} />
      ))}

      {/* Sparkle glitter — all themes */}
      {Array.from({ length: 15 }).map((_, i) => (
        <span key={`sp${i}`} className="absolute" style={{
          left: `${(i * 31 + 9) % 96}%`, top: `${(i * 47 + 11) % 96}%`,
          fontSize: `${3 + (i % 4)}px`, color: colors.particle,
          animation: `gsk ${2.5 + (i % 4)}s ease-in-out infinite ${(i * 0.3) % 4}s`,
        }}>&#10022;</span>
      ))}

      <style jsx>{`
        @keyframes gd1 { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(8%,-6%) scale(1.1); } 66% { transform: translate(-7%,5%) scale(0.95); } }
        @keyframes gd2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-10%,-5%) scale(1.08); } }
        @keyframes gd3 { 0%, 100% { transform: translate(0,0) scale(1); opacity: 0.7; } 50% { transform: translate(5%,6%) scale(1.12); opacity: 1; } }
        @keyframes gc0 { 0%, 100% { transform: rotate(-10deg) translateX(-15%) translateY(0); opacity: 0.3; } 50% { transform: rotate(-6deg) translateX(15%) translateY(-25px); opacity: 0.8; } }
        @keyframes gc1 { 0%, 100% { transform: rotate(-6deg) translateX(10%) translateY(10px); opacity: 0.4; } 50% { transform: rotate(-10deg) translateX(-10%) translateY(-20px); opacity: 0.7; } }
        @keyframes gc2 { 0%, 100% { transform: rotate(-3deg) translateX(-8%) translateY(-5px); opacity: 0.25; } 33% { transform: rotate(-7deg) translateX(8%) translateY(18px); opacity: 0.6; } 66% { transform: rotate(-9deg) translateX(-5%) translateY(-12px); opacity: 0.5; } }
        @keyframes gt { 0%, 100% { opacity: 0.3; transform: rotate(25deg) translateX(-8%) translateY(0); } 50% { opacity: 0.7; transform: rotate(27deg) translateX(8%) translateY(-3%); } }
        @keyframes gtw { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.8; } }
        @keyframes gsp { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes gf0 { 0% { transform: translate(0,0); } 25% { transform: translate(35px,-25px); } 50% { transform: translate(-20px,30px); } 75% { transform: translate(25px,12px); } 100% { transform: translate(0,0); } }
        @keyframes gf1 { 0% { transform: translate(0,0); } 33% { transform: translate(-30px,20px); } 66% { transform: translate(25px,-22px); } 100% { transform: translate(0,0); } }
        @keyframes gf2 { 0% { transform: translate(0,0); } 20% { transform: translate(22px,28px); } 50% { transform: translate(-28px,-15px); } 80% { transform: translate(15px,-25px); } 100% { transform: translate(0,0); } }
        @keyframes gsk { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.08; } 50% { transform: translateY(-8px) scale(1.4); opacity: 0.45; } }
      `}</style>
    </div>
  );
}
