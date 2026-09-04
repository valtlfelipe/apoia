"use client";

import { useEffect, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "apoia-theme";
const ORDER: ThemeMode[] = ["system", "light", "dark"];
const LABELS: Record<ThemeMode, string> = {
  system: "Tema do sistema",
  light: "Tema claro",
  dark: "Tema escuro",
};

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }
}

function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // localStorage can throw (private mode, disabled) — fall back to system.
  }
  return "system";
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readStoredTheme();
    setMode(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length] ?? "system";
    setMode(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal — the preference just won't survive a reload.
    }
  }

  // Render an identically-sized placeholder until mounted, so the very first
  // client render matches the server's HTML exactly (no hydration mismatch,
  // no icon that briefly shows the wrong mode before localStorage is read).
  if (!mounted) {
    return <div className="size-9" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={LABELS[mode]}
      aria-label={`${LABELS[mode]} — clique para alternar`}
      className="flex size-9 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {mode === "system" ? <SystemIcon /> : mode === "light" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 3v1.5M12 19.5V21M4.93 4.93l1.06 1.06M17.5 17.5l1.06 1.06M3 12h1.5M19.5 12H21M4.93 19.07l1.06-1.06M17.5 6.5l1.06-1.06"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.5 14.5a8.5 8.5 0 1 1-9-11 7 7 0 0 0 9 11Z"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path strokeLinecap="round" d="M8 20h8M12 16.5V20" />
    </svg>
  );
}
