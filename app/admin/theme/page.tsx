"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

const PRESET_COLORS = [
  { name: "gold (default)", gold: "#ccb173", darkGold: "#7f6f4c" },
  { name: "silver", gold: "#c0c0c0", darkGold: "#808080" },
  { name: "rose gold", gold: "#e8a87c", darkGold: "#9c6644" },
  { name: "icy blue", gold: "#7ec8e3", darkGold: "#4a7c9b" },
  { name: "emerald", gold: "#50c878", darkGold: "#2e7d32" },
  { name: "crimson", gold: "#dc3545", darkGold: "#8b1a1a" },
  { name: "purple", gold: "#9b59b6", darkGold: "#6c3483" },
];

const GRADIENT_PRESETS = [
  { name: "gold shimmer", from: "#ccb173", to: "#e5c685" },
  { name: "sunset", from: "#f97316", to: "#ec4899" },
  { name: "ocean", from: "#22d3ee", to: "#3b82f6" },
  { name: "emerald", from: "#10b981", to: "#34d399" },
  { name: "purple haze", from: "#8b5cf6", to: "#ec4899" },
  { name: "fire", from: "#ef4444", to: "#f59e0b" },
  { name: "arctic", from: "#6366f1", to: "#22d3ee" },
];

export default function AdminThemePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isAdmin) {
          setAuthorized(true);
          fetch("/api/admin/theme")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.theme) setTheme({ ...DEFAULT_THEME, ...d.theme }); })
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const uploadLogo = async (type: "default" | "hover" | "small", file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert("logo must be under 5mb"); return; }
    setUploadingLogo(type);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoFile: dataUrl, logoType: type }),
      });
      const d = await res.json();
      if (d.theme) setTheme(d.theme);
    } catch {}
    setUploadingLogo(null);
  };

  const removeLogo = (type: "default" | "hover" | "small") => {
    const key = type === "default" ? "logoDefault" : type === "hover" ? "logoHover" : "logoSmall";
    setTheme((prev) => ({ ...prev, [key]: null }));
  };

  if (!authorized) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-sm text-brand-grey">checking access...</p></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <a href="/admin" className="text-xs text-brand-grey hover:text-brand-gold">← back to dashboard</a>
        <h1 className="mt-2 font-heading text-2xl text-brand-gold">website theme</h1>
        <p className="mt-1 text-sm text-brand-grey">customize colors, gradients, and logos. changes apply globally after save.</p>
      </div>

      {loading ? <p className="text-sm text-brand-grey">loading...</p> : (
        <>
          {/* Brand Colors */}
          <div className="mb-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
            <h2 className="mb-3 text-sm font-medium text-brand-pale-gold">brand colors</h2>
            <p className="mb-4 text-xs text-brand-grey">choose a preset or set custom colors.</p>

            <div className="mb-4 flex flex-wrap gap-2">
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setTheme((prev) => ({ ...prev, brandGold: p.gold, brandDarkGold: p.darkGold, headingColor: p.gold, headingGradientFrom: p.gold }))}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${theme.brandGold === p.gold ? "bg-white/10 text-white" : "border border-brand-dark-gold/20 text-brand-grey hover:text-white"}`}
                >
                  <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.gold }} />
                  {p.name}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">primary accent</label>
                <div className="flex gap-2">
                  <input type="color" value={theme.brandGold} onChange={(e) => setTheme((prev) => ({ ...prev, brandGold: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-brand-dark-gold/20 bg-transparent" />
                  <input type="text" value={theme.brandGold} onChange={(e) => setTheme((prev) => ({ ...prev, brandGold: e.target.value }))} className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-2 py-1 text-xs text-white font-mono focus:border-brand-gold focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">secondary accent</label>
                <div className="flex gap-2">
                  <input type="color" value={theme.brandDarkGold} onChange={(e) => setTheme((prev) => ({ ...prev, brandDarkGold: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-brand-dark-gold/20 bg-transparent" />
                  <input type="text" value={theme.brandDarkGold} onChange={(e) => setTheme((prev) => ({ ...prev, brandDarkGold: e.target.value }))} className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-2 py-1 text-xs text-white font-mono focus:border-brand-gold focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">background</label>
                <div className="flex gap-2">
                  <input type="color" value={theme.brandDark} onChange={(e) => setTheme((prev) => ({ ...prev, brandDark: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-brand-dark-gold/20 bg-transparent" />
                  <input type="text" value={theme.brandDark} onChange={(e) => setTheme((prev) => ({ ...prev, brandDark: e.target.value }))} className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-2 py-1 text-xs text-white font-mono focus:border-brand-gold focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 rounded-lg p-4" style={{ background: theme.brandDark }}>
              <p className="text-xs" style={{ color: theme.brandDarkGold }}>preview text</p>
              <p className="font-heading text-lg" style={{ color: theme.brandGold }}>ATHELES</p>
              <div className="mt-1 h-px w-16" style={{ background: theme.brandDarkGold }} />
            </div>
          </div>

          {/* Heading Text Style */}
          <div className="mb-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
            <h2 className="mb-3 text-sm font-medium text-brand-pale-gold">heading text style</h2>

            <div className="mb-4 flex gap-3">
              <button
                type="button"
                onClick={() => setTheme((prev) => ({ ...prev, headingStyle: "solid" }))}
                className={`rounded-lg px-4 py-2 text-xs ${theme.headingStyle === "solid" ? "bg-brand-gold/10 text-brand-gold" : "border border-brand-dark-gold/20 text-brand-grey"}`}
              >solid color</button>
              <button
                type="button"
                onClick={() => setTheme((prev) => ({ ...prev, headingStyle: "gradient" }))}
                className={`rounded-lg px-4 py-2 text-xs ${theme.headingStyle === "gradient" ? "bg-brand-gold/10 text-brand-gold" : "border border-brand-dark-gold/20 text-brand-grey"}`}
              >gradient</button>
            </div>

            {theme.headingStyle === "solid" ? (
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">heading color</label>
                <div className="flex gap-2">
                  <input type="color" value={theme.headingColor} onChange={(e) => setTheme((prev) => ({ ...prev, headingColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-brand-dark-gold/20 bg-transparent" />
                  <input type="text" value={theme.headingColor} onChange={(e) => setTheme((prev) => ({ ...prev, headingColor: e.target.value }))} className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-2 py-1 text-xs text-white font-mono focus:border-brand-gold focus:outline-none" />
                </div>
                <p className="mt-3 font-heading text-2xl" style={{ color: theme.headingColor }}>preview heading</p>
              </div>
            ) : (
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => setTheme((prev) => ({ ...prev, headingGradientFrom: g.from, headingGradientTo: g.to }))}
                      className="rounded-full border border-brand-dark-gold/20 px-3 py-1.5 text-xs text-brand-grey hover:text-white"
                    >
                      <span className="mr-1.5 inline-block h-2.5 w-6 rounded-full" style={{ background: `linear-gradient(90deg, ${g.from}, ${g.to})` }} />
                      {g.name}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">gradient from</label>
                    <div className="flex gap-2">
                      <input type="color" value={theme.headingGradientFrom} onChange={(e) => setTheme((prev) => ({ ...prev, headingGradientFrom: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-brand-dark-gold/20 bg-transparent" />
                      <input type="text" value={theme.headingGradientFrom} onChange={(e) => setTheme((prev) => ({ ...prev, headingGradientFrom: e.target.value }))} className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-2 py-1 text-xs text-white font-mono focus:border-brand-gold focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-brand-grey">gradient to</label>
                    <div className="flex gap-2">
                      <input type="color" value={theme.headingGradientTo} onChange={(e) => setTheme((prev) => ({ ...prev, headingGradientTo: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-brand-dark-gold/20 bg-transparent" />
                      <input type="text" value={theme.headingGradientTo} onChange={(e) => setTheme((prev) => ({ ...prev, headingGradientTo: e.target.value }))} className="flex-1 rounded border border-brand-dark-gold/20 bg-transparent px-2 py-1 text-xs text-white font-mono focus:border-brand-gold focus:outline-none" />
                    </div>
                  </div>
                </div>
                <p className="mt-3 bg-clip-text font-heading text-2xl font-bold text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${theme.headingGradientFrom}, ${theme.headingGradientTo})` }}>preview heading</p>
              </div>
            )}
          </div>

          {/* Logo Management */}
          <div className="mb-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
            <h2 className="mb-3 text-sm font-medium text-brand-pale-gold">logo images</h2>
            <p className="mb-4 text-xs text-brand-grey">upload custom logos for seasonal updates. leave empty to use the default atheles logo.</p>

            <div className="space-y-4">
              {([
                { type: "default" as const, label: "main logo", desc: "shown in the navbar (the one users see normally)" },
                { type: "hover" as const, label: "hover logo", desc: "shown when hovering over the logo" },
                { type: "small" as const, label: "small logo", desc: "used in the mobile menu and footer" },
              ]).map((logo) => {
                const key = logo.type === "default" ? "logoDefault" : logo.type === "hover" ? "logoHover" : "logoSmall";
                const current = theme[key];
                return (
                  <div key={logo.type} className="flex items-center gap-3">
                    <div className="relative h-12 w-20 flex-none overflow-hidden rounded bg-brand-medium-grey/10">
                      {current ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={current} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[8px] text-brand-grey">default</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white">{logo.label}</p>
                      <p className="text-[10px] text-brand-grey">{logo.desc}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={`cursor-pointer text-xs text-brand-gold hover:text-brand-pale-gold ${uploadingLogo === logo.type ? "opacity-50" : ""}`}>
                        {uploadingLogo === logo.type ? "..." : "upload"}
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={uploadingLogo === logo.type} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(logo.type, f); e.target.value = ""; }} className="hidden" />
                      </label>
                      {current && <button type="button" onClick={() => removeLogo(logo.type)} className="text-xs text-brand-grey hover:text-red-400">remove</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save + Reset */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="rounded-full bg-brand-gold px-6 py-2.5 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-50">
              {saving ? "saving..." : "save changes"}
            </button>
            <button
              type="button"
              onClick={() => { setTheme(DEFAULT_THEME); }}
              className="rounded-full border border-brand-dark-gold/30 px-4 py-2.5 text-xs uppercase tracking-wider text-brand-grey transition-colors hover:text-red-400"
            >
              reset all to default
            </button>
            {saved && <span className="text-xs text-green-400">saved! refresh the site to see changes.</span>}
          </div>

          <div className="mt-6 rounded-lg border border-brand-dark-gold/20 bg-brand-dark-gold/5 p-4">
            <p className="text-xs text-brand-grey">
              <strong className="text-brand-pale-gold">note:</strong> color changes update CSS custom properties across the entire site. logo changes affect the navbar, mobile menu, and footer. all changes persist across deploys via shopify metafields.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
