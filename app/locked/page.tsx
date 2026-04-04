"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SiteLock = {
  locked: boolean;
  message: string;
  countdownTo: string | null;
};

function getTimeLeft(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    min: Math.floor((diff % 3600000) / 60000),
    sec: Math.floor((diff % 60000) / 1000),
    total: diff,
  };
}

export default function LockedPage() {
  const router = useRouter();
  const [lock, setLock] = useState<SiteLock | null>(null);
  const [countdown, setCountdown] = useState<ReturnType<typeof getTimeLeft> | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-lock")
      .then((r) => r.json())
      .then((d) => {
        if (d?.lock) {
          if (!d.lock.locked) {
            router.replace("/");
            return;
          }
          setLock(d.lock);
          if (d.lock.countdownTo) {
            setCountdown(getTimeLeft(d.lock.countdownTo));
          }
        }
      })
      .catch(() => {});
  }, [router]);

  // Countdown tick
  useEffect(() => {
    if (!lock?.countdownTo) return;
    const interval = setInterval(() => {
      const tl = getTimeLeft(lock.countdownTo!);
      setCountdown(tl);
      if (tl.total <= 0) {
        clearInterval(interval);
        // Auto-redirect when countdown reaches 0
        setTimeout(() => router.replace("/"), 1000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lock?.countdownTo, router]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-4 text-4xl">🔒</p>
      <h1 className="mb-3 font-heading text-3xl text-brand-gold">we&apos;ll be back</h1>
      <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-brand-grey">
        {lock?.message || "we're currently updating the site. check back soon."}
      </p>

      {countdown && lock?.countdownTo && countdown.total > 0 && (
        <div className="flex gap-4">
          {(["days", "hours", "min", "sec"] as const).map((unit) => (
            <div key={unit} className="text-center">
              <div className="min-w-[3.5rem] rounded-lg bg-brand-dark-gold/10 px-3 py-3 font-heading text-2xl tabular-nums text-brand-gold">
                {String(countdown[unit]).padStart(2, "0")}
              </div>
              <p className="mt-1.5 text-[10px] uppercase tracking-wider text-brand-grey">{unit}</p>
            </div>
          ))}
        </div>
      )}

      {countdown && countdown.total <= 0 && (
        <p className="text-sm text-green-400">we&apos;re back! redirecting...</p>
      )}
    </div>
  );
}
