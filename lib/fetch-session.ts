/**
 * Deduplicates /api/auth/session calls.
 * Multiple components (AccountIcon, ThemeBackground, profile page) all call
 * this endpoint on mount. On PC they fire simultaneously, causing 3+ Shopify
 * API calls which triggers rate limiting. This ensures only ONE request
 * goes out at a time, and concurrent callers share the same promise.
 */

let activePromise: Promise<Record<string, unknown> | null> | null = null;
let lastFetchTime = 0;
const CACHE_MS = 2000; // Reuse result for 2 seconds

export async function fetchSession(): Promise<Record<string, unknown> | null> {
  // If we fetched very recently, reuse the same promise
  if (activePromise && Date.now() - lastFetchTime < CACHE_MS) {
    return activePromise;
  }

  lastFetchTime = Date.now();
  activePromise = fetch("/api/auth/session")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const result = d?.user || null;
      // Clear active promise after a short delay so next batch can fetch fresh
      setTimeout(() => { activePromise = null; }, CACHE_MS);
      return result;
    })
    .catch(() => {
      activePromise = null;
      return null;
    });

  return activePromise;
}
