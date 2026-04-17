"use client";

import dynamic from "next/dynamic";

// next/dynamic with ssr:false must live in a Client Component.
// layout.tsx is a Server Component so the dynamic() call was moved here.
export const ThemeBackgroundCanvas = dynamic(
  () =>
    import("components/theme-background-canvas").then(
      (m) => m.ThemeBackgroundCanvas,
    ),
  { ssr: false },
);
