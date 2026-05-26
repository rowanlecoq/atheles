"use client";

import { useLayoutEffect } from "react";

const CM_KEY = "atheles-color-mode";

function applyColorMode() {
  try {
    const mode = localStorage.getItem(CM_KEY) ?? "dark";
    let effective: string;
    if (mode === "system") {
      effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      effective = mode === "light" ? "light" : "dark";
    }
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

    return () => {
      window.removeEventListener("atheles-color-mode-change", onChange);
      mq.removeEventListener("change", onMqChange);
    };
  }, []);

  return null;
}
