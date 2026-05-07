/**
 * Module-level cache that deduplicates concurrent /api/auth/session calls.
 *
 * Multiple navbar components (AccountIcon, MobileMenu) both independently
 * fetch the session on every route change. Without this, every navigation
 * fires 2+ simultaneous identical requests. This module collapses them into
 * one in-flight promise and caches the result for a short TTL.
 */

type SessionData = { user: unknown } | null;

const SESSION_TTL_MS = 30_000;

let cached: SessionData = null;
let cacheTime = 0;
let inflight: Promise<SessionData> | null = null;

export function invalidateSessionCache() {
  cached = null;
  cacheTime = 0;
  inflight = null;
}

export async function fetchSession(): Promise<SessionData> {
  const now = Date.now();
  if (cached !== null && now - cacheTime < SESSION_TTL_MS) return cached;
  if (inflight) return inflight;

  inflight = fetch("/api/auth/session")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      cached = data;
      cacheTime = Date.now();
      inflight = null;
      return data;
    })
    .catch(() => {
      inflight = null;
      return null;
    });

  return inflight;
}
