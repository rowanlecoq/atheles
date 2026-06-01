"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useState } from "react";

type SiteTheme = {
  brandGold: string;
  brandDarkGold: string;
  brandDark: string;
  headingStyle: "solid" | "gradient";
  headingColor: string;
  headingGradientFrom: string;
  headingGradientTo: string;
  logoDefault: string | null;
  logoHover: string | null;
  logoSmall: string | null;
};

const DEFAULT_THEME: SiteTheme = {
  brandGold: "#ccb173",
  brandDarkGold: "#7f6f4c",
  brandDark: "#1a1a1a",
  headingStyle: "solid",
  headingColor: "#ccb173",
  headingGradientFrom: "#ccb173",
  headingGradientTo: "#e5c685",
  logoDefault: null,
  logoHover: null,
  logoSmall: null,
};

const SEASONAL_PRESETS = [
  { name: "default",    gold: "#ccb173", darkGold: "#7f6f4c", dark: "#1a1a1a", from: "#ccb173", to: "#e5c685", style: "gradient" as const },
  { name: "winter",     gold: "#a8d8ea", darkGold: "#5b8fa8", dark: "#0f1923", from: "#a8d8ea", to: "#f0f8ff", style: "gradient" as const },
  { name: "christmas",  gold: "#c41e3a", darkGold: "#2d5a27", dark: "#1a0a0a", from: "#c41e3a", to: "#2d8c3c", style: "gradient" as const },
  { name: "halloween",  gold: "#ff6f00", darkGold: "#6a1b9a", dark: "#1a1010", from: "#ff6f00", to: "#9c27b0", style: "gradient" as const },
  { name: "autumn",     gold: "#d4763a", darkGold: "#8b4513", dark: "#1a1510", from: "#d4763a", to: "#c0392b", style: "gradient" as const },
  { name: "valentines", gold: "#e91e63", darkGold: "#880e4f", dark: "#1a0f14", from: "#e91e63", to: "#f48fb1", style: "gradient" as const },
  { name: "spring",     gold: "#66bb6a", darkGold: "#558b2f", dark: "#101a12", from: "#66bb6a", to: "#ffeb3b", style: "gradient" as const },
  { name: "summer",     gold: "#ffa726", darkGold: "#e65100", dark: "#1a1510", from: "#ffa726", to: "#ff7043", style: "gradient" as const },
  { name: "beach",      gold: "#26c6da", darkGold: "#00838f", dark: "#0f1a1c", from: "#26c6da", to: "#ffca28", style: "gradient" as const },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">{label}</label>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-brand-dark-gold/20 bg-transparent" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-2 py-1 font-mono text-xs text-white focus:border-brand-gold focus:outline-none" />
      </div>
    </div>
  );
}

