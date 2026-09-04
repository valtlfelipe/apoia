"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * A minimal dropdown menu — no Radix/headless-ui dependency, matching the
 * rest of this repo's hand-rolled components/ui/*. Closes on outside
 * click, Escape, or activating a DropdownMenuItem (mouse or keyboard —
 * native <button> elements handle both via the same click event, so a menu
 * item that submits a form doesn't leave the menu stuck open while its
 * request is in flight).
 */

const CloseMenuContext = createContext<() => void>(() => {});

export function DropdownMenu({
  children,
  label = "Ações",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-subtle hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop"
        >
          <CloseMenuContext.Provider value={close}>{children}</CloseMenuContext.Provider>
        </div>
      ) : null}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  variant = "default",
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "danger" }) {
  const close = useContext(CloseMenuContext);

  return (
    <button
      type="submit"
      role="menuitem"
      onClick={(event) => {
        onClick?.(event);
        close();
      }}
      className={
        variant === "danger"
          ? "block w-full px-3 py-2 text-left text-sm text-danger-ink transition-colors hover:bg-danger-soft"
          : "block w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-subtle"
      }
      {...props}
    >
      {children}
    </button>
  );
}
