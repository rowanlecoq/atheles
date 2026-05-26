"use client";

import { useLayoutEffect } from "react";

const CM_KEY = "atheles-color-mode";

function applyColorMode() {
  try {
    const mode = localStorage.getItem(CM_KEY) ?? "dark";
    document.documentElement.setAttribute("data-color-mode", mode === "light" ? "light" : "dark");
    document.documentElement.style.colorScheme = mode === "light" ? "light" : "dark";
  } catch {}
}

export function ColorModeApplier() {
  useLayoutEffect(() => {
    applyColorMode();
    const handler = () => applyColorMode();
    window.addEventListener("atheles-color-mode-change", handler);
    return () => window.removeEventListener("atheles-color-mode-change", handler);
  }, []);

  return null;
}
