"use client";

import dynamic from "next/dynamic";

// Eagerly start fetching the canvas chunk as soon as this module loads —
// runs in parallel with React hydration so particles appear sooner.
if (typeof window !== "undefined") {
  import("components/theme-background-canvas");
}

// next/dynamic with ssr:false must live in a Client Component.
// layout.tsx is a Server Component so the dynamic() call was moved here.
export const ThemeBackgroundCanvas = dynamic(
  () =>
    import("components/theme-background-canvas").then(
      (m) => m.ThemeBackgroundCanvas,
    ),
  { ssr: false },
);
