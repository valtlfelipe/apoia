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
    return <div className="h-9 w-9" aria-hidden="true" />;
  }

  return (
    <div className="group/tt relative inline-flex">
      <button
        type="button"
        onClick={cycle}
        aria-label={`${LABELS[mode]} — clique para alternar`}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        {mode === "system" ? <SystemIcon /> : mode === "light" ? <SunIcon /> : <MoonIcon />}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-10 mt-2 translate-y-[-2px] rounded-lg bg-[var(--color-text)] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-[var(--color-bg)] opacity-0 transition-all duration-150 group-hover/tt:translate-y-0 group-hover/tt:opacity-100 group-focus-within/tt:translate-y-0 group-focus-within/tt:opacity-100"
      >
        {LABELS[mode]}
      </span>
    </div>
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