export default function AdminThemePage() {
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    fetch("/api/admin/theme")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.theme) setTheme({ ...DEFAULT_THEME, ...d.theme }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const d = await res.json();
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSaveError(d.error || "save failed");
      }
    } catch {
      setSaveError("save failed");
    }
    setSaving(false);
  };

  const resetToDefault = async () => {
    setTheme(DEFAULT_THEME);
    setSaving(true);
    setSaveError("");
    try {
      await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: DEFAULT_THEME }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const uploadLogo = async (type: "default" | "hover" | "small", file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("logo must be under 5mb.");
      setTimeout(() => setLogoError(""), 4000);
      return;
    }
    setUploadingLogo(type);
    setLogoError("");
    try {
      const ext = file.name.split(".").pop() || "png";
      const blob = await upload(`logo-${type}-${Date.now()}.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/theme/upload",
      });
      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: blob.url, logoType: type }),
      });
      const d = await res.json();
      if (d.theme) setTheme(d.theme);
      else setLogoError(d.error || "failed to save logo.");
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "upload failed.");
      setTimeout(() => setLogoError(""), 4000);
    }
    setUploadingLogo(null);
  };

  const removeLogo = async (type: "default" | "hover" | "small") => {
    const key = type === "default" ? "logoDefault" : type === "hover" ? "logoHover" : "logoSmall";
    const updated = { ...theme, [key]: null };
    setTheme(updated);
    await fetch("/api/admin/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: updated }),
    }).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">← back to dashboard</a>
        <h1 className="mt-3 font-heading text-2xl text-brand-gold">website theme</h1>
        <p className="mt-1 text-sm text-brand-grey">customize colors, gradients, and logos. changes apply site-wide after save.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-lg bg-white/5" />)}
        </div>
      ) : (
        <>
          {/* Brand Colors */}
          <div className="mb-5 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
            <h2 className="mb-1 text-sm font-medium text-brand-pale-gold">brand colors</h2>
            <p className="mb-4 text-xs text-brand-grey">pick a seasonal preset or dial in custom colors.</p>

            {/* Seasonal presets */}
            <div className="mb-5 flex flex-wrap gap-2">
              {SEASONAL_PRESETS.map((p) => {
                const active = theme.brandGold === p.gold && theme.brandDark === p.dark;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setTheme((prev) => ({
                      ...prev,
                      brandGold: p.gold,
                      brandDarkGold: p.darkGold,
                      brandDark: p.dark,
                      headingStyle: p.style,
                      headingColor: p.gold,
                      headingGradientFrom: p.from,
                      headingGradientTo: p.to,
                    }))}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${active ? "bg-white/10 text-white" : "border border-brand-dark-gold/20 text-brand-grey hover:text-white"}`}
                  >
                    <span className="inline-block h-2.5 w-5 rounded-full" style={{ background: `linear-gradient(90deg, ${p.from}, ${p.to})` }} />
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Solid / Gradient toggle */}
            <div className="mb-4 flex gap-2">
              {(["solid", "gradient"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setTheme((prev) => ({ ...prev, headingStyle: style }))}
                  className={`rounded-lg px-4 py-2 text-xs transition-colors ${theme.headingStyle === style ? "bg-brand-gold/10 text-brand-gold" : "border border-brand-dark-gold/20 text-brand-grey hover:text-white"}`}
                >
                  {style} headings
                </button>
              ))}
            </div>

            {/* Gradient pickers */}
            {theme.headingStyle === "gradient" && (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <ColorField label="gradient from" value={theme.headingGradientFrom} onChange={(v) => setTheme((p) => ({ ...p, headingGradientFrom: v }))} />
                <ColorField label="gradient to" value={theme.headingGradientTo} onChange={(v) => setTheme((p) => ({ ...p, headingGradientTo: v }))} />
              </div>
            )}

            {/* Core color pickers */}
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <ColorField label="primary accent" value={theme.brandGold} onChange={(v) => setTheme((p) => ({ ...p, brandGold: v }))} />
              <ColorField label="secondary accent" value={theme.brandDarkGold} onChange={(v) => setTheme((p) => ({ ...p, brandDarkGold: v }))} />
              <ColorField label="background" value={theme.brandDark} onChange={(v) => setTheme((p) => ({ ...p, brandDark: v }))} />
            </div>

            {/* Live preview */}
            <div className="rounded-lg p-4" style={{ background: theme.brandDark }}>
              {theme.headingStyle === "gradient" ? (
                <>
                  <p className="w-fit bg-clip-text text-xs text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${theme.headingGradientFrom}cc, ${theme.headingGradientTo}cc)` }}>preview text</p>
                  <p className="w-fit bg-clip-text font-heading text-lg font-bold text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${theme.headingGradientFrom}, ${theme.headingGradientTo})` }}>ATHELES</p>
                </>
              ) : (
                <>
                  <p className="text-xs" style={{ color: theme.brandDarkGold }}>preview text</p>
                  <p className="font-heading text-lg" style={{ color: theme.brandGold }}>ATHELES</p>
                </>
              )}
              <div className="mt-1 h-px w-16" style={{ background: `linear-gradient(90deg, ${theme.headingGradientFrom || theme.brandGold}, ${theme.headingGradientTo || theme.brandDarkGold})` }} />
            </div>
          </div>

          {/* Logos */}
          <div className="mb-5 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
            <h2 className="mb-1 text-sm font-medium text-brand-pale-gold">logo images</h2>
            <p className="mb-4 text-xs text-brand-grey">upload custom logos for seasonal campaigns. leave empty to use the default atheles wordmark.</p>

            {logoError && (
              <div className="mb-3 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2">
                <p className="text-xs text-red-400">{logoError}</p>
              </div>
            )}

            <div className="space-y-4">
              {([
                { type: "default" as const, label: "main logo", desc: "shown in the navbar by default" },
                { type: "hover" as const, label: "hover logo", desc: "shown when hovering over the logo" },
                { type: "small" as const, label: "small logo", desc: "used in the mobile menu and footer" },
              ]).map((logo) => {
                const key = logo.type === "default" ? "logoDefault" : logo.type === "hover" ? "logoHover" : "logoSmall";
                const current = theme[key];
                const isUploading = uploadingLogo === logo.type;
                return (
                  <div key={logo.type} className="flex items-center gap-4">
                    <div className="relative h-10 w-20 flex-none overflow-hidden rounded bg-white/5">
                      {current
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={current} alt="" className="h-full w-full object-contain" />
                        : <div className="flex h-full w-full items-center justify-center text-[8px] text-brand-grey">default</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">{logo.label}</p>
                      <p className="text-[10px] text-brand-grey">{logo.desc}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <label className={`cursor-pointer text-xs text-brand-gold hover:text-brand-pale-gold ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                        {isUploading ? "uploading..." : "upload"}
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={isUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(logo.type, f); e.target.value = ""; }} className="hidden" />
                      </label>
                      {current && <button type="button" onClick={() => removeLogo(logo.type)} className="text-xs text-brand-grey hover:text-red-400">remove</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save / Reset */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="rounded-full bg-brand-gold px-6 py-2.5 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-50">
              {saving ? "saving..." : "save changes"}
            </button>
            <button type="button" onClick={resetToDefault} disabled={saving} className="rounded-full border border-brand-dark-gold/30 px-4 py-2.5 text-xs uppercase tracking-wider text-brand-grey transition-colors hover:text-red-400 disabled:opacity-50">
              reset to default
            </button>
            {saved && <span className="text-xs text-green-400">saved! refresh the site to see changes.</span>}
            {saveError && <span className="text-xs text-red-400">{saveError}</span>}
          </div>

          <div className="mt-5 rounded-lg border border-brand-dark-gold/20 bg-brand-dark-gold/5 p-4">
            <p className="text-xs text-brand-grey">
              <strong className="text-brand-pale-gold">note:</strong> color and gradient changes apply globally via CSS custom properties. logo changes affect the navbar, mobile menu, and footer. everything persists across deploys via shopify metafields.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
