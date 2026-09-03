"use client";

import Image from "next/image";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { ConfettiBurst } from "@/components/confetti-burst";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";

export type PendingCharge = {
  id: string;
  amountCents: number;
  brCode: string;
  qrCodeImage: string;
  expiresAt: string | null;
};

type ChargeStatus = "pending" | "paid" | "expired";

type PaymentDialogProps = {
  charge: PendingCharge | null;
  onClose: () => void;
  onConfirmed: () => void;
  thankYouMessage: string;
};

const POLL_INTERVAL_MS = 3000;

function useCountdown(expiresAt: string | null, active: boolean) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt || !active) return;
    const target = new Date(expiresAt).getTime();

    const tick = () => setSecondsLeft(Math.max(0, Math.round((target - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, active]);

  return secondsLeft;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PaymentDialog({
  charge,
  onClose,
  onConfirmed,
  thankYouMessage,
}: PaymentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<ChargeStatus>("pending");
  const [copied, setCopied] = useState(false);

  const isOpen = charge !== null;
  const secondsLeft = useCountdown(charge?.expiresAt ?? null, isOpen && status === "pending");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      setStatus("pending");
      setCopied(false);
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (secondsLeft === 0 && status === "pending") {
      setStatus("expired");
    }
  }, [secondsLeft, status]);

  // Poll for payment confirmation as a fallback to the webhook.
  useEffect(() => {
    if (!isOpen || !charge || status !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/support/${charge.id}/status`);
        if (!response.ok) return;
        const data = (await response.json()) as { status: ChargeStatus };
        if (data.status !== "pending") {
          setStatus(data.status);
        }
      } catch {
        // Best-effort — try again next tick.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isOpen, charge, status]);

  // useEffectEvent gives a stable reference to the *latest* onConfirmed
  // without it being an effect dependency. Without this, an onConfirmed that
  // isn't itself stable across renders (e.g. an inline `() =>
  // router.refresh()`) re-fires this effect every time it's called — and
  // since router.refresh() causes a re-render, that's an infinite loop.
  const onConfirmedEvent = useEffectEvent(onConfirmed);

  useEffect(() => {
    if (status === "paid") {
      onConfirmedEvent();
    }
  }, [status]);

  const handleCopy = useCallback(async () => {
    if (!charge) return;
    try {
      await navigator.clipboard.writeText(charge.brCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — the code is
      // still selectable/visible as a fallback, so this is non-fatal.
    }
  }, [charge]);

  const handleDialogClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClose={handleDialogClose}
      className="shadow-card w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-text)] backdrop:bg-transparent"
    >
      {charge ? (
        <div className="p-6">
          {status === "paid" ? (
            <SuccessState
              amountCents={charge.amountCents}
              thankYouMessage={thankYouMessage}
              onClose={() => dialogRef.current?.close()}
            />
          ) : status === "expired" ? (
            <ExpiredState onClose={() => dialogRef.current?.close()} />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex w-full items-start justify-between">
                <div>
                  <p className="font-display text-2xl font-medium">
                    {formatCents(charge.amountCents)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">Escaneie para apoiar</p>
                </div>
                <div className="flex items-center gap-2">
                  {secondsLeft !== null ? (
                    <span className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)] tabular-nums">
                      {formatCountdown(secondsLeft)}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => dialogRef.current?.close()}
                    aria-label="Fechar"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <Image
                  src={charge.qrCodeImage}
                  alt="QR Code Pix"
                  width={208}
                  height={208}
                  unoptimized
                />
              </div>

              <Button type="button" variant="secondary" className="w-full" onClick={handleCopy}>
                {copied ? "Código copiado ✓" : "Copiar código Pix"}
              </Button>

              <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                </span>
                Aguardando confirmação do pagamento…
              </div>
            </div>
          )}
        </div>
      ) : null}
    </dialog>
  );
}

function SuccessState({
  amountCents,
  thankYouMessage,
  onClose,
}: {
  amountCents: number;
  thankYouMessage: string;
  onClose: () => void;
}) {
  const message = thankYouMessage.replace("{amount}", formatCents(amountCents));

  return (
    <div className="animate-fade-in flex flex-col items-center gap-3 py-4 text-center">
      <ConfettiBurst side="left" />
      <ConfettiBurst side="right" />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent-strong)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h2 className="font-display text-xl font-medium">Recebido!</h2>
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
      <Button type="button" onClick={onClose} className="mt-2">
        Fechar
      </Button>
    </div>
  );
}

function ExpiredState({ onClose }: { onClose: () => void }) {
  return (
    <div className="animate-fade-in flex flex-col items-center gap-3 py-4 text-center">
      <h2 className="font-display text-xl font-medium">Cobrança expirada</h2>
      <p className="text-sm text-[var(--color-text-muted)]">
        Esse código Pix não é mais válido. Feche esta janela e gere um novo apoio.
      </p>
      <Button type="button" variant="secondary" onClick={onClose} className="mt-2">
        Fechar
      </Button>
    </div>
  );
}
