"use client";

import { useState } from "react";

/**
 * A small icon-only copy-to-clipboard button, for inline use next to a
 * truncated value (e.g. a Pix end-to-end id) — same
 * clipboard/timeout-revert pattern as components/payment-dialog.tsx's
 * "Copiar código Pix" button and components/admin/copy-link-button.tsx,
 * just rendered as an icon instead of a labeled button, for when there's a
 * value next to it already showing (truncated) and a full-width button
 * would be overkill.
 */
export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — the value
      // is still visible/selectable, so this is non-fatal.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copiado" : label}
      title={copied ? "Copiado!" : label}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
    >
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 text-[var(--color-accent)]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path strokeLinecap="round" d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      )}
    </button>
  );
}
