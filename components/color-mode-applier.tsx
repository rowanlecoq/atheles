"use client";

import { useLayoutEffect } from "react";

const CM_KEY = "atheles-color-mode";
const DESKTOP_BP = 1024;

function getEffective(mode: string): string {
  if (window.innerWidth >= DESKTOP_BP) return "dark";
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode === "light" ? "light" : "dark";
}

function applyColorMode() {
  try {
    const mode = localStorage.getItem(CM_KEY) ?? "dark";
    const effective = getEffective(mode);
    document.documentElement.setAttribute("data-color-mode", effective);
    document.documentElement.style.colorScheme = effective;
  } catch {}
}

export function ColorModeApplier() {
  useLayoutEffect(() => {
    applyColorMode();

    const onChange = () => applyColorMode();
    window.addEventListener("atheles-color-mode-change", onChange);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMqChange = () => {
      try {
        if ((localStorage.getItem(CM_KEY) ?? "dark") === "system") applyColorMode();
      } catch {}
    };
    mq.addEventListener("change", onMqChange);

    // Re-evaluate when crossing the desktop breakpoint
    const bpMq = window.matchMedia(`(min-width: ${DESKTOP_BP}px)`);
    const onBpChange = () => {
      applyColorMode();
      window.dispatchEvent(new CustomEvent("atheles-color-mode-change"));
    };
    bpMq.addEventListener("change", onBpChange);

    return () => {
      window.removeEventListener("atheles-color-mode-change", onChange);
      mq.removeEventListener("change", onMqChange);
      bpMq.removeEventListener("change", onBpChange);
    };
  }, []);

  return null;
}
