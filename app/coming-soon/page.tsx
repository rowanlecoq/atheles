"use client";

import { useEffect, useState } from "react";

type LockData = {
  message: string;
  countdownEndsAt: string | null;
  backgroundImage: string | null;
  hasPassword: boolean;
};

function Countdown({ endsAt }: { endsAt: string }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setParts({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <div className="flex gap-6 text-center sm:gap-10">
      {(["days", "hours", "min", "sec"] as const).map((label, i) => {
        const val = [parts.d, parts.h, parts.m, parts.s][i];
        return (
          <div key={label}>
            <div className="font-heading text-5xl tabular-nums text-brand-gold drop-shadow-lg sm:text-6xl">
              {String(val).padStart(2, "0")}
            </div>
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-brand-dark-gold">
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ComingSoonPage() {
  const [data, setData] = useState<LockData>({
    message: "Something big is coming.",
    countdownEndsAt: null,
    backgroundImage: null,
    hasPassword: false,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [emailMsg, setEmailMsg] = useState("");
  const [passState, setPassState] = useState<"idle" | "loading" | "wrong">("idle");

  useEffect(() => {
    fetch("/api/site-lock")
      .then((r) => r.json())
      .then((d) => {
        setData({
          message: d.message || "Something big is coming.",
          countdownEndsAt: d.countdownEndsAt || null,
          backgroundImage: d.backgroundImage || null,
          hasPassword: true, // always show password entry — server validates
        });
      })
      .catch(() => {});
  }, []);

  const joinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (d.ok) {
        setEmailState("done");
        setEmailMsg(d.alreadyJoined ? "you're already on the list." : "you're in. we'll let you know.");
      } else {
        setEmailState("error");
        setEmailMsg("something went wrong. try again.");
      }
    } catch {
      setEmailState("error");
      setEmailMsg("something went wrong. try again.");
    }
  };

  const enterWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setPassState("loading");
    try {
      const res = await fetch("/api/site-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        setPassState("wrong");
      }
    } catch {
      setPassState("wrong");
    }
  };

  const countdownActive = data.countdownEndsAt && new Date(data.countdownEndsAt) > new Date();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Background image with overlay */}
      {data.backgroundImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.backgroundImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-dark/70" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm space-y-10 text-center animate-profile-slide-up">
        {/* Brand */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-brand-dark-gold">atheles 🔱</p>
          <h1 className="font-heading text-3xl leading-snug text-brand-gold sm:text-4xl">
            {data.message}
          </h1>
        </div>

        {/* Countdown */}
        {countdownActive && (
          <div className="flex justify-center">
            <Countdown endsAt={data.countdownEndsAt!} />
          </div>
        )}

        <div className="mx-auto h-px w-20 bg-brand-dark-gold/30" />

        {/* Waitlist */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-dark-gold">join the club</p>
          <p className="text-sm text-brand-grey">be the first to know when we launch.</p>
          {emailState === "done" ? (
            <p className="text-sm text-brand-gold">{emailMsg}</p>
          ) : (
            <form onSubmit={joinWaitlist} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your email"
                className="min-h-[44px] flex-1 rounded-lg border border-brand-dark-gold/30 bg-brand-dark/60 px-4 py-2.5 text-sm text-white placeholder-brand-grey/50 outline-none backdrop-blur-sm focus:border-brand-gold/50"
              />
              <button
                type="submit"
                disabled={emailState === "loading" || !email}
                className="min-h-[44px] rounded-lg bg-brand-gold/15 px-5 text-sm text-brand-gold backdrop-blur-sm transition-colors hover:bg-brand-gold/25 disabled:opacity-40"
              >
                {emailState === "loading" ? "..." : "join"}
              </button>
            </form>
          )}
          {emailState === "error" && <p className="text-xs text-red-400">{emailMsg}</p>}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-brand-dark-gold/20" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-brand-dark-gold/50">or</span>
          <div className="h-px flex-1 bg-brand-dark-gold/20" />
        </div>

        {/* Password */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-dark-gold">have access?</p>
          <form onSubmit={enterWithPassword} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPassState("idle"); }}
              placeholder="enter password"
              className="min-h-[44px] flex-1 rounded-lg border border-brand-dark-gold/30 bg-brand-dark/60 px-4 py-2.5 text-sm text-white placeholder-brand-grey/50 outline-none backdrop-blur-sm focus:border-brand-gold/50"
            />
            <button
              type="submit"
              disabled={passState === "loading" || !password}
              className="min-h-[44px] rounded-lg border border-brand-gold/35 px-5 text-sm text-brand-gold backdrop-blur-sm transition-colors hover:border-brand-gold/70 hover:bg-brand-gold/10 disabled:opacity-40"
            >
              {passState === "loading" ? "..." : "enter"}
            </button>
          </form>
          {passState === "wrong" && <p className="text-xs text-red-400">incorrect password.</p>}
        </div>

        {/* Socials */}
        <div className="flex justify-center gap-8 pt-2">
          <a
            href="https://www.instagram.com/atheles.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-wider text-brand-dark-gold transition-colors hover:text-brand-gold"
          >
            instagram
          </a>
          <a
            href="https://www.tiktok.com/@atheles.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-wider text-brand-dark-gold transition-colors hover:text-brand-gold"
          >
            tiktok
          </a>
        </div>
      </div>
    </div>
  );
}
