/**
 * Safely update the session cache in sessionStorage.
 * Preserves theme and globalTheme if the new data has them as null/missing,
 * preventing the background from disappearing when Shopify tag fetch fails.
 */
export function updateSessionCache(newUser: Record<string, unknown>) {
  try {
    const existing = sessionStorage.getItem("atheles-session");
    if (existing) {
      const cached = JSON.parse(existing);
      // Preserve theme if new data lost it (Shopify tag fetch may have failed)
      if ((!newUser.theme || newUser.theme === "none") && cached.theme && cached.theme !== "none") {
        newUser.theme = cached.theme;
        newUser.globalTheme = cached.globalTheme ?? newUser.globalTheme;
      }
    }
    sessionStorage.setItem("atheles-session", JSON.stringify(newUser));
  } catch {}
}
